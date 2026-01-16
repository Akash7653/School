import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def init_database():
    """Initialize MongoDB database with collections and indexes"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print(f"Connecting to MongoDB at: {mongo_url}")
    print(f"Using database: {os.environ['DB_NAME']}")
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        
        # Create collections (they will be created automatically when first document is inserted)
        collections = [
            'users',
            'students', 
            'faculty',
            'parents',
            'attendance',
            'marks',
            'fees',
            'payments',
            'announcements',
            'timetable',
            'notifications'
        ]
        
        print("📋 Creating collections and indexes...")
        
        # Users collection indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_id", unique=True)
        print("✅ Users collection indexes created")
        
        # Students collection indexes
        await db.students.create_index("student_id", unique=True)
        await db.students.create_index("user_id", unique=True)
        await db.students.create_index("roll_number", unique=True)
        print("✅ Students collection indexes created")
        
        # Faculty collection indexes
        await db.faculty.create_index("faculty_id", unique=True)
        await db.faculty.create_index("user_id", unique=True)
        print("✅ Faculty collection indexes created")
        
        # Parents collection indexes
        await db.parents.create_index("parent_id", unique=True)
        await db.parents.create_index("user_id", unique=True)
        print("✅ Parents collection indexes created")
        
        # Attendance collection indexes
        await db.attendance.create_index("attendance_id", unique=True)
        await db.attendance.create_index([("student_id", 1), ("date", 1)])
        print("✅ Attendance collection indexes created")
        
        # Marks collection indexes
        await db.marks.create_index("marks_id", unique=True)
        await db.marks.create_index([("student_id", 1), ("subject", 1), ("exam_type", 1)])
        print("✅ Marks collection indexes created")
        
        # Fees collection indexes
        await db.fees.create_index("fee_id", unique=True)
        await db.fees.create_index("student_id")
        print("✅ Fees collection indexes created")
        
        # Payments collection indexes
        await db.payments.create_index("payment_id", unique=True)
        await db.payments.create_index("razorpay_order_id", unique=True)
        await db.payments.create_index("student_id")
        print("✅ Payments collection indexes created")
        
        # Announcements collection indexes
        await db.announcements.create_index("announcement_id", unique=True)
        await db.announcements.create_index([("target_roles", 1), ("created_at", -1)])
        print("✅ Announcements collection indexes created")
        
        # Timetable collection indexes
        await db.timetable.create_index([("class_name", 1), ("section", 1), ("day", 1)])
        print("✅ Timetable collection indexes created")
        
        # Notifications collection indexes
        await db.notifications.create_index("notification_id", unique=True)
        await db.notifications.create_index("user_id")
        print("✅ Notifications collection indexes created")
        
        # Insert a sample admin user for testing
        from utils import generate_id, get_current_timestamp
        from auth import get_password_hash
        
        admin_user = {
            "user_id": generate_id("user_"),
            "email": "admin@sadhanaschool.edu",
            "name": "System Administrator",
            "role": "ADMIN",
            "phone": "+919876543210",
            "password": get_password_hash("admin123"),
            "avatar": None,
            "is_active": True,
            "created_at": get_current_timestamp()
        }
        
        # Check if admin already exists
        existing_admin = await db.users.find_one({"email": admin_user["email"]})
        if not existing_admin:
            await db.users.insert_one(admin_user)
            print("✅ Default admin user created")
            print(f"   Email: {admin_user['email']}")
            print(f"   Password: admin123")
        else:
            print("ℹ️  Admin user already exists")
        
        print("\n🎉 Database initialization completed successfully!")
        print(f"📊 Database '{os.environ['DB_NAME']}' is ready for use.")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(init_database())
