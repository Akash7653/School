import pytest
from httpx import AsyncClient, ASGITransport
from server import app, db
from auth import get_password_hash
from utils import generate_id, get_current_timestamp

@pytest.mark.asyncio
async def test_class_and_section_crud(fresh_db, ac):
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
    await db.users.insert_one(admin_doc)

    # login
    resp_login = await ac.post('/api/auth/login', json={"email": admin_email, "password": password})
    assert resp_login.status_code == 200
    token = resp_login.json()['access_token']

    # create class (use unique name to avoid collisions)
    class_name = f"Class-{generate_id('c_')}"
    resp_create = await ac.post('/api/admin/classes', params={"name": class_name}, headers={"Authorization": f"Bearer {token}"})
    assert resp_create.status_code == 200
    class_id = resp_create.json()['class']['class_id']

    # list classes
    resp_list = await ac.get('/api/admin/classes', headers={"Authorization": f"Bearer {token}"})
    assert resp_list.status_code == 200
    items = resp_list.json().get('items', [])
    assert any(c['class_id'] == class_id for c in items)

    # create section
    resp_sec = await ac.post('/api/admin/sections', params={"class_id": class_id, "name": "A", "capacity": 20}, headers={"Authorization": f"Bearer {token}"})
    assert resp_sec.status_code == 200
    section_id = resp_sec.json()['section']['section_id']

    # list sections
    resp_secs = await ac.get(f'/api/admin/sections/{class_id}', headers={"Authorization": f"Bearer {token}"})
    assert resp_secs.status_code == 200
    items = resp_secs.json().get('items', [])
    assert any(s['section_id'] == section_id for s in items)

    # create fee structure
    resp_fee = await ac.post('/api/admin/fees', params={"class_id": class_id, "tuition_fee": 10000.0, "exam_fee": 1000.0, "lab_fee": 500.0, "transport": 2000.0, "frequency": "yearly"}, headers={"Authorization": f"Bearer {token}"})
    assert resp_fee.status_code == 200
    fee_id = resp_fee.json()['fee']['fee_id']

    # list fee structures
    resp_fees = await ac.get('/api/admin/fees', params={"class_id": class_id}, headers={"Authorization": f"Bearer {token}"})
    assert resp_fees.status_code == 200
    fees = resp_fees.json().get('items', [])
    assert any(f['fee_id'] == fee_id for f in fees)

    # cleanup: delete class (should remove related sections and fees)
    resp_del = await ac.delete(f'/api/admin/classes/{class_id}', headers={"Authorization": f"Bearer {token}"})
    assert resp_del.status_code == 200

    # cleanup user
    await db.users.delete_one({"email": admin_email})
