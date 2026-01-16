import pytest
import asyncio
from httpx import AsyncClient
from server import app, db
from auth import get_password_hash
from utils import generate_id, get_current_timestamp
import os

@pytest.mark.asyncio
async def test_registration_and_admin_approval(monkeypatch, fresh_db, ac):
    # Use unique emails to avoid collisions
    student_email = f"test_student_{generate_id('t_')}@example.com"
    admin_email = f"test_admin_{generate_id('t_')}@example.com"
    password = "testpass123"

    # Create an admin user directly in DB
    admin_id = generate_id('user_')
    admin_doc = {
        "user_id": admin_id,
        "email": admin_email,
        "name": "Test Admin",
        "role": "ADMIN",
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
    test_db.users.insert_one(admin_doc)
    client.close()

    # Register a new student (should be pending)
    resp = await ac.post('/api/auth/register', json={
        'email': student_email,
        'password': password,
        'name': 'Test Student',
        'role': 'STUDENT'
    })
    assert resp.status_code == 200
    assert resp.json().get('message') is not None

    # Try to login as student -> should be 403 (pending approval)
    resp_login = await ac.post('/api/auth/login', json={"email": student_email, "password": password})
    assert resp_login.status_code == 403

    # Login as admin to approve
    resp_admin_login = await ac.post('/api/auth/login', json={"email": admin_email, "password": password})
    assert resp_admin_login.status_code == 200
    token = resp_admin_login.json()['access_token']

    # List pending users (should include student email)
    resp_pending = await ac.get('/api/admin/users/pending', headers={"Authorization": f"Bearer {token}"})
    assert resp_pending.status_code == 200
    pending = resp_pending.json()
    assert any(u['email'] == student_email for u in pending)
    user_id = next(u['user_id'] for u in pending if u['email'] == student_email)

    # Approve the user
    resp_approve = await ac.post(f'/api/admin/users/approve/{user_id}', headers={"Authorization": f"Bearer {token}"})
    assert resp_approve.status_code == 200

    # Now student should be able to login
    resp_login2 = await ac.post('/api/auth/login', json={"email": student_email, "password": password})
    assert resp_login2.status_code == 200

    # Cleanup (synchronous to avoid motor event loop issues)
    from pymongo import MongoClient
    client = MongoClient(**{ 'host': os.environ.get('MONGO_URL') })
    test_db = client[os.environ.get('DB_NAME')]
    test_db.users.delete_one({"email": admin_email})
    test_db.users.delete_one({"email": student_email})
    client.close()
