import pytest
from httpx import AsyncClient, ASGITransport
from server import app
from auth import get_password_hash
from utils import generate_id, get_current_timestamp
import os

@pytest.mark.asyncio
async def test_students_me_includes_student_id(fresh_db, ac):
    # Create a student user and profile synchronously using pymongo to avoid motor issues
    stud_user_id = generate_id('user_')
    stud_email = f"student_{generate_id('t_')}@example.com"
    stud_password = 'studpass'
    stud_user = {
        "user_id": stud_user_id,
        "email": stud_email,
        "name": "Test Student",
        "role": "STUDENT",
        "password": get_password_hash(stud_password),
        "is_active": True,
        "created_at": get_current_timestamp()
    }

    student_profile = {
        "student_id": generate_id('stu_'),
        "user_id": stud_user_id,
        "name": stud_user['name'],
        "email": stud_user['email'],
        "class_name": "10th",
        "section": "A",
        "roll_number": f"ROLL-{generate_id('r_')}",
        "created_at": get_current_timestamp()
    }

    from pymongo import MongoClient
    client = MongoClient(**{ 'host': os.environ.get('MONGO_URL') })
    test_db = client[os.environ.get('DB_NAME')]
    test_db.users.insert_one(stud_user)
    test_db.students.insert_one(student_profile)
    client.close()

    # Login as the student
    resp = await ac.post('/api/auth/login', json={"email": stud_email, "password": stud_password})
    assert resp.status_code == 200
    token = resp.json()['access_token']

    # Request student profile
    resp_profile = await ac.get('/api/students/me', headers={"Authorization": f"Bearer {token}"})
    assert resp_profile.status_code == 200
    data = resp_profile.json()
    assert 'student_id' in data and data['student_id'] == student_profile['student_id']

    # Cleanup
    from pymongo import MongoClient as MongoClient2
    client = MongoClient2(**{ 'host': os.environ.get('MONGO_URL') })
    test_db = client[os.environ.get('DB_NAME')]
    test_db.users.delete_one({"user_id": stud_user_id})
    test_db.students.delete_one({"student_id": student_profile['student_id']})
    client.close()
