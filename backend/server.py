from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserCreate(BaseModel):
    username: str
    password: str
    role: str  # admin, chairman, director, vice_principal, supervisor, activities, educational_supervision, social_specialist, quality
    branch: str  # boys, girls, both
    assigned_to: Optional[str] = None  # For supervisors assigned to vice principals

class UserLogin(BaseModel):
    username: str
    password: str
    remember_me: bool = False

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    role: str
    branch: str
    assigned_to: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    token: str
    expires_at: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Teacher(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    subject: str
    branch: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ClassRoom(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    section: str
    branch: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SupervisorReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    branch: str
    date: str
    student_discipline: float  # Allow float for decimal ratings
    student_discipline_notes: Optional[str] = None
    classroom_cleanliness: float  # Allow float for decimal ratings
    classroom_cleanliness_notes: Optional[str] = None
    teacher_attendance_rate: float  # Allow float for decimal ratings
    late_teachers: List[Dict[str, Any]] = []
    teacher_attendance_notes: Optional[str] = None
    student_movement: Optional[str] = None
    student_movement_classes: List[str] = []
    student_movement_notes: Optional[str] = None
    general_behavior: float  # Allow float for decimal ratings
    general_notes: Optional[str] = None
    incidents: List[Dict[str, str]] = []
    absent_teachers: List[Dict[str, Any]] = []
    covering_teachers: List[Dict[str, Any]] = []
    absent_students_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None

class VicePrincipalReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    branch: str
    week_start: str
    week_end: str
    problems: List[Dict[str, str]] = []
    suggestions: List[str] = []
    absent_teachers: List[Dict[str, Any]] = []  # {teacher: str, absent_days: int}
    supervisor_reports: List[str] = []  # IDs of supervisor reports
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None

class ActivitiesReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    branch: str
    activities: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None

class EducationalSupervisionReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    branch: str
    date: str
    teacher_evaluations: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None

class SocialSpecialistReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    branch: str
    date: str
    psychological_cases: int = 0
    academic_cases: int = 0
    behavioral_cases: int = 0
    sessions_count: int = 0
    families_contacted: int = 0
    referrals_count: int = 0
    follow_ups_count: int = 0
    guidance_programs: Optional[str] = None
    challenges: Optional[str] = None
    recommendations: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None

class QualityReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    branch: str
    date: str
    academic_performance: Dict[str, str] = {}
    educational_supervision: Dict[str, str] = {}
    discipline_behavior: Dict[str, str] = {}
    activities_programs: Dict[str, str] = {}
    social_specialist: Dict[str, str] = {}
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None

class DirectorReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    branch: str
    report_date: str  # تاريخ التقرير
    challenges: Optional[str] = None  # التحديات
    actions_and_suggestions: Optional[str] = None  # الإجراءات المتخذة والمقترحات
    notes: Optional[str] = None  # ملاحظات
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed) -> bool:
    # Handle both bytes and string hashed passwords
    if isinstance(hashed, str):
        hashed = hashed.encode('utf-8')
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

def generate_token() -> str:
    return secrets.token_urlsafe(32)

async def get_current_user(
    token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    # Try to get token from cookie first, then from Authorization header
    auth_token = token
    
    if not auth_token and authorization:
        # Extract token from "Bearer <token>" format
        if authorization.startswith("Bearer "):
            auth_token = authorization[7:]
        else:
            auth_token = authorization
    
    if not auth_token:
        raise HTTPException(status_code=401, detail="غير مصرح")
    
    session = await db.sessions.find_one({"token": auth_token})
    if not session:
        raise HTTPException(status_code=401, detail="جلسة غير صالحة")
    
    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        await db.sessions.delete_one({"token": auth_token})
        raise HTTPException(status_code=401, detail="انتهت صلاحية الجلسة")
    
    user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="مستخدم غير موجود")
    
    return user

# Initialize admin user
@app.on_event("startup")
async def create_admin():
    admin = await db.users.find_one({"username": "مدارس الفجر الجديد الأهلية"})
    if not admin:
        admin_data = {
            "id": str(uuid.uuid4()),
            "username": "مدارس الفجر الجديد الأهلية",
            "password": hash_password("2002002Hh"),
            "role": "admin",
            "branch": "both",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_data)
        logger.info("تم إنشاء حساب المدير الرئيسي")

# Authentication endpoints
@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="اسم المستخدم أو كلمة المرور غير صحيحة")
    
    token = generate_token()
    expires_delta = timedelta(days=30) if user_data.remember_me else timedelta(hours=8)
    expires_at = datetime.now(timezone.utc) + expires_delta
    
    session_data = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "token": token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sessions.insert_one(session_data)
    
    response.set_cookie(
        key="token",
        value=token,
        max_age=int(expires_delta.total_seconds()),
        httponly=True,
        samesite="lax"
    )
    
    user_response = {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "branch": user["branch"],
        "assigned_to": user.get("assigned_to")
    }
    
    return {"user": user_response, "token": token}

