import uuid
from datetime import datetime, timezone

def generate_id(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex[:12]}"

def get_current_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

def calculate_percentage(obtained: float, total: float) -> float:
    if total == 0:
        return 0.0
    return round((obtained / total) * 100, 2)
def generate_student_id(class_name: str, section: str, roll_number: int) -> str:
    """
    Generate unique student ID in format: SMS-YYYY-CLASS+SECTION-ROLL
    Example: SMS-2026-10A-001
    
    Args:
        class_name: Class number (1-10)
        section: Section (A, B, C)
        roll_number: Roll number (1-20)
    
    Returns:
        Unique Student ID as string
    """
    current_year = datetime.now(timezone.utc).year
    # Format: SMS-2026-10A-001
    student_id = f"SMS-{current_year}-{class_name}{section}-{str(roll_number).zfill(3)}"
    return student_id