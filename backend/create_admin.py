import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
from datetime import datetime, timezone

async def create_admin():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['smart_school_db']
    
    existing_admin = await db.users.find_one({'email': 'admin@sadhana.edu'})
    
    if not existing_admin:
        admin_doc = {
            'user_id': 'user_admin_001',
            'email': 'admin@sadhana.edu',
            'password': get_password_hash('admin123'),
            'name': 'School Administrator',
            'role': 'ADMIN',
            'is_active': True,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        print('Admin user created: admin@sadhana.edu / admin123')
    else:
        await db.users.update_one(
            {'email': 'admin@sadhana.edu'},
            {'$set': {'is_active': True}}
        )
        print('Admin user activated: admin@sadhana.edu / admin123')
        
    await client.close()

if __name__ == '__main__':
    asyncio.run(create_admin())