@api_router.post("/auth/logout")
async def logout(response: Response, token: Optional[str] = Cookie(None)):
    if token:
        await db.sessions.delete_one({"token": token})
    response.delete_cookie("token")
    return {"message": "تم تسجيل الخروج بنجاح"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

# User management (Admin only)
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="اسم المستخدم موجود بالفعل")
    
    user_dict = user_data.model_dump()
    user_dict["password"] = hash_password(user_data.password)
    user_obj = User(**{k: v for k, v in user_dict.items() if k != 'password'})
    
    doc = user_obj.model_dump()
    doc["password"] = user_dict["password"]
    await db.users.insert_one(doc)
    
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "chairman", "director", "vice_principal", "quality"]:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    query = {}
    if current_user["role"] in ["director", "vice_principal"]:
        # Directors with "both" branch can see all reports, otherwise filter by branch
        if current_user["branch"] != "both":
            query["branch"] = current_user["branch"]
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.post("/admin/cleanup-orphaned-reports")
async def cleanup_orphaned_reports(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح - Admin فقط")
    
    # Get all user IDs
    users = await db.users.find({}, {"id": 1}).to_list(1000)
    user_ids = {user['id'] for user in users}
    
    # Collections to check
    collections_to_clean = [
        ("supervisor_reports", db.supervisor_reports),
        ("vice_principal_reports", db.vice_principal_reports),
        ("activities_reports", db.activities_reports),
        ("social_specialist_reports", db.social_specialist_reports),
        ("quality_reports", db.quality_reports)
    ]
    
    results = {}
    for name, collection in collections_to_clean:
        # Get all reports
        reports = await collection.find({}, {"id": 1, "user_id": 1}).to_list(10000)
        
        # Find orphaned reports
        orphaned_ids = [r['id'] for r in reports if r.get('user_id') not in user_ids]
        
        if orphaned_ids:
            # Delete orphaned reports
            delete_result = await collection.delete_many({'id': {'$in': orphaned_ids}})
            results[name] = {
                "total_reports": len(reports),
                "orphaned_found": len(orphaned_ids),
                "deleted": delete_result.deleted_count
            }
        else:
            results[name] = {
                "total_reports": len(reports),
                "orphaned_found": 0,
                "deleted": 0
            }
    
    return {"message": "تم تنظيف البيانات بنجاح", "results": results}

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    # If password is provided and not empty, hash it; otherwise remove it from update
    if "password" in user_data:
        if user_data["password"] and user_data["password"].strip():
            user_data["password"] = hash_password(user_data["password"])
        else:
            # Remove password from update if it's empty
            del user_data["password"]
    
    await db.users.update_one({"id": user_id}, {"$set": user_data})
    return {"message": "تم تحديث المستخدم بنجاح"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    await db.users.delete_one({"id": user_id})
    return {"message": "تم حذف المستخدم بنجاح"}

# Teachers Management
@api_router.post("/teachers", response_model=Teacher)
async def create_teacher(teacher_data: Teacher, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    doc = teacher_data.model_dump()
    await db.teachers.insert_one(doc)
    return teacher_data

@api_router.get("/teachers", response_model=List[Teacher])
async def get_teachers(branch: Optional[str] = None, subject: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if branch:
        query["branch"] = branch
    if subject:
        query["subject"] = subject
    
    teachers = await db.teachers.find(query, {"_id": 0}).to_list(1000)
    return teachers

@api_router.put("/teachers/{teacher_id}")
async def update_teacher(teacher_id: str, teacher_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    await db.teachers.update_one({"id": teacher_id}, {"$set": teacher_data})
    return {"message": "تم تحديث المعلم بنجاح"}

@api_router.post("/teachers/bulk-import")
async def bulk_import_teachers(teachers_data: List[dict], current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    imported_count = 0
    errors = []
    
    for idx, teacher_data in enumerate(teachers_data):
        try:
            # Add ID if not present
            if "id" not in teacher_data or not teacher_data["id"]:
                teacher_data["id"] = str(uuid.uuid4())
            
            # Validate required fields
            if not teacher_data.get("name") or not teacher_data.get("subject") or not teacher_data.get("branch"):
                errors.append(f"الصف {idx + 1}: حقول مطلوبة ناقصة (الاسم، المادة، الفرع)")
                continue
            
            # Check if teacher already exists by name and branch
            existing = await db.teachers.find_one({
                "name": teacher_data["name"],
                "branch": teacher_data["branch"]
            })
            
            if existing:
                # Update existing teacher
                await db.teachers.update_one(
                    {"id": existing["id"]},
                    {"$set": teacher_data}
                )
            else:
                # Insert new teacher
                await db.teachers.insert_one(teacher_data)
            
            imported_count += 1
        except Exception as e:
            errors.append(f"الصف {idx + 1}: {str(e)}")
    
    return {
        "message": f"تم استيراد {imported_count} معلم بنجاح",
        "imported_count": imported_count,
        "errors": errors if errors else None
    }

@api_router.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    await db.teachers.delete_one({"id": teacher_id})
    return {"message": "تم حذف المعلم بنجاح"}

# Subjects Management
@api_router.post("/subjects", response_model=Subject)
async def create_subject(subject_data: Subject, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    doc = subject_data.model_dump()
    await db.subjects.insert_one(doc)
    return subject_data

@api_router.get("/subjects", response_model=List[Subject])
async def get_subjects(current_user: dict = Depends(get_current_user)):
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(1000)
    return subjects

@api_router.put("/subjects/{subject_id}")
async def update_subject(subject_id: str, subject_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    await db.subjects.update_one({"id": subject_id}, {"$set": subject_data})
    return {"message": "تم تحديث المادة بنجاح"}

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    await db.subjects.delete_one({"id": subject_id})
    return {"message": "تم حذف المادة بنجاح"}

# ClassRooms Management
@api_router.post("/classrooms", response_model=ClassRoom)
async def create_classroom(classroom_data: ClassRoom, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    doc = classroom_data.model_dump()
    await db.classrooms.insert_one(doc)
    return classroom_data

@api_router.get("/classrooms", response_model=List[ClassRoom])
async def get_classrooms(branch: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if branch:
        query["branch"] = branch
    
    classrooms = await db.classrooms.find(query, {"_id": 0}).to_list(1000)
    return classrooms

@api_router.put("/classrooms/{classroom_id}")
async def update_classroom(classroom_id: str, classroom_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    await db.classrooms.update_one({"id": classroom_id}, {"$set": classroom_data})
    return {"message": "تم تحديث الصف بنجاح"}

@api_router.delete("/classrooms/{classroom_id}")
async def delete_classroom(classroom_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    await db.classrooms.delete_one({"id": classroom_id})
    return {"message": "تم حذف الصف بنجاح"}

# Supervisor Reports
@api_router.post("/reports/supervisor", response_model=SupervisorReport)
async def create_supervisor_report(report_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "supervisor":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    # Add required fields
    report_data["id"] = str(uuid.uuid4())
    report_data["user_id"] = current_user["id"]
    report_data["branch"] = current_user["branch"]
    # Date should come from frontend
    if "date" not in report_data:
        report_data["date"] = datetime.now(timezone.utc).date().isoformat()
    report_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.supervisor_reports.insert_one(report_data)
    
    # Return the created report
    report_obj = SupervisorReport(**report_data)
    return report_obj

@api_router.get("/reports/supervisor", response_model=List[SupervisorReport])
async def get_supervisor_reports(user_id: Optional[str] = None, branch: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user["role"] == "supervisor":
        query["user_id"] = current_user["id"]
    elif current_user["role"] == "vice_principal":
        supervisors = await db.users.find({"assigned_to": current_user["id"]}, {"_id": 0}).to_list(100)
        supervisor_ids = [s["id"] for s in supervisors]
        query["user_id"] = {"$in": supervisor_ids}
    elif current_user["role"] in ["chairman", "director", "quality", "educational_supervision"]:
        # Chairman/Directors with "both" branch can see all reports, otherwise filter by branch
        if current_user["branch"] != "both":
            query["branch"] = current_user["branch"]
    
    if user_id:
        query["user_id"] = user_id
    if branch:
        query["branch"] = branch
    
    reports = await db.supervisor_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reports

@api_router.get("/reports/supervisor/{report_id}", response_model=SupervisorReport)
async def get_supervisor_report(report_id: str, current_user: dict = Depends(get_current_user)):
    report = await db.supervisor_reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    return report

@api_router.put("/reports/supervisor/{report_id}")
async def update_supervisor_report(report_id: str, report_data: dict, current_user: dict = Depends(get_current_user)):
    report = await db.supervisor_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    
    if current_user["role"] != "admin" and report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    report_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.supervisor_reports.update_one({"id": report_id}, {"$set": report_data})
    return {"message": "تم تحديث التقرير بنجاح"}

@api_router.delete("/reports/supervisor/{report_id}")
async def delete_supervisor_report(report_id: str, current_user: dict = Depends(get_current_user)):
    # Allow supervisor to delete their own reports, or admin to delete any report
    report = await db.supervisor_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    
    if current_user["role"] != "admin" and report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بحذف هذا التقرير")
    
    await db.supervisor_reports.delete_one({"id": report_id})
    return {"message": "تم حذف التقرير بنجاح"}

# Vice Principal Reports
@api_router.post("/reports/vice-principal", response_model=VicePrincipalReport)
async def create_vice_principal_report(report_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "vice_principal":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    # Add required fields
    report_data["id"] = str(uuid.uuid4())
    report_data["user_id"] = current_user["id"]
    report_data["branch"] = current_user["branch"]
    report_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.vice_principal_reports.insert_one(report_data)
    
    # Return the created report
    report_obj = VicePrincipalReport(**report_data)
    return report_obj

@api_router.get("/reports/vice-principal", response_model=List[VicePrincipalReport])
async def get_vice_principal_reports(user_id: Optional[str] = None, branch: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user["role"] == "vice_principal":
        query["user_id"] = current_user["id"]
    elif current_user["role"] in ["chairman", "director", "quality"]:
        # Chairman/Directors with "both" branch can see all reports, otherwise filter by branch
        if current_user["branch"] != "both":
            query["branch"] = current_user["branch"]
    
    if user_id:
        query["user_id"] = user_id
    if branch:
        query["branch"] = branch
    
    reports = await db.vice_principal_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reports

@api_router.put("/reports/vice-principal/{report_id}")
async def update_vice_principal_report(report_id: str, report_data: dict, current_user: dict = Depends(get_current_user)):
    report = await db.vice_principal_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    
    if current_user["role"] != "admin" and report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    report_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.vice_principal_reports.update_one({"id": report_id}, {"$set": report_data})
    return {"message": "تم تحديث التقرير بنجاح"}

@api_router.delete("/reports/vice-principal/{report_id}")
async def delete_vice_principal_report(report_id: str, current_user: dict = Depends(get_current_user)):
    report = await db.vice_principal_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    
    if current_user["role"] != "admin" and report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بحذف هذا التقرير")
    
    await db.vice_principal_reports.delete_one({"id": report_id})
    return {"message": "تم حذف التقرير بنجاح"}

# Activities Reports
@api_router.post("/reports/activities", response_model=ActivitiesReport)
async def create_activities_report(report_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "activities":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    # Add required fields
    report_data["id"] = str(uuid.uuid4())
    report_data["user_id"] = current_user["id"]
    report_data["branch"] = current_user["branch"]
    report_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.activities_reports.insert_one(report_data)
    
    report_obj = ActivitiesReport(**report_data)
    return report_obj

@api_router.get("/reports/activities", response_model=List[ActivitiesReport])
async def get_activities_reports(user_id: Optional[str] = None, branch: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user["role"] == "activities":
        query["user_id"] = current_user["id"]
    elif current_user["role"] in ["chairman", "director", "quality"]:
        # Chairman/Directors with "both" branch can see all reports, otherwise filter by branch
        if current_user["branch"] != "both":
            query["branch"] = current_user["branch"]
    
    if user_id:
        query["user_id"] = user_id
    if branch:
        query["branch"] = branch
    
    reports = await db.activities_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reports

@api_router.put("/reports/activities/{report_id}")
async def update_activities_report(report_id: str, report_data: dict, current_user: dict = Depends(get_current_user)):
    report = await db.activities_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    
    if current_user["role"] != "admin" and report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    report_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.activities_reports.update_one({"id": report_id}, {"$set": report_data})
    return {"message": "تم تحديث التقرير بنجاح"}

@api_router.delete("/reports/activities/{report_id}")
async def delete_activities_report(report_id: str, current_user: dict = Depends(get_current_user)):
    report = await db.activities_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    
    if current_user["role"] != "admin" and report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بحذف هذا التقرير")
    
    await db.activities_reports.delete_one({"id": report_id})
    return {"message": "تم حذف التقرير بنجاح"}

# Educational Supervision Reports
@api_router.post("/reports/educational-supervision", response_model=EducationalSupervisionReport)
async def create_educational_supervision_report(report_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "educational_supervision":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    # Add required fields
    report_data["id"] = str(uuid.uuid4())
    report_data["user_id"] = current_user["id"]
    report_data["branch"] = current_user["branch"]
    if "date" not in report_data:
        report_data["date"] = datetime.now(timezone.utc).date().isoformat()
    report_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.educational_supervision_reports.insert_one(report_data)
    
    report_obj = EducationalSupervisionReport(**report_data)
    return report_obj

@api_router.get("/reports/educational-supervision", response_model=List[EducationalSupervisionReport])
async def get_educational_supervision_reports(user_id: Optional[str] = None, branch: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user["role"] == "educational_supervision":
        query["user_id"] = current_user["id"]
    elif current_user["role"] in ["chairman", "director", "quality"]:
        # Chairman/Directors with "both" branch can see all reports, otherwise filter by branch
        if current_user["branch"] != "both":
            query["branch"] = current_user["branch"]
    
    if user_id:
        query["user_id"] = user_id
    if branch:
        query["branch"] = branch
    
    reports = await db.educational_supervision_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reports

@api_router.put("/reports/educational-supervision/{report_id}")
async def update_educational_supervision_report(report_id: str, report_data: dict, current_user: dict = Depends(get_current_user)):
    report = await db.educational_supervision_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    
    if current_user["role"] != "admin" and report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    report_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.educational_supervision_reports.update_one({"id": report_id}, {"$set": report_data})
    return {"message": "تم تحديث التقرير بنجاح"}

@api_router.delete("/reports/educational-supervision/{report_id}")
async def delete_educational_supervision_report(report_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "educational_supervision"]:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    await db.educational_supervision_reports.delete_one({"id": report_id})
    return {"message": "تم حذف التقرير بنجاح"}

# Social Specialist Reports
@api_router.post("/reports/social-specialist", response_model=SocialSpecialistReport)
async def create_social_specialist_report(report_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "social_specialist":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    # Add required fields
    report_data["id"] = str(uuid.uuid4())
    report_data["user_id"] = current_user["id"]
    report_data["branch"] = current_user["branch"]
    if "date" not in report_data:
        report_data["date"] = datetime.now(timezone.utc).date().isoformat()
    report_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.social_specialist_reports.insert_one(report_data)
    
    report_obj = SocialSpecialistReport(**report_data)
    return report_obj

@api_router.get("/reports/social-specialist", response_model=List[SocialSpecialistReport])
async def get_social_specialist_reports(user_id: Optional[str] = None, branch: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user["role"] == "social_specialist":
        query["user_id"] = current_user["id"]
    elif current_user["role"] in ["chairman", "director", "quality"]:
        # Chairman/Directors with "both" branch can see all reports, otherwise filter by branch
        if current_user["branch"] != "both":
            query["branch"] = current_user["branch"]
    
    if user_id:
        query["user_id"] = user_id
    if branch:
        query["branch"] = branch
    
    reports = await db.social_specialist_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reports

@api_router.put("/reports/social-specialist/{report_id}")
async def update_social_specialist_report(report_id: str, report_data: dict, current_user: dict = Depends(get_current_user)):
    report = await db.social_specialist_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    
    if current_user["role"] != "admin" and report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    report_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.social_specialist_reports.update_one({"id": report_id}, {"$set": report_data})
    return {"message": "تم تحديث التقرير بنجاح"}

@api_router.delete("/reports/social-specialist/{report_id}")
async def delete_social_specialist_report(report_id: str, current_user: dict = Depends(get_current_user)):
    report = await db.social_specialist_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    
    if current_user["role"] != "admin" and report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بحذف هذا التقرير")
    
    await db.social_specialist_reports.delete_one({"id": report_id})
    return {"message": "تم حذف التقرير بنجاح"}

# Quality Reports
@api_router.post("/reports/quality", response_model=QualityReport)
async def create_quality_report(report_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "quality":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    # Add required fields
    report_data["id"] = str(uuid.uuid4())
    report_data["user_id"] = current_user["id"]
    report_data["branch"] = current_user["branch"]
    if "date" not in report_data:
        report_data["date"] = datetime.now(timezone.utc).date().isoformat()
    report_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.quality_reports.insert_one(report_data)
    
    report_obj = QualityReport(**report_data)
    return report_obj

@api_router.get("/reports/quality", response_model=List[QualityReport])
async def get_quality_reports(user_id: Optional[str] = None, branch: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user["role"] == "quality":
        query["user_id"] = current_user["id"]
    elif current_user["role"] in ["chairman", "director"]:
        # Chairman/Directors with "both" branch can see all reports, otherwise filter by branch
        if current_user["branch"] != "both":
            query["branch"] = current_user["branch"]
    
    if user_id:
        query["user_id"] = user_id
    if branch:
        query["branch"] = branch
    
    reports = await db.quality_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reports

@api_router.put("/reports/quality/{report_id}")
async def update_quality_report(report_id: str, report_data: dict, current_user: dict = Depends(get_current_user)):
    report = await db.quality_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    
    if current_user["role"] != "admin" and report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    report_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.quality_reports.update_one({"id": report_id}, {"$set": report_data})
    return {"message": "تم تحديث التقرير بنجاح"}

@api_router.delete("/reports/quality/{report_id}")
async def delete_quality_report(report_id: str, current_user: dict = Depends(get_current_user)):
    report = await db.quality_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    
    if current_user["role"] != "admin" and report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بحذف هذا التقرير")
    
    await db.quality_reports.delete_one({"id": report_id})
    return {"message": "تم حذف التقرير بنجاح"}

# Director Reports
@api_router.post("/reports/director", response_model=DirectorReport)
async def create_director_report(report_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    # Add required fields
    report_data["id"] = str(uuid.uuid4())
    report_data["user_id"] = current_user["id"]
    report_data["branch"] = current_user["branch"]
    report_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.director_reports.insert_one(report_data)
    
    report_obj = DirectorReport(**report_data)
    return report_obj

@api_router.get("/reports/director", response_model=List[DirectorReport])
async def get_director_reports(user_id: Optional[str] = None, branch: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user["role"] == "director":
        query["user_id"] = current_user["id"]
    
    if user_id:
        query["user_id"] = user_id
    if branch:
        query["branch"] = branch
    
    reports = await db.director_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reports

@api_router.put("/reports/director/{report_id}")
async def update_director_report(report_id: str, report_data: dict, current_user: dict = Depends(get_current_user)):
    report = await db.director_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="التقرير غير موجود")
    
    if current_user["role"] != "admin" and report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    report_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.director_reports.update_one({"id": report_id}, {"$set": report_data})
    return {"message": "تم تحديث التقرير بنجاح"}

@api_router.delete("/reports/director/{report_id}")
async def delete_director_report(report_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "director"]:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    await db.director_reports.delete_one({"id": report_id})
    return {"message": "تم حذف التقرير بنجاح"}

# Statistics endpoints
@api_router.get("/statistics/teacher-absences")
async def get_teacher_absences(branch: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if branch:
        query["branch"] = branch
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    
    reports = await db.supervisor_reports.find(query, {"_id": 0}).to_list(1000)
    
    teacher_stats = {}
    for report in reports:
        for absent in report.get("absent_teachers", []):
            teacher_name = absent.get("teacher")
            if teacher_name:
                if teacher_name not in teacher_stats:
                    teacher_stats[teacher_name] = {"absences": 0, "covered": 0}
                teacher_stats[teacher_name]["absences"] += 1
        
        for covering in report.get("covering_teachers", []):
            teacher_name = covering.get("teacher")
            if teacher_name:
                if teacher_name not in teacher_stats:
                    teacher_stats[teacher_name] = {"absences": 0, "covered": 0}
                teacher_stats[teacher_name]["covered"] += 1
    
    return teacher_stats

@api_router.get("/statistics/teacher-evaluations")
async def get_teacher_evaluations(branch: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "chairman", "director", "educational_supervision"]:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    query = {}
    if branch:
        query["branch"] = branch
    elif current_user["role"] == "director":
        # Directors with "both" branch can see all reports, otherwise filter by branch
        if current_user["branch"] != "both":
            query["branch"] = current_user["branch"]
    
    # Get educational supervision reports
    ed_reports = await db.educational_supervision_reports.find(query, {"_id": 0}).to_list(1000)
    
    # Get activities reports for teacher cooperation
    activities_reports = await db.activities_reports.find(query, {"_id": 0}).to_list(1000)
    
    # Get supervisor reports for absences and covering
    supervisor_reports = await db.supervisor_reports.find(query, {"_id": 0}).to_list(1000)
    
    teacher_data = {}
    
    # Process educational supervision evaluations
    for report in ed_reports:
        for eval in report.get("teacher_evaluations", []):
            teacher = eval.get("teacher")
            if teacher:
                if teacher not in teacher_data:
                    teacher_data[teacher] = {
                        "evaluations": [],
                        "absences": 0,
                        "covered": 0,
                        "activities_cooperation": 0
                    }
                teacher_data[teacher]["evaluations"].append(eval)
    
    # Process activities cooperation
    for report in activities_reports:
        for activity in report.get("activities", []):
            for teacher in activity.get("cooperating_teachers", []):
                if teacher:
                    if teacher not in teacher_data:
                        teacher_data[teacher] = {
                            "evaluations": [],
                            "absences": 0,
                            "covered": 0,
                            "activities_cooperation": 0
                        }
                    teacher_data[teacher]["activities_cooperation"] += 1
    
    # Process absences and covering
    for report in supervisor_reports:
        for absent in report.get("absent_teachers", []):
            teacher = absent.get("teacher")
            if teacher:
                if teacher not in teacher_data:
                    teacher_data[teacher] = {
                        "evaluations": [],
                        "absences": 0,
                        "covered": 0,
                        "activities_cooperation": 0
                    }
                teacher_data[teacher]["absences"] += 1
        
        for covering in report.get("covering_teachers", []):
            teacher = covering.get("teacher")
            if teacher:
                if teacher not in teacher_data:
                    teacher_data[teacher] = {
                        "evaluations": [],
                        "absences": 0,
                        "covered": 0,
                        "activities_cooperation": 0
                    }
                teacher_data[teacher]["covered"] += 1
    
    return teacher_data

# Clean orphaned reports - Delete reports with non-existent user_ids
@api_router.post("/admin/clean-orphaned-reports")
async def clean_orphaned_reports(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "chairman"]:
        raise HTTPException(status_code=403, detail="صلاحيات المسؤول أو رئيس المجلس فقط")
    
    # Get all valid user IDs
    all_users = await db.users.find().to_list(length=None)
    valid_user_ids = {user["id"] for user in all_users}
    
    deleted_counts = {}
    
    # Collections to check
    collections = [
        ("supervisor_reports", "تقارير المشرفين"),
        ("vice_principal_reports", "تقارير الوكلاء"),
        ("activities_reports", "تقارير الأنشطة"),
        ("social_specialist_reports", "تقارير الأخصائي الاجتماعي"),
        ("quality_reports", "تقارير الجودة"),
        ("educational_supervision_reports", "تقارير الإشراف التربوي"),
        ("director_reports", "تقارير المدير")
    ]
    
    total_deleted = 0
    
    for collection_name, arabic_name in collections:
        collection = db[collection_name]
        
        # Find reports with user_id not in valid_user_ids
        orphaned_reports = await collection.find({"user_id": {"$exists": True}}).to_list(length=None)
        
        orphaned_count = 0
        for report in orphaned_reports:
            if report.get("user_id") not in valid_user_ids:
                await collection.delete_one({"id": report["id"]})
                orphaned_count += 1
        
        if orphaned_count > 0:
            deleted_counts[arabic_name] = orphaned_count
            total_deleted += orphaned_count
    
    return {
        "message": f"تم حذف {total_deleted} تقرير يتيم بنجاح",
        "details": deleted_counts,
        "total_deleted": total_deleted
    }

# Clean empty quality reports - Delete quality reports with all empty sections
@api_router.post("/admin/clean-empty-quality-reports")
async def clean_empty_quality_reports(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "chairman", "quality"]:
        raise HTTPException(status_code=403, detail="صلاحيات المسؤول أو رئيس المجلس أو الجودة فقط")
    
    # Find all quality reports
    all_reports = await db.quality_reports.find().to_list(length=None)
    
    empty_count = 0
    
    for report in all_reports:
        # Check if all sections are empty
        academic = report.get("academic_performance", {})
        supervision = report.get("educational_supervision", {})
        discipline = report.get("discipline_behavior", {})
        activities = report.get("activities_programs", {})
        social = report.get("social_specialist", {})
        
        # Consider a section empty if it has no rate or the rate is empty string
        is_academic_empty = not academic or not academic.get("rate") or academic.get("rate") == ""
        is_supervision_empty = not supervision or not supervision.get("rate") or supervision.get("rate") == ""
        is_discipline_empty = not discipline or not discipline.get("rate") or discipline.get("rate") == ""
        is_activities_empty = not activities or not activities.get("rate") or activities.get("rate") == ""
        is_social_empty = not social or not social.get("rate") or social.get("rate") == ""
        
        # If all sections are empty, delete the report
        if (is_academic_empty and is_supervision_empty and is_discipline_empty and 
            is_activities_empty and is_social_empty):
            await db.quality_reports.delete_one({"id": report["id"]})
            empty_count += 1
    
    return {
        "message": f"تم حذف {empty_count} تقرير جودة فارغ بنجاح",
        "total_deleted": empty_count
    }

# Clean test users and their reports
@api_router.post("/admin/clean-test-users")
async def clean_test_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "chairman"]:
        raise HTTPException(status_code=403, detail="صلاحيات المسؤول أو رئيس المجلس فقط")
    
    # Test user IDs to delete
    test_user_ids = ["quality_user_001", "supervisor_001", "activities_001", "social_001"]
    
    deleted_users = 0
    deleted_reports = {}
    
    # Collections to clean
    report_collections = [
        ("supervisor_reports", "تقارير المشرفين"),
        ("vice_principal_reports", "تقارير الوكلاء"),
        ("activities_reports", "تقارير الأنشطة"),
        ("social_specialist_reports", "تقارير الأخصائي الاجتماعي"),
        ("quality_reports", "تقارير الجودة"),
        ("educational_supervision_reports", "تقارير الإشراف التربوي"),
        ("director_reports", "تقارير المدير")
    ]
    
    # Delete reports for test users
    for collection_name, arabic_name in report_collections:
        collection = db[collection_name]
        
        for user_id in test_user_ids:
            result = await collection.delete_many({"user_id": user_id})
            if result.deleted_count > 0:
                if arabic_name not in deleted_reports:
                    deleted_reports[arabic_name] = 0
                deleted_reports[arabic_name] += result.deleted_count
    
    # Delete test users
    for user_id in test_user_ids:
        result = await db.users.delete_one({"id": user_id})
        if result.deleted_count > 0:
            deleted_users += 1
    
    return {
        "message": f"تم حذف {deleted_users} مستخدم اختباري و تقاريرهم بنجاح",
        "deleted_users": deleted_users,
        "deleted_reports": deleted_reports
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["http://localhost:3000", "https://eduportal-200.preview.emergentagent.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()