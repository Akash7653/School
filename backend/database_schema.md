# Smart School Management System - Database Schema

## Database: `smart_school_db`

### Collections Overview

#### 1. Users Collection
```json
{
  "_id": ObjectId,
  "user_id": "user_xxxxxxxxxxxx",
  "email": "user@example.com",
  "name": "Full Name",
  "role": "ADMIN|FACULTY|STUDENT|PARENT",
  "phone": "+91XXXXXXXXXX",
  "password": "hashed_password",
  "avatar": "profile_image_url",
  "is_active": true,
  "created_at": "2026-01-12T14:24:06.123Z"
}
```

#### 2. Students Collection
```json
{
  "_id": ObjectId,
  "student_id": "stu_xxxxxxxxxxxx",
  "user_id": "user_xxxxxxxxxxxx",
  "name": "Student Name",
  "email": "student@example.com",
  "class_name": "10th",
  "section": "A",
  "roll_number": "ROLL123456",
  "parent_id": "par_xxxxxxxxxxxx",
  "admission_date": "2026-01-12T14:24:06.123Z",
  "date_of_birth": "2010-01-01",
  "address": "Full Address",
  "created_at": "2026-01-12T14:24:06.123Z"
}
```

#### 3. Faculty Collection
```json
{
  "_id": ObjectId,
  "faculty_id": "fac_xxxxxxxxxxxx",
  "user_id": "user_xxxxxxxxxxxx",
  "name": "Faculty Name",
  "email": "faculty@example.com",
  "subject": "Mathematics",
  "qualification": "M.Sc Mathematics",
  "joining_date": "2026-01-12T14:24:06.123Z",
  "phone": "+91XXXXXXXXXX",
  "created_at": "2026-01-12T14:24:06.123Z"
}
```

#### 4. Parents Collection
```json
{
  "_id": ObjectId,
  "parent_id": "par_xxxxxxxxxxxx",
  "user_id": "user_xxxxxxxxxxxx",
  "name": "Parent Name",
  "email": "parent@example.com",
  "phone": "+91XXXXXXXXXX",
  "children_ids": ["stu_xxxxxxxxxxxx", "stu_yyyyyyyyyyyy"],
  "created_at": "2026-01-12T14:24:06.123Z"
}
```

#### 5. Attendance Collection
```json
{
  "_id": ObjectId,
  "attendance_id": "att_xxxxxxxxxxxx",
  "student_id": "stu_xxxxxxxxxxxx",
  "date": "2026-01-12",
  "status": "PRESENT|ABSENT|LEAVE",
  "marked_by": "fac_xxxxxxxxxxxx",
  "remarks": "Optional remarks",
  "created_at": "2026-01-12T14:24:06.123Z"
}
```

#### 6. Marks Collection
```json
{
  "_id": ObjectId,
  "marks_id": "mrk_xxxxxxxxxxxx",
  "student_id": "stu_xxxxxxxxxxxx",
  "subject": "Mathematics",
  "exam_type": "MID_TERM|FINAL|UNIT_TEST",
  "max_marks": 100,
  "obtained_marks": 85,
  "grade": "A",
  "remarks": "Good performance",
  "created_at": "2026-01-12T14:24:06.123Z"
}
```

#### 7. Fees Collection
```json
{
  "_id": ObjectId,
  "fee_id": "fee_xxxxxxxxxxxx",
  "student_id": "stu_xxxxxxxxxxxx",
  "fee_type": "TUITION|LAB|LIBRARY|TRANSPORT",
  "amount": 5000.00,
  "due_date": "2026-02-01",
  "status": "PENDING|PAID|OVERDUE",
  "description": "Monthly tuition fee",
  "created_at": "2026-01-12T14:24:06.123Z"
}
```

#### 8. Payments Collection
```json
{
  "_id": ObjectId,
  "payment_id": "pay_xxxxxxxxxxxx",
  "fee_id": "fee_xxxxxxxxxxxx",
  "student_id": "stu_xxxxxxxxxxxx",
  "razorpay_order_id": "order_xxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxx",
  "amount": 5000.00,
  "status": "SUCCESS|FAILED|PENDING",
  "payment_date": "2026-01-12T14:24:06.123Z",
  "created_at": "2026-01-12T14:24:06.123Z"
}
```

#### 9. Announcements Collection
```json
{
  "_id": ObjectId,
  "announcement_id": "ann_xxxxxxxxxxxx",
  "title": "School Holiday",
  "message": "School will remain closed on...",
  "target_roles": ["STUDENT", "FACULTY", "PARENT"],
  "priority": "HIGH|MEDIUM|LOW",
  "created_by": "fac_xxxxxxxxxxxx",
  "created_at": "2026-01-12T14:24:06.123Z"
}
```

#### 10. Timetable Collection
```json
{
  "_id": ObjectId,
  "class_name": "10th",
  "section": "A",
  "day": "MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY",
  "period": 1,
  "subject": "Mathematics",
  "teacher": "fac_xxxxxxxxxxxx",
  "room": "Room 101",
  "start_time": "09:00",
  "end_time": "09:45",
  "created_at": "2026-01-12T14:24:06.123Z"
}
```

#### 11. Notifications Collection
```json
{
  "_id": ObjectId,
  "notification_id": "not_xxxxxxxxxxxx",
  "user_id": "user_xxxxxxxxxxxx",
  "title": "Fee Reminder",
  "message": "Your fee is due on...",
  "type": "INFO|WARNING|SUCCESS|ERROR",
  "is_read": false,
  "created_at": "2026-01-12T14:24:06.123Z"
}
```

## Indexes

### Unique Indexes
- `users.email`, `users.user_id`
- `students.student_id`, `students.user_id`, `students.roll_number`
- `faculty.faculty_id`, `faculty.user_id`
- `parents.parent_id`, `parents.user_id`
- `attendance.attendance_id`
- `marks.marks_id`
- `fees.fee_id`
- `payments.payment_id`, `payments.razorpay_order_id`
- `announcements.announcement_id`
- `notifications.notification_id`

### Composite Indexes
- `attendance`: [student_id, date]
- `marks`: [student_id, subject, exam_type]
- `timetable`: [class_name, section, day]
- `announcements`: [target_roles, created_at]

## Default Admin User
- **Email**: admin@sadhanaschool.edu
- **Password**: admin123
- **Role**: ADMIN

## Database Connection
- **URL**: mongodb://localhost:27017
- **Database**: smart_school_db
- **Status**: Connected and Ready
