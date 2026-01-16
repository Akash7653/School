import pytest
from httpx import AsyncClient, ASGITransport
from server import app, db
from auth import get_password_hash
from utils import generate_id, get_current_timestamp
import os

@pytest.mark.asyncio
async def test_update_and_delete_section_and_fee(fresh_db, ac):
    admin_email = f"admin_{generate_id('t_')}@example.com"
    password = "adminpass"

    admin_doc = {
        "user_id": generate_id('user_'),
        "email": admin_email,
        "name": "Admin Test",
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

    resp_login = await ac.post('/api/auth/login', json={"email": admin_email, "password": password})
    token = resp_login.json()['access_token']

    # create class (unique name)
    class_name = f"Class-{generate_id('c_')}"
    resp_create = await ac.post('/api/admin/classes', params={"name": class_name}, headers={"Authorization": f"Bearer {token}"})
    class_id = resp_create.json()['class']['class_id']

    # create section
    resp_sec = await ac.post('/api/admin/sections', params={"class_id": class_id, "name": "C", "capacity": 22}, headers={"Authorization": f"Bearer {token}"})
    section_id = resp_sec.json()['section']['section_id']

    # update section
    resp_up = await ac.put(f'/api/admin/sections/{section_id}', params={"name": "C1", "capacity": 25}, headers={"Authorization": f"Bearer {token}"})
    assert resp_up.status_code == 200
    assert resp_up.json()['section']['name'] == 'C1'

    # delete section
    resp_del = await ac.delete(f'/api/admin/sections/{section_id}', headers={"Authorization": f"Bearer {token}"})
    assert resp_del.status_code == 200

    # create fee
    resp_fee = await ac.post('/api/admin/fees', params={"class_id": class_id, "tuition_fee": 12000.0}, headers={"Authorization": f"Bearer {token}"})
    fee_id = resp_fee.json()['fee']['fee_id']

    # update fee
    resp_fee_up = await ac.put(f'/api/admin/fees/{fee_id}', params={"tuition_fee": 13000.0}, headers={"Authorization": f"Bearer {token}"})
    assert resp_fee_up.status_code == 200
    assert resp_fee_up.json()['fee']['tuition_fee'] == 13000.0

    # delete fee
    resp_fee_del = await ac.delete(f'/api/admin/fees/{fee_id}', headers={"Authorization": f"Bearer {token}"})
    assert resp_fee_del.status_code == 200

    # cleanup class
    await ac.delete(f'/api/admin/classes/{class_id}', headers={"Authorization": f"Bearer {token}"})

    # cleanup user (synchronous)
    from pymongo import MongoClient
    client = MongoClient(**{ 'host': os.environ.get('MONGO_URL') })
    test_db = client[os.environ.get('DB_NAME')]
    test_db.users.delete_one({"email": admin_email})
    client.close()
