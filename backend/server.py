from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from datetime import datetime, timezone
import razorpay
import hmac
import hashlib
from contextlib import asynccontextmanager

from models import (
    User, UserCreate, UserLogin, TokenResponse, UserRole,
    Student, StudentCreate, Faculty, FacultyCreate, Parent, ParentCreate,
    ParentMapping, ParentMappingCreate, FeeTracking, FeeTrackingCreate, FeeTrackingUpdate,
    Attendance, AttendanceCreate, AttendanceBulkCreate,
    Marks, MarksCreate, Fee, FeeCreate, Payment, PaymentCreate, PaymentVerify,
    Notification, NotificationCreate, Announcement, AnnouncementCreate,
    Timetable, TimetableCreate, ChatMessage, ChatResponse
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_role
)
from utils import generate_id, get_current_timestamp, calculate_percentage, generate_student_id

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URI = os.getenv("MONGODB_URI")
client = AsyncIOMotorClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000
)
db = client["smart_school_db"]

razorpay_key_id = os.environ.get('RAZORPAY_KEY_ID', '')
razorpay_key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
razorpay_client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret)) if razorpay_key_id else None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def initialize_database():
    """Initialize database indexes and default fee structures on startup"""
    try:
        # Get all existing indexes on the students collection
        indexes = await db.students.list_indexes().to_list(None)
        index_names = [idx.get("name") for idx in indexes]
        
        # Drop conflicting compound indexes if they exist
        target_index_name = "class_name_1_section_1_roll_number_1"
        if target_index_name in index_names:
            try:
                await db.students.drop_index(target_index_name)
                logger.info(f"Dropped existing index: {target_index_name}")
            except Exception as e:
                logger.warning(f"Could not drop index {target_index_name}: {e}")
        
        # Create a compound unique index on class_name, section, roll_number
        # sparse=True ensures null values are ignored in the unique constraint
        await db.students.create_index(
            [("class_name", 1), ("section", 1), ("roll_number", 1)],
            unique=True,
            sparse=True
        )
        logger.info("Created compound unique index on class_name, section, roll_number")
        
        # Initialize default fee structures for all classes
        # Class 10: ₹50,000 (Razorpay test limit), Class 9: ₹45,000, ..., Class 1: ₹5,000
        for class_num in range(1, 11):  # Classes 1-10
            class_id = str(class_num)
            total_fee = (class_num * 5000.0)  # Class 1: 5k, Class 2: 10k, ..., Class 10: 50k
            
            # Check if fee structure already exists
            existing = await db.fee_structures.find_one({"class_id": class_id, "section": None})
            if existing:
                # Update existing fee structure
                await db.fee_structures.update_one(
                    {"class_id": class_id, "section": None},
                    {"$set": {
                        "tuition_fee": total_fee * 0.625,
                        "exam_fee": total_fee * 0.125,
                        "lab_fee": total_fee * 0.0625,
                        "transport": total_fee * 0.1875,
                        "scholarship": 0.0,
                        "created_at": get_current_timestamp()
                    }}
                )
                logger.info(f"Updated default fee structure for class {class_num}: ₹{total_fee}")
            else:
                # Create default fee structure with fees proportional to class number
                fee_structure = {
                    "class_id": class_id,
                    "section": None,  # Class-wide structure
                    "tuition_fee": total_fee * 0.625,      # 62.5%
                    "exam_fee": total_fee * 0.125,         # 12.5%
                    "lab_fee": total_fee * 0.0625,         # 6.25%
                    "transport": total_fee * 0.1875,       # 18.75%
                    "scholarship": 0.0,
                    "created_at": get_current_timestamp()
                }
                await db.fee_structures.insert_one(fee_structure)
                logger.info(f"Created default fee structure for class {class_num}: ₹{total_fee}")
    except Exception as e:
        logger.error(f"Error initializing startup: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await initialize_database()
    yield
    # Shutdown (cleanup if needed)
    logger.info("Application shutdown")

app = FastAPI(
    title="Sadhana Memorial School Management System"
)
api_router = APIRouter(prefix="/api")

# Consistent HTTPException handler to return JSON {"error": message}
from fastapi.responses import JSONResponse

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://school-a8p3.vercel.app",
        "https://school-i163.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Health check endpoint for Render
@app.get("/health")
async def health():
    return {"status": "ok"}

@api_router.get("/")
async def root():
    return {"message": "Sadhana Memorial School API", "status": "active"}
# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = generate_id("user_")
    hashed_password = get_password_hash(user_data.password)
    
    # Require admin approval for non-admin users
    is_active = True if user_data.role == UserRole.ADMIN else False
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role.value,
        "phone": user_data.phone,
        "password": hashed_password,
        "avatar": None,
        "is_active": is_active,
        "created_at": get_current_timestamp()
    }
    
    await db.users.insert_one(user_doc)

    # Notify admins of new registration when approval is required
    if not is_active:
        from mailer import notify_admins_of_new_registration
        notify_admins_of_new_registration(user_doc)

    if not is_active:
        return {
            "message": "Registration submitted and is pending admin approval.",
            "user_id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "role": user_data.role.value
        }

    token_data = {"sub": user_id, "email": user_data.email, "role": user_data.role.value}
    access_token = create_access_token(token_data)
    user_response = User(**{k: v for k, v in user_doc.items() if k != "password"})
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/register-student")
async def register_student_enhanced(student_data: StudentCreate):
    """
    Enhanced student registration with all personal, academic, and parent details.
    Auto-generates unique Student ID and links parent information.
    """
    # Verify user exists
    user = await db.users.find_one({"user_id": student_data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    
    # Check if student profile already exists
    existing_student = await db.students.find_one({"user_id": student_data.user_id}, {"_id": 0})
    
    # If student doesn't exist, create it first
    if not existing_student:
        initial_student_doc = {
            "student_id": generate_id("stu_"),
            "unique_student_id": "PENDING",
            "user_id": student_data.user_id,
            "name": user.get("name"),
            "email": user.get("email"),
            "class_name": None,
            "section": None,
            "roll_number": None,
            "parent_ids": [],
            "admission_number": None,
            "admission_date": get_current_timestamp(),
            "date_of_birth": None,
            "gender": None,
            "blood_group": None,
            "aadhaar_id": None,
            "student_photo_url": None,
            "address": None,
            "academic_year": "2025-2026",
            "previous_school": None,
            "previous_class": None,
            "created_at": get_current_timestamp()
        }
        await db.students.insert_one(initial_student_doc)
        student = initial_student_doc
    else:
        student = existing_student
    
    # Validate class and section
    if not student_data.class_name or student_data.class_name not in [str(i) for i in range(1, 11)]:
        raise HTTPException(status_code=400, detail="Invalid class. Must be 1-10")
    
    if not student_data.section or student_data.section not in ['A', 'B', 'C']:
        raise HTTPException(status_code=400, detail="Invalid section. Must be A, B, or C")
    
    # Check section capacity (max 20 students)
    section_count = await db.students.count_documents({
        "class_name": student_data.class_name,
        "section": student_data.section,
        "unique_student_id": {"$ne": "PENDING"}  # Only count registered students
    })
    
    if section_count >= 20:
        raise HTTPException(status_code=400, detail=f"Section {student_data.section} of class {student_data.class_name} is full (max 20 students)")
    
    # Generate roll number based on section count
    roll_number = section_count + 1
    
    # Generate unique Student ID: SMS-YYYY-CLASS+SECTION-ROLL
    unique_student_id = generate_student_id(student_data.class_name, student_data.section, roll_number)
    
    # Update student document with all details
    update_data = {
        "unique_student_id": unique_student_id,
        "class_name": student_data.class_name,
        "section": student_data.section,
        "roll_number": str(roll_number),
        "admission_number": student_data.admission_number,
        "date_of_birth": student_data.date_of_birth,
        "gender": student_data.gender,
        "blood_group": student_data.blood_group,
        "aadhaar_id": student_data.aadhaar_id,
        "student_photo_url": student_data.student_photo_url,
        "address": student_data.address,
        "academic_year": student_data.academic_year,
        "previous_school": student_data.previous_school,
        "previous_class": student_data.previous_class,
        "parent_ids": student_data.parent_ids
    }
    
    await db.students.update_one({"user_id": student_data.user_id}, {"$set": update_data})
    
    # Fetch fee structure for the class and section
    fee_structure = await db.fee_structures.find_one({
        "class_id": student_data.class_name,
        "section": student_data.section
    }, {"_id": 0})
    
    if not fee_structure:
        # Try class-wide fee structure if section-specific not found
        fee_structure = await db.fee_structures.find_one({
            "class_id": student_data.class_name,
            "section": None
        }, {"_id": 0})
    
    # Create/update fee tracking
    if fee_structure:
        total_fee = (
            fee_structure.get("tuition_fee", 0) +
            fee_structure.get("exam_fee", 0) +
            fee_structure.get("lab_fee", 0) +
            fee_structure.get("transport", 0) -
            fee_structure.get("scholarship", 0)
        )
        
        fee_tracking_doc = {
            "tracking_id": generate_id("track_"),
            "student_id": student.get("student_id"),
            "unique_student_id": unique_student_id,
            "class_name": student_data.class_name,
            "section": student_data.section,
            "academic_year": student_data.academic_year,
            "total_fee_amount": total_fee,
            "paid_amount": 0.0,
            "pending_amount": total_fee,
            "payment_status": "PENDING",
            "payment_history": [],
            "created_at": get_current_timestamp(),
            "updated_at": get_current_timestamp()
        }
        await db.fee_tracking.insert_one(fee_tracking_doc)
    
    updated_student = await db.students.find_one({"user_id": student_data.user_id}, {"_id": 0})
    return {
        "message": "Student registration completed successfully",
        "student": updated_student,
        "student_id": unique_student_id
    }


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # ALL users (STUDENT, FACULTY, PARENT) require admin approval before login
    # Only ADMIN can login without approval
    if not user.get("is_active", False) and user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Account pending admin approval. Please wait for admin to approve your account.")
    
    token_data = {"sub": user["user_id"], "email": user["email"], "role": user["role"]}
    access_token = create_access_token(token_data)
    
    user_response = User(**{k: v for k, v in user.items() if k != "password"})
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

# Student Routes
@api_router.get("/students")
async def get_students(limit: int = 100, offset: int = 0, current_user: dict = Depends(require_role(["ADMIN", "FACULTY"]))):
    cursor = db.students.find({}, {"_id": 0}).skip(offset).limit(limit)
    students = await cursor.to_list(length=limit)
    
    # Enrich students with fee tracking info
    enriched_students = []
    for student in students:
        unique_student_id = student.get("unique_student_id")
        student_id = student.get("student_id")
        
        # Try to find fee_tracking by unique_student_id first, then by student_id
        fee_tracking = None
        if unique_student_id and unique_student_id != "PENDING":
            fee_tracking = await db.fee_tracking.find_one(
                {"unique_student_id": unique_student_id},
                {"_id": 0, "payment_status": 1, "total_fee_amount": 1, "paid_amount": 1, "pending_amount": 1}
            )
        
        # If not found by unique_student_id, try student_id
        if not fee_tracking and student_id:
            fee_tracking = await db.fee_tracking.find_one(
                {"student_id": student_id},
                {"_id": 0, "payment_status": 1, "total_fee_amount": 1, "paid_amount": 1, "pending_amount": 1}
            )
        
        if fee_tracking:
            student["payment_status"] = fee_tracking.get("payment_status", "PENDING")
            student["total_fee_amount"] = fee_tracking.get("total_fee_amount", 0)
            student["paid_amount"] = fee_tracking.get("paid_amount", 0)
            student["pending_amount"] = fee_tracking.get("pending_amount", 0)
        else:
            student["payment_status"] = "PENDING"
            student["total_fee_amount"] = 0
            student["paid_amount"] = 0
            student["pending_amount"] = 0
        enriched_students.append(student)
    
    return {"items": enriched_students, "limit": limit, "offset": offset, "count": len(enriched_students)}

@api_router.get('/students/class/{class_name}/section/{section}')
async def get_students_by_class_section(class_name: str, section: str, current_user: dict = Depends(require_role(["FACULTY", "ADMIN"]))):
    students = await db.students.find({"class_name": class_name, "section": section}, {"_id": 0}).to_list(1000)
    
    # Enrich students with fee tracking info
    enriched_students = []
    for student in students:
        student_id = student.get("unique_student_id") or student.get("student_id")
        fee_tracking = await db.fee_tracking.find_one(
            {"unique_student_id": student_id},
            {"_id": 0, "payment_status": 1, "total_fee_amount": 1, "paid_amount": 1, "pending_amount": 1}
        )
        if fee_tracking:
            student["payment_status"] = fee_tracking.get("payment_status", "PENDING")
            student["total_fee_amount"] = fee_tracking.get("total_fee_amount", 0)
            student["paid_amount"] = fee_tracking.get("paid_amount", 0)
            student["pending_amount"] = fee_tracking.get("pending_amount", 0)
        else:
            student["payment_status"] = "PENDING"
            student["total_fee_amount"] = 0
            student["paid_amount"] = 0
            student["pending_amount"] = 0
        enriched_students.append(student)
    
    return {"items": enriched_students, "count": len(enriched_students)}

@api_router.get("/students/me")
async def get_my_student_profile(current_user: dict = Depends(require_role(["STUDENT"]))):
    student = await db.students.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student

# Attendance Routes
@api_router.post("/attendance/bulk")
async def mark_bulk_attendance(bulk_data: AttendanceBulkCreate, current_user: dict = Depends(require_role(["FACULTY", "ADMIN"]))):
    attendance_docs = []
    for record in bulk_data.records:
        doc = {
            "attendance_id": generate_id("att_"),
            **record.model_dump(),
            "created_at": get_current_timestamp()
        }
        attendance_docs.append(doc)
    
    if attendance_docs:
        await db.attendance.insert_many(attendance_docs)
    return {"message": f"Marked attendance for {len(attendance_docs)} students"}

@api_router.get("/attendance/student/{student_id}")
async def get_student_attendance(student_id: str, current_user: dict = Depends(get_current_user)):
    attendance_records = await db.attendance.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    total_days = len(attendance_records)
    present_days = len([r for r in attendance_records if r["status"] == "PRESENT"])
    percentage = calculate_percentage(present_days, total_days) if total_days > 0 else 0
    
    return {
        "records": attendance_records,
        "total_days": total_days,
        "present_days": present_days,
        "percentage": percentage
    }

# Marks Routes
@api_router.post("/marks", response_model=Marks)
async def upload_marks(marks_data: MarksCreate, current_user: dict = Depends(require_role(["FACULTY", "ADMIN"]))):
    marks_id = generate_id("mrk_")
    marks_doc = {
        "marks_id": marks_id,
        **marks_data.model_dump(),
        "created_at": get_current_timestamp()
    }
    await db.marks.insert_one(marks_doc)
    return Marks(**{k: v for k, v in marks_doc.items() if k != "_id"})

@api_router.get("/marks/student/{student_id}")
async def get_student_marks(student_id: str, current_user: dict = Depends(get_current_user)):
    marks = await db.marks.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return marks

# Fees Routes
@api_router.post("/fees", response_model=Fee)
async def create_fee(fee_data: FeeCreate, current_user: dict = Depends(require_role(["ADMIN"]))):
    fee_id = generate_id("fee_")
    fee_doc = {
        "fee_id": fee_id,
        **fee_data.model_dump(),
        "status": "PENDING",
        "created_at": get_current_timestamp()
    }
    await db.fees.insert_one(fee_doc)
    return Fee(**{k: v for k, v in fee_doc.items() if k != "_id"})

@api_router.get("/fees/student/{student_id}")
async def get_student_fees(student_id: str, current_user: dict = Depends(get_current_user)):
    # Get fee tracking information for the student
    # Try to find by student_id first, then by unique_student_id
    fee_tracking = await db.fee_tracking.find_one({"student_id": student_id}, {"_id": 0})
    if not fee_tracking:
        # Try with unique_student_id (e.g., SMS-2026-1A-001)
        fee_tracking = await db.fee_tracking.find_one({"unique_student_id": student_id}, {"_id": 0})
    
    if fee_tracking:
        return fee_tracking
    
    # Fallback: return empty tracking if not found
    return {
        "student_id": student_id,
        "total_fee_amount": 0.0,
        "paid_amount": 0.0,
        "pending_amount": 0.0,
        "payment_status": "PENDING",
        "payment_history": []
    }

# Payment Routes
@api_router.post("/payments/create-order")
async def create_payment_order(payment_data: PaymentCreate, current_user: dict = Depends(get_current_user)):
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment gateway not configured. Please add Razorpay keys.")
    
    try:
        amount_in_paise = int(payment_data.amount * 100)
        
        logger.info(f"Creating Razorpay order for amount: {payment_data.amount} INR ({amount_in_paise} paise)")
        
        order = razorpay_client.order.create({
            "amount": amount_in_paise,
            "currency": payment_data.currency,
            "payment_capture": 1
        })
        
        logger.info(f"Order created successfully: {order['id']}")
        
        return {
            "order_id": order["id"],
            "amount": amount_in_paise,
            "currency": payment_data.currency,
            "key_id": razorpay_key_id
        }
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment order creation failed: {str(e)}")

@api_router.post("/payments/verify")
async def verify_payment(verify_data: PaymentVerify, current_user: dict = Depends(get_current_user)):
    signature = hmac.new(
        razorpay_key_secret.encode(),
        f"{verify_data.razorpay_order_id}|{verify_data.razorpay_payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()
    
    if signature != verify_data.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    
    # Get the fee tracking record to update
    fee_tracking = await db.fee_tracking.find_one({"tracking_id": verify_data.fee_id})
    if not fee_tracking:
        raise HTTPException(status_code=404, detail="Fee tracking not found")
    
    # FIX: Use the amount from verify_data (passed from frontend), not total_fee_amount
    amount_paid = fee_tracking.get("paid_amount", 0) + verify_data.amount
    total_fee = fee_tracking.get("total_fee_amount", 0)
    pending_amount = max(0, total_fee - amount_paid)
    
    # Determine payment status
    if pending_amount <= 0:
        payment_status = "PAID"
    elif amount_paid > 0:
        payment_status = "PARTIAL"
    else:
        payment_status = "PENDING"
    
    # Create payment record for history
    payment_record = {
        "date": get_current_timestamp(),
        "amount": verify_data.amount,
        "method": "online",
        "razorpay_payment_id": verify_data.razorpay_payment_id,
        "razorpay_order_id": verify_data.razorpay_order_id
    }
    
    # Update fee_tracking with payment info
    await db.fee_tracking.update_one(
        {"tracking_id": verify_data.fee_id},
        {
            "$set": {
                "paid_amount": amount_paid,
                "pending_amount": pending_amount,
                "payment_status": payment_status,
                "last_payment_date": get_current_timestamp(),
                "updated_at": get_current_timestamp()
            },
            "$push": {
                "payment_history": payment_record
            }
        }
    )
    
    # Also update fees collection for backward compatibility
    await db.fees.update_one(
        {"fee_id": verify_data.fee_id},
        {"$set": {"status": payment_status}}
    )
    
    # Create payment record
    payment_doc = {
        "payment_id": generate_id("pay_"),
        "fee_id": verify_data.fee_id,
        "student_id": verify_data.student_id,
        "unique_student_id": fee_tracking.get("unique_student_id"),
        "razorpay_order_id": verify_data.razorpay_order_id,
        "razorpay_payment_id": verify_data.razorpay_payment_id,
        "amount": verify_data.amount,
        "status": "SUCCESS",
        "payment_date": get_current_timestamp(),
        "created_at": get_current_timestamp()
    }
    await db.payments.insert_one(payment_doc)
    
    logger.info(f"Payment verified successfully for student {verify_data.student_id}: {verify_data.razorpay_payment_id}")
    
    return {"message": "Payment verified successfully", "status": "SUCCESS"}

@api_router.get("/payments/student/{student_id}")
async def get_student_payments(student_id: str, current_user: dict = Depends(get_current_user)):
    payments = await db.payments.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    # Map payment fields to match frontend expectations
    mapped_payments = []
    for payment in payments:
        mapped_payments.append({
            "payment_id": payment.get("payment_id"),
            "transaction_id": payment.get("razorpay_payment_id", payment.get("payment_id")),
            "fee_id": payment.get("fee_id"),
            "amount": payment.get("amount", 0),
            "status": payment.get("status", "PENDING"),
            "payment_date": payment.get("created_at", payment.get("payment_date")),
            "razorpay_order_id": payment.get("razorpay_order_id"),
            "razorpay_payment_id": payment.get("razorpay_payment_id")
        })
    
    return mapped_payments

# Fee Tracking Routes (for parents and students)
@api_router.get("/fees/student-id/{unique_student_id}")
async def get_fees_by_student_id(unique_student_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get fee tracking by unique Student ID (SMS-YYYY-CLASS+SECTION-ROLL format)
    Used by parents to check fees using Student ID
    """
    fee_tracking = await db.fee_tracking.find_one({"unique_student_id": unique_student_id}, {"_id": 0})
    if not fee_tracking:
        raise HTTPException(status_code=404, detail="Fee record not found for this Student ID")
    return fee_tracking

@api_router.post("/fees/pay-by-student-id")
async def pay_fees_by_student_id(unique_student_id: str, amount: float, current_user: dict = Depends(require_role(["PARENT", "STUDENT"]))):
    """
    Parent pays fees using Student ID
    Creates payment order and updates fee tracking
    """
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    # Fetch fee tracking
    fee_tracking = await db.fee_tracking.find_one({"unique_student_id": unique_student_id}, {"_id": 0})
    if not fee_tracking:
        raise HTTPException(status_code=404, detail="Fee record not found for this Student ID")
    
    # Create payment order
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment gateway not configured")
    
    try:
        amount_in_paise = int(amount * 100)
        order = razorpay_client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": 1
        })
        
        return {
            "order_id": order["id"],
            "amount": amount_in_paise,
            "currency": "INR",
            "key_id": razorpay_key_id,
            "unique_student_id": unique_student_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fees/verify-payment-by-student-id")
async def verify_payment_by_student_id(unique_student_id: str, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str, amount: float, current_user: dict = Depends(require_role(["PARENT", "STUDENT"]))):
    """
    Verify payment made by parent using Student ID
    Updates fee tracking with payment details
    """
    # Verify signature
    signature = hmac.new(
        razorpay_key_secret.encode(),
        f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()
    
    if signature != razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    
    # Get fee tracking
    fee_tracking = await db.fee_tracking.find_one({"unique_student_id": unique_student_id}, {"_id": 0})
    if not fee_tracking:
        raise HTTPException(status_code=404, detail="Fee record not found")
    
    # Update fee tracking
    new_paid_amount = fee_tracking.get("paid_amount", 0) + amount
    new_pending_amount = fee_tracking.get("total_fee_amount", 0) - new_paid_amount
    
    # Determine payment status
    if new_pending_amount <= 0:
        payment_status = "PAID"
    elif new_paid_amount > 0:
        payment_status = "PARTIAL"
    else:
        payment_status = "PENDING"
    
    # Add to payment history
    payment_record = {
        "date": get_current_timestamp(),
        "amount": amount,
        "method": "online",
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_order_id": razorpay_order_id
    }
    
    await db.fee_tracking.update_one(
        {"unique_student_id": unique_student_id},
        {
            "$set": {
                "paid_amount": new_paid_amount,
                "pending_amount": max(0, new_pending_amount),
                "payment_status": payment_status,
                "last_payment_date": get_current_timestamp(),
                "updated_at": get_current_timestamp()
            },
            "$push": {"payment_history": payment_record}
        }
    )
    
    # Create payment record in payments collection
    payment_doc = {
        "payment_id": generate_id("pay_"),
        "unique_student_id": unique_student_id,
        "student_id": fee_tracking.get("student_id"),
        "amount": amount,
        "payment_method": "razorpay",
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": razorpay_payment_id,
        "status": "SUCCESS",
        "payment_date": get_current_timestamp(),
        "created_at": get_current_timestamp()
    }
    await db.payments.insert_one(payment_doc)
    
    return {
        "message": "Payment verified successfully",
        "status": "SUCCESS",
        "unique_student_id": unique_student_id,
        "paid_amount": new_paid_amount,
        "pending_amount": max(0, new_pending_amount),
        "payment_status": payment_status
    }

# Parent Mapping Routes
@api_router.post("/parent-mapping/register")
async def register_parent_with_student(mapping_data: ParentMappingCreate, current_user: dict = Depends(require_role(["PARENT", "ADMIN"]))):
    """
    Link parent to student using unique Student ID
    """
    # Verify student exists
    student = await db.students.find_one({"unique_student_id": mapping_data.unique_student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found with this Student ID")
    
    # Create parent mapping
    mapping_doc = {
        "mapping_id": generate_id("map_"),
        "parent_id": mapping_data.parent_id,
        "student_id": mapping_data.student_id,
        "unique_student_id": mapping_data.unique_student_id,
        "relationship": mapping_data.relationship,
        "parent_name": mapping_data.parent_name,
        "parent_email": mapping_data.parent_email,
        "parent_phone": mapping_data.parent_phone,
        "parent_occupation": mapping_data.parent_occupation,
        "parent_address": mapping_data.parent_address,
        "parent_pin_code": mapping_data.parent_pin_code,
        "created_at": get_current_timestamp()
    }
    
    await db.parent_mapping.insert_one(mapping_doc)
    
    # Update student's parent_ids list
    await db.students.update_one(
        {"student_id": mapping_data.student_id},
        {"$addToSet": {"parent_ids": mapping_data.parent_id}}
    )
    
    return {"message": "Parent successfully linked to student", "mapping": mapping_doc}

@api_router.get("/parent-mapping/student/{unique_student_id}")
async def get_parents_by_student_id(unique_student_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get all parents linked to a student using unique Student ID
    """
    parent_mappings = await db.parent_mapping.find({"unique_student_id": unique_student_id}, {"_id": 0}).to_list(100)
    # Return empty array instead of 404 - allows frontend to handle gracefully
    return {"parent_mappings": parent_mappings or [], "count": len(parent_mappings) if parent_mappings else 0}

# Announcements
@api_router.get("/announcements")
async def get_announcements(current_user: dict = Depends(get_current_user)):
    user_role = current_user["role"]
    announcements = await db.announcements.find(
        {"target_roles": user_role},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    return announcements

# Timetable
@api_router.get("/timetable/{class_name}/{section}")
async def get_timetable(class_name: str, section: str, current_user: dict = Depends(get_current_user)):
    timetable = await db.timetable.find(
        {"class_name": class_name, "section": section},
        {"_id": 0}
    ).to_list(10)
    return timetable

# Faculty Routes
@api_router.get("/faculty")
async def get_faculty_list(current_user: dict = Depends(require_role(["ADMIN"]))):
    faculty = await db.faculty.find({}, {"_id": 0}).to_list(1000)
    return {"items": faculty, "count": len(faculty)}

@api_router.get("/faculty/me")
async def get_my_faculty_profile(current_user: dict = Depends(require_role(["FACULTY"]))):
    faculty = await db.faculty.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    return faculty

# Teacher-specific Routes (assigned class & section access)
@api_router.get("/faculty/me/assigned-class-section")
async def get_faculty_assigned_class(current_user: dict = Depends(require_role(["FACULTY"]))):
    """
    Get the assigned class and section for this teacher
    """
    # Get teacher's faculty profile
    faculty = await db.faculty.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    
    # Get assigned class and section (stored in faculty record)
    assigned_class = faculty.get("assigned_class", None)
    assigned_section = faculty.get("assigned_section", None)
    
    return {
        "assigned_class": assigned_class,
        "assigned_section": assigned_section,
        "faculty_id": faculty.get("faculty_id"),
        "subject": faculty.get("subject")
    }

@api_router.get("/faculty/me/students")
async def get_my_class_students(current_user: dict = Depends(require_role(["FACULTY"]))):
    """
    Get all students in the teacher's assigned class and section
    Teachers can only see their own class/section students
    """
    # Get teacher's faculty profile
    faculty = await db.faculty.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    
    assigned_class = faculty.get("assigned_class")
    assigned_section = faculty.get("assigned_section")
    
    if not assigned_class or not assigned_section:
        return {
            "items": [],
            "message": "No class assigned to this teacher"
        }
    
    # Fetch students for this class/section only
    students = await db.students.find({
        "class_name": assigned_class,
        "section": assigned_section,
        "unique_student_id": {"$ne": "PENDING"}  # Only registered students
    }, {"_id": 0}).sort([("roll_number", 1)]).to_list(100)
    
    return {
        "items": students,
        "count": len(students),
        "class_name": assigned_class,
        "section": assigned_section
    }

@api_router.put("/faculty/me/update-assignment")
async def update_faculty_assignment(class_name: str, section: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    """
    Admin can assign class and section to a teacher
    """
    # Validate class and section
    if not class_name or class_name not in [str(i) for i in range(1, 11)]:
        raise HTTPException(status_code=400, detail="Invalid class. Must be 1-10")
    
    if not section or section not in ['A', 'B', 'C']:
        raise HTTPException(status_code=400, detail="Invalid section. Must be A, B, or C")
    
    # This endpoint would need faculty_id or user_id in the request
    # For now, it's a template for admin to assign teachers
    return {"message": "Use POST /admin/faculty/{faculty_id}/assign-class-section instead"}

# Parent Routes
@api_router.get("/parents/me/children")
async def get_parent_children(current_user: dict = Depends(require_role(["PARENT"]))):
    parent = await db.parents.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    
    children_ids = parent.get("children_ids", [])
    children = await db.students.find({"student_id": {"$in": children_ids}}, {"_id": 0}).to_list(100)
    return children

@api_router.get("/parents/{parent_id}")
async def get_parent_by_id(parent_id: str, current_user: dict = Depends(get_current_user)):
    """Get parent details by parent_id"""
    parent = await db.parents.find_one({"parent_id": parent_id}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent

@api_router.get("/parents/by-student/{student_id}")
async def get_parents_by_student_id(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get all parents who have this student in their children_ids"""
    parents = await db.parents.find({"children_ids": student_id}, {"_id": 0}).to_list(100)
    return {"parents": parents or [], "count": len(parents) if parents else 0}

@api_router.post("/parents/link-child/{student_id}")
async def link_child_to_parent(student_id: str, current_user: dict = Depends(require_role(["PARENT"]))):
    parent = await db.parents.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    
    student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await db.parents.update_one(
        {"user_id": current_user["user_id"]},
        {"$addToSet": {"children_ids": student_id}}
    )
    
    await db.students.update_one(
        {"student_id": student_id},
        {"$set": {"parent_id": parent["parent_id"]}}
    )
    
    return {"message": "Child linked successfully"}

@api_router.get("/parents/student/{student_id}/fees")
async def get_student_fees_for_parent(student_id: str, current_user: dict = Depends(require_role(["PARENT"]))):
    """Get fees for a student that is linked to the parent"""
    parent = await db.parents.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    
    # Check if student is linked to this parent
    student_ids = parent.get("children_ids", [])
    if student_id not in student_ids:
        raise HTTPException(status_code=403, detail="You do not have access to this student's information")
    
    # Get fee tracking for this student
    fee_tracking = await db.fee_tracking.find_one({"student_id": student_id}, {"_id": 0})
    if not fee_tracking:
        raise HTTPException(status_code=404, detail="No fees found for this student")
    
    return fee_tracking

# Admin Routes
@api_router.get("/admin/stats")
async def get_admin_stats(current_user: dict = Depends(require_role(["ADMIN"]))):
    # Count approved users (is_active=True) and also include records without is_active field (backward compatibility)
    total_students = await db.students.count_documents({"is_active": {"$ne": False}})
    total_faculty = await db.faculty.count_documents({"is_active": {"$ne": False}})
    total_parents = await db.parents.count_documents({"is_active": {"$ne": False}})
    
    # Get total pending fees amount from fee_tracking collection
    # Pending = total_fee_amount - paid_amount (or for PENDING status records, use total_fee_amount)
    pending_fees_result = await db.fee_tracking.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$pending_amount"}}}
    ]).to_list(1)
    
    pending_fees = pending_fees_result[0]["total"] if pending_fees_result else 0
    
    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_parents": total_parents,
        "pending_fees": pending_fees
    }

@api_router.get('/admin/users/pending')
async def list_pending_users(current_user: dict = Depends(require_role(["ADMIN"]))):
    pending = await db.users.find({"is_active": False}, {"_id": 0, "password": 0}).to_list(100)
    return pending

@api_router.post('/admin/users/approve/{user_id}')
async def approve_user(user_id: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    result = await db.users.update_one({"user_id": user_id}, {"$set": {"is_active": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user details to create role-specific profile
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create role-specific profile only after approval
    if user.get("role") == "STUDENT":
        # Check if student profile already exists
        existing_student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
        if not existing_student:
            student_doc = {
                "student_id": generate_id("stu_"),
                "unique_student_id": "PENDING",
                "user_id": user_id,
                "name": user.get("name"),
                "email": user.get("email"),
                "class_name": None,
                "section": None,
                "roll_number": None,
                "parent_ids": [],
                "admission_number": None,
                "admission_date": get_current_timestamp(),
                "date_of_birth": None,
                "gender": None,
                "blood_group": None,
                "aadhaar_id": None,
                "student_photo_url": None,
                "address": None,
                "academic_year": "2025-2026",
                "previous_school": None,
                "previous_class": None,
                "is_active": True,
                "created_at": get_current_timestamp()
            }
            await db.students.insert_one(student_doc)
    
    elif user.get("role") == "FACULTY":
        # Check if faculty profile already exists
        existing_faculty = await db.faculty.find_one({"user_id": user_id}, {"_id": 0})
        if not existing_faculty:
            faculty_doc = {
                "faculty_id": generate_id("fac_"),
                "user_id": user_id,
                "name": user.get("name"),
                "email": user.get("email"),
                "subject": "General",
                "qualification": None,
                "joining_date": get_current_timestamp(),
                "phone": user.get("phone"),
                "is_active": True,
                "created_at": get_current_timestamp()
            }
            await db.faculty.insert_one(faculty_doc)
    
    elif user.get("role") == "PARENT":
        # Check if parent profile already exists
        existing_parent = await db.parents.find_one({"user_id": user_id}, {"_id": 0})
        if not existing_parent:
            parent_doc = {
                "parent_id": generate_id("par_"),
                "user_id": user_id,
                "name": user.get("name"),
                "email": user.get("email"),
                "phone": user.get("phone"),
                "children_ids": [],
                "is_active": True,
                "created_at": get_current_timestamp()
            }
            await db.parents.insert_one(parent_doc)
    
    # send approval email
    from mailer import notify_user_on_approval
    if user:
        notify_user_on_approval(user.get('email'))
    return {"message": "User approved"}

@api_router.post('/admin/users/reject/{user_id}')
async def reject_user(user_id: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Also delete role-specific profile if it exists
    if user:
        if user.get("role") == "STUDENT":
            await db.students.delete_one({"user_id": user_id})
        elif user.get("role") == "FACULTY":
            await db.faculty.delete_one({"user_id": user_id})
        elif user.get("role") == "PARENT":
            await db.parents.delete_one({"user_id": user_id})
    
    # send rejection email
    from mailer import notify_user_on_rejection
    if user:
        notify_user_on_rejection(user.get('email'))
    return {"message": "User rejected and removed"}

# Admin - Teacher Assignment
@api_router.post('/admin/faculty/{faculty_id}/assign-class-section')
async def assign_class_section_to_teacher(faculty_id: str, class_name: str, section: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    """
    Admin assigns a class and section to a teacher
    Teacher will then only see students from this class/section
    """
    # Validate class and section
    if not class_name or class_name not in [str(i) for i in range(1, 11)]:
        raise HTTPException(status_code=400, detail="Invalid class. Must be 1-10")
    
    if not section or section not in ['A', 'B', 'C']:
        raise HTTPException(status_code=400, detail="Invalid section. Must be A, B, or C")
    
    # Check if faculty exists
    faculty = await db.faculty.find_one({"faculty_id": faculty_id}, {"_id": 0})
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    # Update faculty with assigned class and section
    await db.faculty.update_one(
        {"faculty_id": faculty_id},
        {"$set": {
            "assigned_class": class_name,
            "assigned_section": section
        }}
    )
    
    updated = await db.faculty.find_one({"faculty_id": faculty_id}, {"_id": 0})
    return {
        "message": "Class and section assigned to teacher",
        "faculty": updated
    }

@api_router.get('/admin/faculty/{faculty_id}')
async def get_faculty_by_id(faculty_id: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    """
    Get details of a specific faculty member
    """
    faculty = await db.faculty.find_one({"faculty_id": faculty_id}, {"_id": 0})
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return faculty

@api_router.get('/admin/faculty-assignments')
async def get_all_faculty_assignments(current_user: dict = Depends(require_role(["ADMIN"]))):
    """
    Get all faculty with their class/section assignments
    """
    faculty_list = await db.faculty.find({}, {"_id": 0}).to_list(1000)
    assignments = []
    for faculty in faculty_list:
        assignments.append({
            "faculty_id": faculty.get("faculty_id"),
            "name": faculty.get("name"),
            "subject": faculty.get("subject"),
            "assigned_class": faculty.get("assigned_class"),
            "assigned_section": faculty.get("assigned_section"),
            "email": faculty.get("email")
        })
    return {"assignments": assignments, "count": len(assignments)}

# Classes & Sections
@api_router.post('/admin/classes')
async def create_class(name: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    if not name or not str(name).strip():
        raise HTTPException(status_code=400, detail="Class name is required")
    # prevent duplicate class names
    existing = await db.classes.find_one({"name": str(name).strip()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Class with this name already exists")
    class_id = generate_id('class_')
    class_doc = {"class_id": class_id, "name": str(name).strip(), "created_at": get_current_timestamp()}
    result = await db.classes.insert_one(class_doc)
    inserted_id = result.inserted_id
    # Debug: log inserted class and DB stored doc
    try:
        stored = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
        logger.info(f"Inserted class_doc: {class_doc}")
        logger.info(f"Stored class in DB (projection _id removed): {stored}")
    except Exception:
        logger.exception("Error while fetching stored class for debug")
    # Ensure we don't return raw ObjectId which breaks JSON serialization
    class_doc.pop('_id', None)
    return {"message": "Class created", "class": {**class_doc, "id": str(inserted_id)}}

@api_router.get('/admin/classes')
async def list_classes(limit: int = 100, offset: int = 0, current_user: dict = Depends(require_role(["ADMIN"]))):
    cursor = db.classes.find({}, {"_id": 0}).skip(offset).limit(limit)
    classes = await cursor.to_list(length=limit)
    return {"items": classes, "limit": limit, "offset": offset, "count": len(classes)}

@api_router.delete('/admin/classes/{class_id}')
async def delete_class(class_id: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    result = await db.classes.delete_one({"class_id": class_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
    # Also remove associated sections and fee structures
    await db.sections.delete_many({"class_id": class_id})
    await db.fee_structures.delete_many({"class_id": class_id})
    return {"message": "Class and related data deleted"}

@api_router.post('/admin/sections')
async def create_section(class_id: str, name: str, capacity: int = 20, current_user: dict = Depends(require_role(["ADMIN"]))):
    if not name or not str(name).strip():
        raise HTTPException(status_code=400, detail="Section name is required")
    if capacity <= 0:
        raise HTTPException(status_code=400, detail="Capacity must be > 0")
    # ensure class exists
    cls = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    # ensure no duplicate section name within class
    existing = await db.sections.find_one({"class_id": class_id, "name": str(name).strip()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Section with this name already exists for the class")
    section_id = generate_id('sec_')
    sec_doc = {"section_id": section_id, "class_id": class_id, "name": str(name).strip(), "capacity": capacity, "created_at": get_current_timestamp()}
    result = await db.sections.insert_one(sec_doc)
    inserted_id = result.inserted_id
    sec_doc.pop('_id', None)
    return {"message": "Section created", "section": {**sec_doc, "id": str(inserted_id)}}

@api_router.put('/admin/sections/{section_id}')
async def update_section(section_id: str, name: str = None, capacity: int = None, current_user: dict = Depends(require_role(["ADMIN"]))):
    update = {}
    if name is not None:
        if not str(name).strip():
            raise HTTPException(status_code=400, detail="Section name cannot be empty")
        update['name'] = str(name).strip()
    if capacity is not None:
        if capacity <= 0:
            raise HTTPException(status_code=400, detail="Capacity must be > 0")
        update['capacity'] = capacity
    if not update:
        raise HTTPException(status_code=400, detail="No updates provided")
    # ensure no duplicate section name within class if name updated
    section = await db.sections.find_one({"section_id": section_id}, {"_id": 0})
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    if 'name' in update:
        existing = await db.sections.find_one({"class_id": section['class_id'], "name": update['name'], "section_id": {"$ne": section_id}}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Section with this name already exists for the class")
    await db.sections.update_one({"section_id": section_id}, {"$set": update})
    updated = await db.sections.find_one({"section_id": section_id}, {"_id": 0})
    return {"message": "Section updated", "section": updated}

@api_router.delete('/admin/sections/{section_id}')
async def delete_section(section_id: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    result = await db.sections.delete_one({"section_id": section_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"message": "Section deleted"}

@api_router.get('/admin/sections/{class_id}')
async def list_sections(class_id: str, limit: int = 100, offset: int = 0, current_user: dict = Depends(require_role(["ADMIN"]))):
    cursor = db.sections.find({"class_id": class_id}, {"_id": 0}).skip(offset).limit(limit)
    sections = await cursor.to_list(length=limit)
    return {"items": sections, "limit": limit, "offset": offset, "count": len(sections)}

@api_router.get('/admin/sections')
async def list_all_sections(limit: int = 100, offset: int = 0, current_user: dict = Depends(require_role(["ADMIN"]))):
    cursor = db.sections.find({}, {"_id": 0}).skip(offset).limit(limit)
    sections = await cursor.to_list(length=limit)
    return {"items": sections, "limit": limit, "offset": offset, "count": len(sections)}

@api_router.post('/admin/fees')
async def create_fee_structure(class_id: str, tuition_fee: float, exam_fee: float = 0.0, lab_fee: float = 0.0, transport: float = 0.0, scholarship: float = 0.0, section: str = None, frequency: str = 'yearly', current_user: dict = Depends(require_role(["ADMIN"]))):
    # validations
    if tuition_fee < 0 or exam_fee < 0 or lab_fee < 0 or transport < 0 or scholarship < 0:
        raise HTTPException(status_code=400, detail="Fees must be non-negative")
    if frequency not in ['monthly', 'quarterly', 'yearly']:
        raise HTTPException(status_code=400, detail="Invalid frequency")
    # ensure class exists
    cls = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    fee_id = generate_id('fee_')
    fee_doc = {
        "fee_id": fee_id,
        "class_id": class_id,
        "section": section,
        "tuition_fee": tuition_fee,
        "exam_fee": exam_fee,
        "lab_fee": lab_fee,
        "transport": transport,
        "scholarship": scholarship,
        "frequency": frequency,
        "created_at": get_current_timestamp()
    }
    result = await db.fee_structures.insert_one(fee_doc)
    inserted_id = result.inserted_id
    fee_doc.pop('_id', None)
    return {"message": "Fee structure created", "fee": {**fee_doc, "id": str(inserted_id)}}

@api_router.put('/admin/fees/{fee_id}')
async def update_fee(fee_id: str, tuition_fee: float = None, exam_fee: float = None, lab_fee: float = None, transport: float = None, scholarship: float = None, section: str = None, frequency: str = None, current_user: dict = Depends(require_role(["ADMIN"]))):
    update = {}
    if tuition_fee is not None:
        if tuition_fee < 0:
            raise HTTPException(status_code=400, detail="Fees must be non-negative")
        update['tuition_fee'] = tuition_fee
    if exam_fee is not None:
        if exam_fee < 0:
            raise HTTPException(status_code=400, detail="Fees must be non-negative")
        update['exam_fee'] = exam_fee
    if lab_fee is not None:
        if lab_fee < 0:
            raise HTTPException(status_code=400, detail="Fees must be non-negative")
        update['lab_fee'] = lab_fee
    if transport is not None:
        if transport < 0:
            raise HTTPException(status_code=400, detail="Fees must be non-negative")
        update['transport'] = transport
    if scholarship is not None:
        if scholarship < 0:
            raise HTTPException(status_code=400, detail="Fees must be non-negative")
        update['scholarship'] = scholarship
    if frequency is not None:
        if frequency not in ['monthly', 'quarterly', 'yearly']:
            raise HTTPException(status_code=400, detail="Invalid frequency")
        update['frequency'] = frequency
    if section is not None:
        update['section'] = section
    if not update:
        raise HTTPException(status_code=400, detail="No updates provided")
    fee = await db.fee_structures.find_one({"fee_id": fee_id}, {"_id": 0})
    if not fee:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    await db.fee_structures.update_one({"fee_id": fee_id}, {"$set": update})
    updated = await db.fee_structures.find_one({"fee_id": fee_id}, {"_id": 0})
    return {"message": "Fee updated", "fee": updated}

@api_router.delete('/admin/fees/{fee_id}')
async def delete_fee(fee_id: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    res = await db.fee_structures.delete_one({"fee_id": fee_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fee not found")
    return {"message": "Fee deleted"}

@api_router.delete('/admin/students/{student_id}')
async def delete_student(student_id: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    """Delete a student and all related data"""
    try:
        # Find student first
        student = await db.students.find_one({"student_id": student_id})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Delete student record
        await db.students.delete_one({"student_id": student_id})
        
        # Delete associated fee tracking
        await db.fee_tracking.delete_many({"student_id": student_id})
        
        # Delete associated payments
        await db.payments.delete_many({"student_id": student_id})
        
        # Delete attendance records
        await db.attendance.delete_many({"student_id": student_id})
        
        # Delete marks
        await db.marks.delete_many({"student_id": student_id})
        
        # Remove from parent's children list if linked
        if student.get("parent_ids"):
            await db.parents.update_many(
                {"children_ids": student_id},
                {"$pull": {"children_ids": student_id}}
            )
        
        # Delete associated user account
        if student.get("user_id"):
            await db.users.delete_one({"user_id": student.get("user_id")})
        
        logger.info(f"Student {student_id} and all related data deleted by admin {current_user.get('user_id')}")
        return {"message": f"Student {student_id} and all related data deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting student {student_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting student")

@api_router.delete('/admin/faculty/{faculty_id}')
async def delete_faculty(faculty_id: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    """Delete a faculty/teacher and all related data"""
    try:
        # Find faculty first
        faculty = await db.faculty.find_one({"faculty_id": faculty_id})
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty not found")
        
        # Delete faculty record
        await db.faculty.delete_one({"faculty_id": faculty_id})
        
        # Delete associated user account
        if faculty.get("user_id"):
            await db.users.delete_one({"user_id": faculty.get("user_id")})
        
        logger.info(f"Faculty {faculty_id} and related data deleted by admin {current_user.get('user_id')}")
        return {"message": f"Faculty {faculty_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting faculty {faculty_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting faculty")

@api_router.delete('/admin/users/{user_id}')
async def delete_user(user_id: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    """Delete a user account"""
    try:
        # Prevent deleting own account
        if current_user.get("user_id") == user_id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        # Find user first
        user = await db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Delete user
        await db.users.delete_one({"user_id": user_id})
        
        logger.info(f"User {user_id} deleted by admin {current_user.get('user_id')}")
        return {"message": f"User {user_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting user")

@api_router.get('/admin/fees')
async def list_fee_structures(class_id: str = None, limit: int = 100, offset: int = 0, current_user: dict = Depends(require_role(["ADMIN"]))):
    query = {}
    if class_id:
        query['class_id'] = class_id
    cursor = db.fee_structures.find(query, {"_id": 0}).skip(offset).limit(limit)
    fees = await cursor.to_list(length=limit)
    return {"items": fees, "limit": limit, "offset": offset, "count": len(fees)}

@api_router.get('/admin/fees/all')
async def list_all_fees(limit: int = 100, offset: int = 0, current_user: dict = Depends(require_role(["ADMIN"]))):
    cursor = db.fee_structures.find({}, {"_id": 0}).skip(offset).limit(limit)
    fees = await cursor.to_list(length=limit)
    return {"items": fees, "limit": limit, "offset": offset, "count": len(fees)}

# Finance summary for admin dashboard
@api_router.get('/admin/finance/summary')
async def admin_finance_summary(current_user: dict = Depends(require_role(["ADMIN"]))):
    # Total expected fees (sum of all total_fee_amount from fee_tracking)
    total_cursor = db.fee_tracking.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$total_fee_amount"}}}
    ])
    total_res = await total_cursor.to_list(length=1)
    total_expected = total_res[0]['total'] if total_res else 0.0

    # Collected amount: sum of paid_amount from fee_tracking with PAID status
    collected_cursor = db.fee_tracking.aggregate([
        {"$match": {"payment_status": "PAID"}},
        {"$group": {"_id": None, "collected": {"$sum": "$paid_amount"}}}
    ])
    collected_res = await collected_cursor.to_list(length=1)
    collected = collected_res[0]['collected'] if collected_res else 0.0

    pending = max(0.0, total_expected - collected)

    # Counts by payment status
    counts_cursor = db.fee_tracking.aggregate([
        {"$group": {"_id": "$payment_status", "count": {"$sum": 1}, "amount": {"$sum": "$total_fee_amount"}}}
    ])
    counts_list = await counts_cursor.to_list(length=10)
    counts = {item['_id']: {"count": item['count'], "amount": float(item['amount'])} for item in counts_list}

    return {
        "total_expected": float(total_expected),
        "collected": float(collected),
        "pending": float(pending),
        "by_status": counts
    }

# Finance timeseries for charts (monthly sums of PAID fees)
@api_router.get('/admin/finance/timeseries')
async def admin_finance_timeseries(current_user: dict = Depends(require_role(["ADMIN"]))):
    # Group paid fees by year-month based on updated_at
    pipeline = [
        {"$match": {"payment_status": "PAID"}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m", "date": {"$dateFromString": {"dateString": "$updated_at"}}}},
            "amount": {"$sum": "$paid_amount"}
        }},
        {"$sort": {"_id": 1}}
    ]
    res = await db.fee_tracking.aggregate(pipeline).to_list(length=12)
    return [{"month": item['_id'], "amount": float(item['amount'])} for item in res]

# Fee Reports - Class-wise, Section-wise, Student-wise
@api_router.get('/admin/fees/report/class-wise')
async def fee_report_class_wise(current_user: dict = Depends(require_role(["ADMIN"]))):
    """
    Get class-wise fee report showing total expected, collected, and pending for each class
    """
    pipeline = [
        {
            "$group": {
                "_id": "$class_name",
                "total_expected": {"$sum": "$total_fee_amount"},
                "total_paid": {"$sum": "$paid_amount"},
                "total_pending": {"$sum": "$pending_amount"},
                "student_count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    report = await db.fee_tracking.aggregate(pipeline).to_list(length=100)
    return {
        "report": [
            {
                "class": item["_id"],
                "student_count": item["student_count"],
                "total_expected": float(item["total_expected"]),
                "total_paid": float(item["total_paid"]),
                "total_pending": float(item["total_pending"]),
                "collection_percentage": round((item["total_paid"] / item["total_expected"] * 100) if item["total_expected"] > 0 else 0, 2)
            }
            for item in report
        ]
    }

@api_router.get('/admin/fees/report/section-wise/{class_name}')
async def fee_report_section_wise(class_name: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    """
    Get section-wise fee report for a specific class
    """
    pipeline = [
        {"$match": {"class_name": class_name}},
        {
            "$group": {
                "_id": "$section",
                "total_expected": {"$sum": "$total_fee_amount"},
                "total_paid": {"$sum": "$paid_amount"},
                "total_pending": {"$sum": "$pending_amount"},
                "student_count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    report = await db.fee_tracking.aggregate(pipeline).to_list(length=10)
    return {
        "class": class_name,
        "sections": [
            {
                "section": item["_id"],
                "student_count": item["student_count"],
                "total_expected": float(item["total_expected"]),
                "total_paid": float(item["total_paid"]),
                "total_pending": float(item["total_pending"]),
                "collection_percentage": round((item["total_paid"] / item["total_expected"] * 100) if item["total_expected"] > 0 else 0, 2)
            }
            for item in report
        ]
    }

@api_router.get('/admin/fees/report/student/{unique_student_id}')
async def fee_report_student_wise(unique_student_id: str, current_user: dict = Depends(require_role(["ADMIN"]))):
    """
    Get detailed fee and payment history for a specific student using unique Student ID
    """
    fee_tracking = await db.fee_tracking.find_one({"unique_student_id": unique_student_id}, {"_id": 0})
    if not fee_tracking:
        raise HTTPException(status_code=404, detail="Fee record not found for this Student ID")
    
    # Get student details
    student = await db.students.find_one({"unique_student_id": unique_student_id}, {"_id": 0})
    
    # Get parent details
    parent_mappings = await db.parent_mapping.find({"unique_student_id": unique_student_id}, {"_id": 0}).to_list(100)
    
    return {
        "unique_student_id": unique_student_id,
        "student_info": {
            "name": student.get("name") if student else None,
            "class": student.get("class_name") if student else None,
            "section": student.get("section") if student else None,
            "roll_number": student.get("roll_number") if student else None
        },
        "fee_tracking": fee_tracking,
        "parent_details": parent_mappings
    }

# Chatbot
@api_router.post("/chat")
async def chat_with_bot(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    user_message = message.message.lower()
    
    responses = {
        "attendance": "To view your attendance, check the Attendance section in your dashboard.",
        "marks": "Your marks and grades are available in the Marks section.",
        "fees": "Visit the Fees section to check your fee status or make a payment.",
        "timetable": "Your class timetable is available in the Timetable section.",
        "contact": "Reach the school office at office@sadhanamemorialschool.edu",
    }
    
    response_text = "I'm here to help! Ask me about attendance, marks, fees, timetable, or contact information."
    
    for keyword, response in responses.items():
        if keyword in user_message:
            response_text = response
            break
    
    return ChatResponse(
        response=response_text,
        timestamp=get_current_timestamp()
    )

# Mount the API router
app.include_router(api_router)

@app.get("/")
async def root():
    return {
        "message": "Sadhana Memorial School API",
        "status": "active",
        "docs": "/docs",
        "api": "/api"
    }
