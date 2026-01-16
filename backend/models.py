from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    FACULTY = "FACULTY"
    STUDENT = "STUDENT"
    PARENT = "PARENT"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    email: EmailStr
    name: str
    role: UserRole
    phone: Optional[str] = None
    avatar: Optional[str] = None
    is_active: bool = True
    created_at: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    student_id: str
    unique_student_id: str  # SMS-2026-10A-001 format
    user_id: str
    name: str
    email: EmailStr
    class_name: str
    section: str
    roll_number: str
    parent_ids: List[str] = []  # Multiple parents can be linked
    admission_number: str
    admission_date: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None  # M, F, Other
    blood_group: Optional[str] = None
    aadhaar_id: Optional[str] = None
    student_photo_url: Optional[str] = None
    address: Optional[str] = None
    academic_year: str = "2025-2026"
    previous_school: Optional[str] = None
    previous_class: Optional[str] = None
    created_at: str

class StudentCreate(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    class_name: str
    section: str
    roll_number: str
    admission_number: str
    academic_year: str = "2025-2026"
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    aadhaar_id: Optional[str] = None
    student_photo_url: Optional[str] = None
    address: Optional[str] = None
    previous_school: Optional[str] = None
    previous_class: Optional[str] = None
    parent_ids: List[str] = []

class Faculty(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    faculty_id: str
    user_id: str
    name: str
    email: EmailStr
    subject: str
    qualification: Optional[str] = None
    joining_date: str
    phone: Optional[str] = None
    assigned_class: Optional[str] = None  # Class assigned to teach (1-10)
    assigned_section: Optional[str] = None  # Section assigned to teach (A/B/C)
    created_at: str

class FacultyCreate(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    subject: str
    qualification: Optional[str] = None
    phone: Optional[str] = None

class Parent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    parent_id: str
    user_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    children_ids: List[str] = []
    created_at: str

class ParentCreate(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None

# Parent-Student Mapping
class ParentMapping(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    mapping_id: str
    parent_id: str
    student_id: str
    unique_student_id: str  # SMS-2026-10A-001 format
    relationship: str  # FATHER, MOTHER, GUARDIAN
    parent_name: str
    parent_email: EmailStr
    parent_phone: str
    parent_occupation: Optional[str] = None
    parent_address: Optional[str] = None
    parent_pin_code: Optional[str] = None
    created_at: str

class ParentMappingCreate(BaseModel):
    parent_id: str
    student_id: str
    unique_student_id: str
    relationship: str
    parent_name: str
    parent_email: EmailStr
    parent_phone: str
    parent_occupation: Optional[str] = None
    parent_address: Optional[str] = None
    parent_pin_code: Optional[str] = None

# Fee Tracking
class FeeTracking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    tracking_id: str
    student_id: str
    unique_student_id: str
    class_name: str
    section: str
    academic_year: str
    total_fee_amount: float
    paid_amount: float = 0.0
    pending_amount: float
    payment_status: str  # PENDING, PARTIAL, PAID
    payment_history: List[dict] = []  # [{"date": "2025-01-01", "amount": 5000, "method": "online"}]
    last_payment_date: Optional[str] = None
    due_date: Optional[str] = None
    created_at: str
    updated_at: str

class FeeTrackingCreate(BaseModel):
    student_id: str
    unique_student_id: str
    class_name: str
    section: str
    academic_year: str
    total_fee_amount: float
    due_date: Optional[str] = None

class FeeTrackingUpdate(BaseModel):
    paid_amount: float
    payment_method: str
    transaction_id: Optional[str] = None

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    attendance_id: str
    student_id: str
    date: str
    status: str  # PRESENT, ABSENT, LATE
    marked_by: str  # faculty_id
    remarks: Optional[str] = None
    created_at: str

class AttendanceCreate(BaseModel):
    student_id: str
    date: str
    status: str
    marked_by: str

# Classes & Sections
class ClassRoom(BaseModel):
    model_config = ConfigDict(extra="ignore")

    class_id: str
    name: str  # e.g., "1", "2", "10"
    created_at: str

class Section(BaseModel):
    model_config = ConfigDict(extra="ignore")

    section_id: str
    class_id: str
    name: str  # e.g., 'A', 'B'
    capacity: int = 20
    created_at: str

class FeeStructure(BaseModel):
    model_config = ConfigDict(extra="ignore")

    fee_id: str
    class_id: str
    section: Optional[str] = None
    tuition_fee: float
    exam_fee: float = 0.0
    lab_fee: float = 0.0
    transport: float = 0.0
    scholarship: float = 0.0
    frequency: str = 'yearly'  # monthly | quarterly | yearly
    created_at: str
    remarks: Optional[str] = None

class AttendanceBulkCreate(BaseModel):
    records: List[AttendanceCreate]

class Marks(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    marks_id: str
    student_id: str
    subject: str
    exam_name: str
    marks_obtained: float
    total_marks: float
    grade: Optional[str] = None
    uploaded_by: str  # faculty_id
    exam_date: str
    created_at: str

class MarksCreate(BaseModel):
    student_id: str
    subject: str
    exam_name: str
    marks_obtained: float
    total_marks: float
    grade: Optional[str] = None
    uploaded_by: str
    exam_date: str

class Fee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    fee_id: str
    student_id: str
    amount: float
    due_date: str
    status: str  # PENDING, PAID, OVERDUE
    fee_type: str  # TUITION, TRANSPORT, EXAM, etc
    academic_year: str
    created_at: str

class FeeCreate(BaseModel):
    student_id: str
    amount: float
    due_date: str
    fee_type: str
    academic_year: str

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    payment_id: str
    fee_id: str
    student_id: str
    amount: float
    payment_method: str
    transaction_id: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    status: str  # SUCCESS, PENDING, FAILED
    payment_date: str
    created_at: str

class PaymentCreate(BaseModel):
    amount: float
    currency: str = "INR"
    fee_id: str
    student_id: str

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    fee_id: str
    student_id: str
    amount: float

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    notification_id: str
    user_id: str
    title: str
    message: str
    type: str  # INFO, WARNING, SUCCESS, ERROR
    is_read: bool = False
    created_at: str

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "INFO"

class Announcement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    announcement_id: str
    title: str
    content: str
    target_roles: List[str]  # ["STUDENT", "PARENT", "FACULTY"]
    created_by: str  # admin or faculty user_id
    priority: str  # HIGH, MEDIUM, LOW
    created_at: str
    expires_at: Optional[str] = None

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_roles: List[str]
    created_by: str
    priority: str = "MEDIUM"
    expires_at: Optional[str] = None

class Timetable(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    timetable_id: str
    class_name: str
    section: str
    day: str
    periods: List[dict]  # [{"period": 1, "subject": "Math", "faculty": "John", "time": "9:00-10:00"}]
    created_at: str

class TimetableCreate(BaseModel):
    class_name: str
    section: str
    day: str
    periods: List[dict]

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    timestamp: str
