import pytest
from httpx import AsyncClient, ASGITransport
from server import app, db
from auth import get_password_hash
from utils import generate_id, get_current_timestamp
import os

@pytest.mark.asyncio
async def test_bulk_attendance_and_student_record(monkeypatch, fresh_db, ac):
    # Setup: create a faculty and two students directly in DB
    password = "teachpass123"

    faculty_email = f"test_fac_{generate_id('t_')}@example.com"
    faculty_id = generate_id('user_')
    faculty_doc = {
        "user_id": faculty_id,
        "email": faculty_email,
        "name": "Test Faculty",
        "role": "FACULTY",
        "phone": None,
        "password": get_password_hash(password),
        "avatar": None,
        "is_active": True,
        "created_at": get_current_timestamp()
    }
    # Use synchronous pymongo for test setup to avoid motor event loop issues
    from pymongo import MongoClient
    client = MongoClient(**{ 'host': os.environ.get('MONGO_URL') })
    test_db = client[os.environ.get('DB_NAME')]
    test_db.users.insert_one(faculty_doc)
    client.close()

    students = []
    for i in range(2):
        user_id = generate_id('user_')
        stu = {
            "student_id": generate_id('stu_'),
            "user_id": user_id,
            "name": f"Student {i}",
            "email": f"student_{i}_{generate_id('t_')}@example.com",
            "class_name": "10th",
            "section": "A",
            "roll_number": f"ROLL-{generate_id('r_')}",
            "parent_id": None,
            "admission_date": get_current_timestamp(),
            "date_of_birth": None,
            "address": None,
            "created_at": get_current_timestamp()
        }
        students.append(stu)
        # Insert student profile synchronously
        client = MongoClient(**{ 'host': os.environ.get('MONGO_URL') })
        test_db = client[os.environ.get('DB_NAME')]
        test_db.students.insert_one(stu)
        client.close()

    # Login as faculty
    resp = await ac.post('/api/auth/login', json={"email": faculty_email, "password": password})
    assert resp.status_code == 200
    token = resp.json()['access_token']

    # Prepare bulk attendance payload (mark first present, second absent)
    records = [
        {"student_id": students[0]['student_id'], "date": "2025-01-01", "status": "PRESENT", "marked_by": faculty_id},
        {"student_id": students[1]['student_id'], "date": "2025-01-01", "status": "ABSENT", "marked_by": faculty_id}
    ]

    resp_att = await ac.post('/api/attendance/bulk', json={"records": records}, headers={"Authorization": f"Bearer {token}"})
    assert resp_att.status_code == 200
    assert 'Marked attendance for' in resp_att.json().get('message', '')

    # Verify attendance documents in DB (synchronous to avoid motor/event-loop issues)
    from pymongo import MongoClient
    client = MongoClient(**{ 'host': os.environ.get('MONGO_URL') })
    test_db = client[os.environ.get('DB_NAME')]
    att_docs = list(test_db.attendance.find({"date": "2025-01-01"}))
    client.close()
    assert len(att_docs) >= 2
    ids = [d['student_id'] for d in att_docs]
    assert students[0]['student_id'] in ids
    assert students[1]['student_id'] in ids

    # Check student attendance summary endpoint for first student
    resp_summary = await ac.get(f"/api/attendance/student/{students[0]['student_id']}", headers={"Authorization": f"Bearer {token}"})
    assert resp_summary.status_code == 200
    summary = resp_summary.json()
    assert summary['total_days'] >= 1
    assert summary['present_days'] >= 1

    # Access control: try marking attendance with a student token -> should be 403
    # Create and login a student user account (active)
    stud_user_id = generate_id('user_')
    stud_user = {
        "user_id": stud_user_id,
        "email": f"active_student_{generate_id('t_')}@example.com",
        "name": "Active Student",
        "role": "STUDENT",
        "password": get_password_hash('studpass'),
        "is_active": True,
        "created_at": get_current_timestamp()
    }
    # Insert student and profile synchronously to avoid motor loop issues
    from pymongo import MongoClient
    client = MongoClient(**{ 'host': os.environ.get('MONGO_URL') })
    test_db = client[os.environ.get('DB_NAME')]
    test_db.users.insert_one(stud_user)
    # Create a student profile
    stud_profile = {
        "student_id": generate_id('stu_'),
        "user_id": stud_user_id,
        "name": stud_user['name'],
        "email": stud_user['email'],
        "class_name": "10th",
        "section": "A",
        "roll_number": f"ROLL-{generate_id('r_')}",
        "created_at": get_current_timestamp()
    }
    test_db.students.insert_one(stud_profile)
    client.close()

    resp_login_stud = await ac.post('/api/auth/login', json={"email": stud_user['email'], "password": 'studpass'})
    assert resp_login_stud.status_code == 200
    stud_token = resp_login_stud.json()['access_token']

    resp_forbidden = await ac.post('/api/attendance/bulk', json={"records": records}, headers={"Authorization": f"Bearer {stud_token}"})
    assert resp_forbidden.status_code == 403
    # Cleanup (synchronous to avoid motor event loop issues)
    from pymongo import MongoClient
    client = MongoClient(**{ 'host': os.environ.get('MONGO_URL') })
    test_db = client[os.environ.get('DB_NAME')]
    test_db.users.delete_one({"email": faculty_email})
    for s in students:
        test_db.students.delete_one({"student_id": s['student_id']})
    test_db.attendance.delete_many({"date": "2025-01-01"})
    test_db.users.delete_one({"email": stud_user['email']})
    test_db.students.delete_one({"student_id": stud_profile['student_id']})
    client.close()
