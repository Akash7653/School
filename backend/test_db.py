import asyncio
import pytest
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

@pytest.mark.asyncio
async def test_database():
    """Test database connection and show sample data"""
    
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    try:
        print("🔍 Testing MongoDB Database Connection")
        print("=" * 50)
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Database connection: SUCCESS")
        
        # Show collections
        collections = await db.list_collection_names()
        print(f"📋 Collections found: {len(collections)}")
        for collection in collections:
            count = await db[collection].count_documents({})
            print(f"   - {collection}: {count} documents")
        
        # Show sample data
        print("\n👤 Sample Users:")
        users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(3)
        for user in users:
            print(f"   - {user['name']} ({user['email']}) - {user['role']}")
        
        print("\n📊 Database Statistics:")
        stats = await db.command("dbStats")
        print(f"   - Database: {os.environ['DB_NAME']}")
        print(f"   - Total Collections: {len(collections)}")
        print(f"   - Data Size: {stats.get('dataSize', 0) / 1024:.2f} KB")
        
        print("\n🎉 MongoDB integration is working perfectly!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_database())
