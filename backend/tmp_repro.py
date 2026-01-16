import asyncio
from httpx import AsyncClient, ASGITransport
from server import app, db
from auth import get_password_hash
from utils import generate_id, get_current_timestamp

async def reproduce():
    admin_email = f"admin_{generate_id('t_')}@example.com"
    password = 'adminpass'
    admin_doc = {
        'user_id': generate_id('user_'),
        'email': admin_email,
        'name': 'Admin Test',
        'role': 'ADMIN',
        'phone': None,
        'password': get_password_hash(password),
        'avatar': None,
        'is_active': True,
        'created_at': get_current_timestamp()
    }
    await db.users.insert_one(admin_doc)
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as ac:
        resp_login = await ac.post('/api/auth/login', json={'email': admin_email, 'password': password})
        print('login status', resp_login.status_code, resp_login.json())
        token = resp_login.json()['access_token']
        class_name = f"Class-{generate_id('c_')}"
        resp_create = await ac.post('/api/admin/classes', params={'name': class_name}, headers={'Authorization': f'Bearer {token}'})
        print('create status', resp_create.status_code)
        try:
            print('body:', resp_create.json())
        except Exception as e:
            print('text body:', resp_create.text)
    await db.users.delete_one({'email': admin_email})

if __name__ == '__main__':
    asyncio.run(reproduce())