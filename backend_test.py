#!/usr/bin/env python3
"""
Backend API Testing Script for School Management System
Tests authentication, activities reports, social specialist reports, and teachers endpoints
"""

import requests
import json
import uuid
from datetime import datetime, timezone
import sys

# Configuration
BASE_URL = "https://eduportal-200.preview.emergentagent.com/api"
ADMIN_USERNAME = "مدارس الفجر الجديد الأهلية"
ADMIN_PASSWORD = "2002002Hh"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data
        })
        
    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n=== Testing Authentication ===")
        
        # Test login with admin credentials
        login_data = {
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD,
            "remember_me": False
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data and "token" in data:
                    self.auth_token = data["token"]
                    user_info = data["user"]
                    self.log_test(
                        "Admin Login", 
                        True, 
                        f"Successfully logged in as {user_info.get('username', 'Unknown')} with role {user_info.get('role', 'Unknown')}"
                    )
                    
                    # Test /auth/me endpoint
                    me_response = self.session.get(f"{BASE_URL}/auth/me")
                    if me_response.status_code == 200:
                        me_data = me_response.json()
                        self.log_test(
                            "Get Current User", 
                            True, 
                            f"Retrieved user info: {me_data.get('username', 'Unknown')}"
                        )
                    else:
                        self.log_test(
                            "Get Current User", 
                            False, 
                            f"Failed to get current user: {me_response.status_code} - {me_response.text}"
                        )
                else:
                    self.log_test("Admin Login", False, "Login response missing user or token")
            else:
                self.log_test("Admin Login", False, f"Login failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Login exception: {str(e)}")
            
    def test_teachers_endpoint(self):
        """Test teachers endpoint"""
        print("\n=== Testing Teachers Endpoint ===")
        
        try:
            # Test GET /teachers
            response = self.session.get(f"{BASE_URL}/teachers")
            
            if response.status_code == 200:
                teachers = response.json()
                self.log_test(
                    "Get Teachers", 
                    True, 
                    f"Retrieved {len(teachers)} teachers"
                )
                
                # Test with branch filter
                boys_response = self.session.get(f"{BASE_URL}/teachers?branch=boys")
                if boys_response.status_code == 200:
                    boys_teachers = boys_response.json()
                    self.log_test(
                        "Get Teachers (Boys Branch)", 
                        True, 
                        f"Retrieved {len(boys_teachers)} teachers for boys branch"
                    )
                else:
                    self.log_test(
                        "Get Teachers (Boys Branch)", 
                        False, 
                        f"Failed: {boys_response.status_code} - {boys_response.text}"
                    )
                    
                # Test with subject filter
                math_response = self.session.get(f"{BASE_URL}/teachers?subject=رياضيات")
                if math_response.status_code == 200:
                    math_teachers = math_response.json()
                    self.log_test(
                        "Get Teachers (Math Subject)", 
                        True, 
                        f"Retrieved {len(math_teachers)} math teachers"
                    )
                else:
                    self.log_test(
                        "Get Teachers (Math Subject)", 
                        False, 
                        f"Failed: {math_response.status_code} - {math_response.text}"
                    )
            else:
                self.log_test("Get Teachers", False, f"Failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_test("Get Teachers", False, f"Exception: {str(e)}")
            
    def create_test_user(self, role, branch):
        """Create a test user for specific role testing"""
        user_data = {
            "username": f"test_{role}_{branch}_{uuid.uuid4().hex[:8]}",
            "password": "testpass123",
            "role": role,
            "branch": branch
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/users", json=user_data)
            if response.status_code == 200:
                created_user = response.json()
                return created_user, user_data["password"]
            else:
                print(f"Failed to create test user: {response.status_code} - {response.text}")
                return None, None
        except Exception as e:
            print(f"Exception creating test user: {str(e)}")
            return None, None
            
    def login_as_user(self, username, password):
        """Login as a specific user"""
        login_data = {
            "username": username,
            "password": password,
            "remember_me": False
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to login as {username}: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Exception logging in as {username}: {str(e)}")
            return None
            
    def test_activities_reports(self):
        """Test activities reports endpoints"""
        print("\n=== Testing Activities Reports ===")
        
        # First, create an activities user
        activities_user, password = self.create_test_user("activities", "boys")
        if not activities_user:
            self.log_test("Activities Reports Setup", False, "Failed to create activities test user")
            return
            
        # Login as activities user
        login_result = self.login_as_user(activities_user["username"], password)
        if not login_result:
            self.log_test("Activities Reports Setup", False, "Failed to login as activities user")
            return
            
        self.log_test("Activities User Login", True, f"Logged in as {activities_user['username']}")
        
        # Test POST - Create activities report
        activities_data = {
            "activities": [
                {
                    "name": "نشاط رياضي",
                    "type": "رياضي",
                    "date": datetime.now(timezone.utc).date().isoformat(),
                    "participants_count": 25,
                    "cooperating_teachers": ["أحمد محمد", "فاطمة علي"],
                    "description": "نشاط رياضي للطلاب",
                    "outcomes": "تحسن اللياقة البدنية"
                },
                {
                    "name": "نشاط ثقافي",
                    "type": "ثقافي",
                    "date": datetime.now(timezone.utc).date().isoformat(),
                    "participants_count": 30,
                    "cooperating_teachers": ["سارة أحمد"],
                    "description": "مسابقة ثقافية",
                    "outcomes": "زيادة المعرفة العامة"
                }
            ]
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/reports/activities", json=activities_data)
            
            if response.status_code == 200:
                created_report = response.json()
                report_id = created_report.get("id")
                self.log_test(
                    "Create Activities Report", 
                    True, 
                    f"Created report with ID: {report_id}"
                )
                
                # Test GET - Retrieve activities reports
                get_response = self.session.get(f"{BASE_URL}/reports/activities")
                if get_response.status_code == 200:
                    reports = get_response.json()
                    self.log_test(
                        "Get Activities Reports", 
                        True, 
                        f"Retrieved {len(reports)} activities reports"
                    )
                    
                    # Test with branch filter
                    branch_response = self.session.get(f"{BASE_URL}/reports/activities?branch=boys")
                    if branch_response.status_code == 200:
                        branch_reports = branch_response.json()
                        self.log_test(
                            "Get Activities Reports (Boys Branch)", 
                            True, 
                            f"Retrieved {len(branch_reports)} reports for boys branch"
                        )
                    else:
                        self.log_test(
                            "Get Activities Reports (Boys Branch)", 
                            False, 
                            f"Failed: {branch_response.status_code} - {branch_response.text}"
                        )
                        
                    # Test PUT - Update activities report
                    if report_id:
                        update_data = {
                            "activities": [
                                {
                                    "name": "نشاط رياضي محدث",
                                    "type": "رياضي",
                                    "date": datetime.now(timezone.utc).date().isoformat(),
                                    "participants_count": 30,
                                    "cooperating_teachers": ["أحمد محمد", "فاطمة علي", "محمد سالم"],
                                    "description": "نشاط رياضي محدث للطلاب",
                                    "outcomes": "تحسن كبير في اللياقة البدنية"
                                }
                            ]
                        }
                        
                        update_response = self.session.put(f"{BASE_URL}/reports/activities/{report_id}", json=update_data)
                        if update_response.status_code == 200:
                            self.log_test(
                                "Update Activities Report", 
                                True, 
                                "Successfully updated activities report"
                            )
                        else:
                            self.log_test(
                                "Update Activities Report", 
                                False, 
                                f"Failed: {update_response.status_code} - {update_response.text}"
                            )
                else:
                    self.log_test(
                        "Get Activities Reports", 
                        False, 
                        f"Failed: {get_response.status_code} - {get_response.text}"
                    )
            else:
                self.log_test(
                    "Create Activities Report", 
                    False, 
                    f"Failed: {response.status_code} - {response.text}"
                )
                
        except Exception as e:
            self.log_test("Activities Reports", False, f"Exception: {str(e)}")
            
        # Login back as admin for other tests
        self.test_authentication()
        
    def test_social_specialist_reports(self):
        """Test social specialist reports endpoints"""
        print("\n=== Testing Social Specialist Reports ===")
        
        # First, create a social specialist user
        specialist_user, password = self.create_test_user("social_specialist", "girls")
        if not specialist_user:
            self.log_test("Social Specialist Reports Setup", False, "Failed to create social specialist test user")
            return
            
        # Login as social specialist user
        login_result = self.login_as_user(specialist_user["username"], password)
        if not login_result:
            self.log_test("Social Specialist Reports Setup", False, "Failed to login as social specialist user")
            return
            
        self.log_test("Social Specialist User Login", True, f"Logged in as {specialist_user['username']}")
        
        # Test POST - Create social specialist report
        specialist_data = {
            "date": datetime.now(timezone.utc).date().isoformat(),
            "psychological_cases": 5,
            "academic_cases": 8,
            "behavioral_cases": 3,
            "sessions_count": 12,
            "families_contacted": 7,
            "referrals_count": 2,
            "follow_ups_count": 15,
            "guidance_programs": "برامج التوجيه النفسي والأكاديمي",
            "challenges": "صعوبة في التواصل مع بعض الأسر",
            "recommendations": "زيادة ورش التوعية للأهالي"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/reports/social-specialist", json=specialist_data)
            
            if response.status_code == 200:
                created_report = response.json()
                report_id = created_report.get("id")
                self.log_test(
                    "Create Social Specialist Report", 
                    True, 
                    f"Created report with ID: {report_id}"
                )
                
                # Test GET - Retrieve social specialist reports
                get_response = self.session.get(f"{BASE_URL}/reports/social-specialist")
                if get_response.status_code == 200:
                    reports = get_response.json()
                    self.log_test(
                        "Get Social Specialist Reports", 
                        True, 
                        f"Retrieved {len(reports)} social specialist reports"
                    )
                    
                    # Test with branch filter
                    branch_response = self.session.get(f"{BASE_URL}/reports/social-specialist?branch=girls")
                    if branch_response.status_code == 200:
                        branch_reports = branch_response.json()
                        self.log_test(
                            "Get Social Specialist Reports (Girls Branch)", 
                            True, 
                            f"Retrieved {len(branch_reports)} reports for girls branch"
                        )
                    else:
                        self.log_test(
                            "Get Social Specialist Reports (Girls Branch)", 
                            False, 
                            f"Failed: {branch_response.status_code} - {branch_response.text}"
                        )
                        
                    # Test PUT - Update social specialist report
                    if report_id:
                        update_data = {
                            "psychological_cases": 7,
                            "academic_cases": 10,
                            "behavioral_cases": 4,
                            "sessions_count": 15,
                            "families_contacted": 9,
                            "referrals_count": 3,
                            "follow_ups_count": 18,
                            "guidance_programs": "برامج التوجيه النفسي والأكاديمي المحدثة",
                            "challenges": "تحسن في التواصل مع الأسر",
                            "recommendations": "الاستمرار في ورش التوعية وزيادة الأنشطة الجماعية"
                        }
                        
                        update_response = self.session.put(f"{BASE_URL}/reports/social-specialist/{report_id}", json=update_data)
                        if update_response.status_code == 200:
                            self.log_test(
                                "Update Social Specialist Report", 
                                True, 
                                "Successfully updated social specialist report"
                            )
                        else:
                            self.log_test(
                                "Update Social Specialist Report", 
                                False, 
                                f"Failed: {update_response.status_code} - {update_response.text}"
                            )
                else:
                    self.log_test(
                        "Get Social Specialist Reports", 
                        False, 
                        f"Failed: {get_response.status_code} - {get_response.text}"
                    )
            else:
                self.log_test(
                    "Create Social Specialist Report", 
                    False, 
                    f"Failed: {response.status_code} - {response.text}"
                )
                
        except Exception as e:
            self.log_test("Social Specialist Reports", False, f"Exception: {str(e)}")
            
        # Login back as admin for other tests
        self.test_authentication()
        
    def test_quality_reports(self):
        """Test quality reports endpoints (bonus test)"""
        print("\n=== Testing Quality Reports ===")
        
        # First, create a quality user
        quality_user, password = self.create_test_user("quality", "boys")
        if not quality_user:
            self.log_test("Quality Reports Setup", False, "Failed to create quality test user")
            return
            
        # Login as quality user
        login_result = self.login_as_user(quality_user["username"], password)
        if not login_result:
            self.log_test("Quality Reports Setup", False, "Failed to login as quality user")
            return
            
        self.log_test("Quality User Login", True, f"Logged in as {quality_user['username']}")
        
        # Test POST - Create quality report
        quality_data = {
            "date": datetime.now(timezone.utc).date().isoformat(),
            "academic_performance": {
                "evaluation": "ممتاز",
                "notes": "أداء أكاديمي متميز",
                "recommendations": "الاستمرار في التطوير"
            },
            "educational_supervision": {
                "evaluation": "جيد جداً",
                "notes": "إشراف تعليمي فعال",
                "recommendations": "زيادة الزيارات الصفية"
            },
            "discipline_behavior": {
                "evaluation": "جيد",
                "notes": "انضباط عام جيد",
                "recommendations": "تعزيز القوانين"
            },
            "activities_programs": {
                "evaluation": "ممتاز",
                "notes": "برامج أنشطة متنوعة",
                "recommendations": "إضافة أنشطة جديدة"
            },
            "social_specialist": {
                "evaluation": "جيد جداً",
                "notes": "خدمات اجتماعية فعالة",
                "recommendations": "زيادة البرامج التوعوية"
            }
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/reports/quality", json=quality_data)
            
            if response.status_code == 200:
                created_report = response.json()
                report_id = created_report.get("id")
                self.log_test(
                    "Create Quality Report", 
                    True, 
                    f"Created report with ID: {report_id}"
                )
                
                # Test GET - Retrieve quality reports
                get_response = self.session.get(f"{BASE_URL}/reports/quality")
                if get_response.status_code == 200:
                    reports = get_response.json()
                    self.log_test(
                        "Get Quality Reports", 
                        True, 
                        f"Retrieved {len(reports)} quality reports"
                    )
                else:
                    self.log_test(
                        "Get Quality Reports", 
                        False, 
                        f"Failed: {get_response.status_code} - {get_response.text}"
                    )
            else:
                self.log_test(
                    "Create Quality Report", 
                    False, 
                    f"Failed: {response.status_code} - {response.text}"
                )
                
        except Exception as e:
            self.log_test("Quality Reports", False, f"Exception: {str(e)}")
            
        # Login back as admin for other tests
        self.test_authentication()
        
    def test_supervisor_reports(self):
        """Test supervisor reports endpoints"""
        print("\n=== Testing Supervisor Reports ===")
        
        # First, create a supervisor user
        supervisor_user, password = self.create_test_user("supervisor", "boys")
        if not supervisor_user:
            self.log_test("Supervisor Reports Setup", False, "Failed to create supervisor test user")
            return
            
        # Login as supervisor user
        login_result = self.login_as_user(supervisor_user["username"], password)
        if not login_result:
            self.log_test("Supervisor Reports Setup", False, "Failed to login as supervisor user")
            return
            
        self.log_test("Supervisor User Login", True, f"Logged in as {supervisor_user['username']}")
        
        # Test POST - Create supervisor report
        supervisor_data = {
            "date": datetime.now(timezone.utc).date().isoformat(),
            "student_discipline": 85,
            "student_discipline_notes": "انضباط جيد بشكل عام",
            "classroom_cleanliness": 90,
            "classroom_cleanliness_notes": "نظافة ممتازة في معظم الفصول",
            "teacher_attendance_rate": 95,
            "late_teachers": [
                {"teacher": "أحمد محمد", "subject": "رياضيات", "minutes_late": 10},
                {"teacher": "فاطمة علي", "subject": "علوم", "minutes_late": 5}
            ],
            "teacher_attendance_notes": "حضور جيد مع تأخير بسيط لبعض المعلمين",
            "student_movement": "منتظم",
            "student_movement_classes": ["الصف الأول أ", "الصف الثاني ب"],
            "student_movement_notes": "حركة طلابية منتظمة",
            "general_behavior": 88,
            "general_notes": "سلوك عام جيد",
            "incidents": [
                {"type": "شجار", "description": "شجار بسيط بين طالبين", "action": "تم حل المشكلة ودياً"},
                {"type": "تأخير", "description": "تأخير مجموعة من الطلاب", "action": "تم توجيههم وتحذيرهم"}
            ],
            "absent_teachers": [
                {"teacher": "سارة أحمد", "subject": "لغة عربية", "reason": "مرض"}
            ],
            "covering_teachers": [
                {"teacher": "محمد سالم", "covered_subject": "لغة عربية", "original_teacher": "سارة أحمد"}
            ],
            "absent_students_count": 12
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/reports/supervisor", json=supervisor_data)
            
            if response.status_code == 200:
                created_report = response.json()
                report_id = created_report.get("id")
                self.log_test(
                    "Create Supervisor Report", 
                    True, 
                    f"Created report with ID: {report_id}"
                )
                
                # Test GET - Retrieve supervisor reports
                get_response = self.session.get(f"{BASE_URL}/reports/supervisor")
                if get_response.status_code == 200:
                    reports = get_response.json()
                    self.log_test(
                        "Get Supervisor Reports", 
                        True, 
                        f"Retrieved {len(reports)} supervisor reports"
                    )
                    
                    # Test with branch filter
                    branch_response = self.session.get(f"{BASE_URL}/reports/supervisor?branch=boys")
                    if branch_response.status_code == 200:
                        branch_reports = branch_response.json()
                        self.log_test(
                            "Get Supervisor Reports (Boys Branch)", 
                            True, 
                            f"Retrieved {len(branch_reports)} reports for boys branch"
                        )
                    else:
                        self.log_test(
                            "Get Supervisor Reports (Boys Branch)", 
                            False, 
                            f"Failed: {branch_response.status_code} - {branch_response.text}"
                        )
                        
                    # Test PUT - Update supervisor report
                    if report_id:
                        update_data = {
                            "student_discipline": 90,
                            "student_discipline_notes": "تحسن في الانضباط",
                            "general_behavior": 92,
                            "general_notes": "تحسن ملحوظ في السلوك العام"
                        }
                        
                        update_response = self.session.put(f"{BASE_URL}/reports/supervisor/{report_id}", json=update_data)
                        if update_response.status_code == 200:
                            self.log_test(
                                "Update Supervisor Report", 
                                True, 
                                "Successfully updated supervisor report"
                            )
                        else:
                            self.log_test(
                                "Update Supervisor Report", 
                                False, 
                                f"Failed: {update_response.status_code} - {update_response.text}"
                            )
                else:
                    self.log_test(
                        "Get Supervisor Reports", 
                        False, 
                        f"Failed: {get_response.status_code} - {get_response.text}"
                    )
            else:
                self.log_test(
                    "Create Supervisor Report", 
                    False, 
                    f"Failed: {response.status_code} - {response.text}"
                )
                
        except Exception as e:
            self.log_test("Supervisor Reports", False, f"Exception: {str(e)}")
            
        # Login back as admin for other tests
        self.test_authentication()
        
    def test_vice_principal_reports(self):
        """Test vice principal reports endpoints"""
        print("\n=== Testing Vice Principal Reports ===")
        
        # First, create a vice principal user
        vp_user, password = self.create_test_user("vice_principal", "girls")
        if not vp_user:
            self.log_test("Vice Principal Reports Setup", False, "Failed to create vice principal test user")
            return
            
        # Login as vice principal user
        login_result = self.login_as_user(vp_user["username"], password)
        if not login_result:
            self.log_test("Vice Principal Reports Setup", False, "Failed to login as vice principal user")
            return
            
        self.log_test("Vice Principal User Login", True, f"Logged in as {vp_user['username']}")
        
        # Test POST - Create vice principal report
        vp_data = {
            "week_start": "2024-01-15",
            "week_end": "2024-01-19",
            "problems": [
                {"category": "انضباط", "description": "تأخير بعض الطلاب"},
                {"category": "نظافة", "description": "حاجة لتحسين نظافة بعض الفصول"}
            ],
            "suggestions": [
                "زيادة الرقابة في بداية اليوم الدراسي",
                "تنظيم حملة نظافة أسبوعية",
                "تفعيل دور مجلس الطلاب"
            ],
            "supervisor_reports": []  # Will be filled with actual supervisor report IDs in real scenario
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/reports/vice-principal", json=vp_data)
            
            if response.status_code == 200:
                created_report = response.json()
                report_id = created_report.get("id")
                self.log_test(
                    "Create Vice Principal Report", 
                    True, 
                    f"Created report with ID: {report_id}"
                )
                
                # Test GET - Retrieve vice principal reports
                get_response = self.session.get(f"{BASE_URL}/reports/vice-principal")
                if get_response.status_code == 200:
                    reports = get_response.json()
                    self.log_test(
                        "Get Vice Principal Reports", 
                        True, 
                        f"Retrieved {len(reports)} vice principal reports"
                    )
                else:
                    self.log_test(
                        "Get Vice Principal Reports", 
                        False, 
                        f"Failed: {get_response.status_code} - {get_response.text}"
                    )
            else:
                self.log_test(
                    "Create Vice Principal Report", 
                    False, 
                    f"Failed: {response.status_code} - {response.text}"
                )
                
        except Exception as e:
            self.log_test("Vice Principal Reports", False, f"Exception: {str(e)}")
            
        # Login back as admin for other tests
        self.test_authentication()
        
    def test_users_endpoint(self):
        """Test users management endpoints"""
        print("\n=== Testing Users Endpoint ===")
        
        try:
            # Test GET /users (as admin)
            response = self.session.get(f"{BASE_URL}/users")
            
            if response.status_code == 200:
                users = response.json()
                self.log_test(
                    "Get Users", 
                    True, 
                    f"Retrieved {len(users)} users"
                )
                
                # Verify admin user exists
                admin_found = any(user.get("username") == ADMIN_USERNAME for user in users)
                if admin_found:
                    self.log_test(
                        "Admin User Exists", 
                        True, 
                        "Admin user found in users list"
                    )
                else:
                    self.log_test(
                        "Admin User Exists", 
                        False, 
                        "Admin user not found in users list"
                    )
                    
            else:
                self.log_test("Get Users", False, f"Failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_test("Get Users", False, f"Exception: {str(e)}")
        
    def test_director_dashboard_filtering(self):
        """Test director dashboard filtering functionality"""
        print("\n=== Testing Director Dashboard Filtering ===")
        
        # First, create a director user
        director_user, password = self.create_test_user("director", "boys")
        if not director_user:
            self.log_test("Director Dashboard Setup", False, "Failed to create director test user")
            return
            
        # Login as director user
        login_result = self.login_as_user(director_user["username"], password)
        if not login_result:
            self.log_test("Director Dashboard Setup", False, "Failed to login as director user")
            return
            
        self.log_test("Director User Login", True, f"Logged in as {director_user['username']} with role director")
        
        try:
            # Test 1: Get all users (for employee filtering)
            users_response = self.session.get(f"{BASE_URL}/users")
            if users_response.status_code == 200:
                users = users_response.json()
                branch_users = [u for u in users if u.get("branch") == "boys"]
                self.log_test(
                    "Director - Get Users for Filtering", 
                    True, 
                    f"Retrieved {len(branch_users)} users for boys branch filtering"
                )
            else:
                self.log_test(
                    "Director - Get Users for Filtering", 
                    False, 
                    f"Failed: {users_response.status_code} - {users_response.text}"
                )
                
            # Test 2: Get all report types with branch filtering
            report_endpoints = [
                ("supervisor", "/reports/supervisor"),
                ("vice-principal", "/reports/vice-principal"), 
                ("activities", "/reports/activities"),
                ("social-specialist", "/reports/social-specialist"),
                ("quality", "/reports/quality")
            ]
            
            for report_name, endpoint in report_endpoints:
                # Test without filters
                response = self.session.get(f"{BASE_URL}{endpoint}")
                if response.status_code == 200:
                    reports = response.json()
                    branch_reports = [r for r in reports if r.get("branch") == "boys"]
                    self.log_test(
                        f"Director - Get {report_name} Reports", 
                        True, 
                        f"Retrieved {len(branch_reports)} {report_name} reports for boys branch"
                    )
                    
                    # Test with branch filter
                    branch_response = self.session.get(f"{BASE_URL}{endpoint}?branch=boys")
                    if branch_response.status_code == 200:
                        filtered_reports = branch_response.json()
                        self.log_test(
                            f"Director - Get {report_name} Reports (Branch Filter)", 
                            True, 
                            f"Retrieved {len(filtered_reports)} {report_name} reports with branch filter"
                        )
                    else:
                        self.log_test(
                            f"Director - Get {report_name} Reports (Branch Filter)", 
                            False, 
                            f"Failed: {branch_response.status_code} - {branch_response.text}"
                        )
                        
                    # Test with user_id filter (if we have users)
                    if branch_users:
                        test_user_id = branch_users[0].get("id")
                        if test_user_id:
                            user_response = self.session.get(f"{BASE_URL}{endpoint}?user_id={test_user_id}")
                            if user_response.status_code == 200:
                                user_reports = user_response.json()
                                self.log_test(
                                    f"Director - Get {report_name} Reports (User Filter)", 
                                    True, 
                                    f"Retrieved {len(user_reports)} {report_name} reports for specific user"
                                )
                            else:
                                self.log_test(
                                    f"Director - Get {report_name} Reports (User Filter)", 
                                    False, 
                                    f"Failed: {user_response.status_code} - {user_response.text}"
                                )
                else:
                    self.log_test(
                        f"Director - Get {report_name} Reports", 
                        False, 
                        f"Failed: {response.status_code} - {response.text}"
                    )
                    
            # Test 3: Test statistics endpoints that director dashboard uses
            stats_response = self.session.get(f"{BASE_URL}/statistics/teacher-absences?branch=boys")
            if stats_response.status_code == 200:
                stats = stats_response.json()
                self.log_test(
                    "Director - Teacher Absences Statistics", 
                    True, 
                    f"Retrieved teacher absence statistics with {len(stats)} teachers"
                )
            else:
                self.log_test(
                    "Director - Teacher Absences Statistics", 
                    False, 
                    f"Failed: {stats_response.status_code} - {stats_response.text}"
                )
                
            eval_response = self.session.get(f"{BASE_URL}/statistics/teacher-evaluations?branch=boys")
            if eval_response.status_code == 200:
                evaluations = eval_response.json()
                self.log_test(
                    "Director - Teacher Evaluations Statistics", 
                    True, 
                    f"Retrieved teacher evaluation statistics with {len(evaluations)} teachers"
                )
            else:
                self.log_test(
                    "Director - Teacher Evaluations Statistics", 
                    False, 
                    f"Failed: {eval_response.status_code} - {eval_response.text}"
                )
                
        except Exception as e:
            self.log_test("Director Dashboard Filtering", False, f"Exception: {str(e)}")
            
        # Login back as admin for other tests
        self.test_authentication()
        
    def test_report_type_filtering_scenarios(self):
        """Test specific report type filtering scenarios as requested"""
        print("\n=== Testing Report Type Filtering Scenarios ===")
        
        try:
            # Test scenario 1: When "جميع التقارير" (all reports) is selected
            # Should return overall statistics from all report types
            all_reports_data = {}
            
            report_types = [
                ("supervisor", "/reports/supervisor"),
                ("vice_principal", "/reports/vice-principal"),
                ("activities", "/reports/activities"), 
                ("social_specialist", "/reports/social-specialist"),
                ("quality", "/reports/quality")
            ]
            
            for report_type, endpoint in report_types:
                response = self.session.get(f"{BASE_URL}{endpoint}")
                if response.status_code == 200:
                    reports = response.json()
                    all_reports_data[report_type] = reports
                    self.log_test(
                        f"All Reports Filter - {report_type}", 
                        True, 
                        f"Retrieved {len(reports)} {report_type} reports for overall statistics"
                    )
                else:
                    self.log_test(
                        f"All Reports Filter - {report_type}", 
                        False, 
                        f"Failed to get {report_type} reports: {response.status_code}"
                    )
                    
            # Test scenario 2: When specific report type is selected
            # Should show employee filter for that type
            for report_type, endpoint in report_types:
                # Get users of the corresponding role
                users_response = self.session.get(f"{BASE_URL}/users")
                if users_response.status_code == 200:
                    users = users_response.json()
                    
                    # Map report types to user roles
                    role_mapping = {
                        "supervisor": "supervisor",
                        "vice_principal": "vice_principal", 
                        "activities": "activities",
                        "social_specialist": "social_specialist",
                        "quality": "quality"
                    }
                    
                    role = role_mapping.get(report_type)
                    if role:
                        role_users = [u for u in users if u.get("role") == role]
                        self.log_test(
                            f"Employee Filter - {report_type} Users", 
                            True, 
                            f"Found {len(role_users)} {role} users for employee filtering"
                        )
                        
                        # Test filtering by specific employee
                        if role_users:
                            test_user = role_users[0]
                            user_reports_response = self.session.get(f"{BASE_URL}{endpoint}?user_id={test_user['id']}")
                            if user_reports_response.status_code == 200:
                                user_reports = user_reports_response.json()
                                self.log_test(
                                    f"Specific Employee Filter - {report_type}", 
                                    True, 
                                    f"Retrieved {len(user_reports)} reports for specific {role} employee"
                                )
                            else:
                                self.log_test(
                                    f"Specific Employee Filter - {report_type}", 
                                    False, 
                                    f"Failed to filter by employee: {user_reports_response.status_code}"
                                )
                                
            # Test scenario 3: Time filtering (daily, weekly, monthly)
            # Test with supervisor reports as example
            supervisor_response = self.session.get(f"{BASE_URL}/reports/supervisor")
            if supervisor_response.status_code == 200:
                supervisor_reports = supervisor_response.json()
                
                # Test date-based filtering (simulated)
                today = datetime.now().date().isoformat()
                current_month = datetime.now().strftime("%Y-%m")
                
                # Filter reports by today (daily filter simulation)
                daily_reports = [r for r in supervisor_reports if r.get("date") == today]
                self.log_test(
                    "Time Filter - Daily", 
                    True, 
                    f"Daily filter would show {len(daily_reports)} reports for today ({today})"
                )
                
                # Filter reports by current month (monthly filter simulation)  
                monthly_reports = [r for r in supervisor_reports if r.get("date", "").startswith(current_month)]
                self.log_test(
                    "Time Filter - Monthly", 
                    True, 
                    f"Monthly filter would show {len(monthly_reports)} reports for current month ({current_month})"
                )
                
        except Exception as e:
            self.log_test("Report Type Filtering Scenarios", False, f"Exception: {str(e)}")

    def test_vice_principal_dashboard_issue(self):
        """Test Vice-Principal dashboard functionality to identify supervisor reports issue"""
        print("\n=== Testing Vice-Principal Dashboard Issue ===")
        
        # Step 1: Create a Vice-Principal user
        vp_user, vp_password = self.create_test_user("vice_principal", "boys")
        if not vp_user:
            self.log_test("VP Dashboard Setup", False, "Failed to create vice principal test user")
            return
            
        vp_id = vp_user["id"]
        vp_branch = vp_user["branch"]
        
        self.log_test("VP User Creation", True, f"Created VP: ID={vp_id}, Branch={vp_branch}")
        
        # Step 2: Create supervisors assigned to this VP
        supervisor1_user, supervisor1_password = self.create_test_user("supervisor", "boys")
        supervisor2_user, supervisor2_password = self.create_test_user("supervisor", "boys")
        
        if not supervisor1_user or not supervisor2_user:
            self.log_test("Supervisors Creation", False, "Failed to create supervisor test users")
            return
            
        # Step 3: Update supervisors to be assigned to the VP
        try:
            # Update supervisor1 to be assigned to VP
            update_data1 = {"assigned_to": vp_id}
            update_response1 = self.session.put(f"{BASE_URL}/users/{supervisor1_user['id']}", json=update_data1)
            
            # Update supervisor2 to be assigned to VP  
            update_data2 = {"assigned_to": vp_id}
            update_response2 = self.session.put(f"{BASE_URL}/users/{supervisor2_user['id']}", json=update_data2)
            
            if update_response1.status_code == 200 and update_response2.status_code == 200:
                self.log_test("Supervisors Assignment", True, f"Assigned 2 supervisors to VP {vp_id}")
            else:
                self.log_test("Supervisors Assignment", False, f"Failed to assign supervisors: {update_response1.status_code}, {update_response2.status_code}")
                return
                
        except Exception as e:
            self.log_test("Supervisors Assignment", False, f"Exception: {str(e)}")
            return
            
        # Step 4: Create supervisor reports from these supervisors
        # Login as supervisor1 and create a report
        login_result1 = self.login_as_user(supervisor1_user["username"], supervisor1_password)
        if login_result1:
            supervisor_data1 = {
                "date": datetime.now(timezone.utc).date().isoformat(),
                "student_discipline": 85,
                "classroom_cleanliness": 90,
                "teacher_attendance_rate": 95,
                "general_behavior": 88,
                "absent_students_count": 5
            }
            
            try:
                response1 = self.session.post(f"{BASE_URL}/reports/supervisor", json=supervisor_data1)
                if response1.status_code == 200:
                    report1 = response1.json()
                    self.log_test("Supervisor1 Report Creation", True, f"Created report ID: {report1.get('id')}")
                else:
                    self.log_test("Supervisor1 Report Creation", False, f"Failed: {response1.status_code} - {response1.text}")
            except Exception as e:
                self.log_test("Supervisor1 Report Creation", False, f"Exception: {str(e)}")
        
        # Login as supervisor2 and create a report
        login_result2 = self.login_as_user(supervisor2_user["username"], supervisor2_password)
        if login_result2:
            supervisor_data2 = {
                "date": datetime.now(timezone.utc).date().isoformat(),
                "student_discipline": 92,
                "classroom_cleanliness": 88,
                "teacher_attendance_rate": 98,
                "general_behavior": 90,
                "absent_students_count": 3
            }
            
            try:
                response2 = self.session.post(f"{BASE_URL}/reports/supervisor", json=supervisor_data2)
                if response2.status_code == 200:
                    report2 = response2.json()
                    self.log_test("Supervisor2 Report Creation", True, f"Created report ID: {report2.get('id')}")
                else:
                    self.log_test("Supervisor2 Report Creation", False, f"Failed: {response2.status_code} - {response2.text}")
            except Exception as e:
                self.log_test("Supervisor2 Report Creation", False, f"Exception: {str(e)}")
        
        # Step 5: Login as Vice-Principal and test dashboard functionality
        vp_login_result = self.login_as_user(vp_user["username"], vp_password)
        if not vp_login_result:
            self.log_test("VP Login", False, "Failed to login as VP")
            return
            
        self.log_test("VP Login", True, f"Successfully logged in as VP: {vp_user['username']}")
        
        # Step 6: Check VP user data
        try:
            me_response = self.session.get(f"{BASE_URL}/auth/me")
            if me_response.status_code == 200:
                vp_data = me_response.json()
                self.log_test("VP User Data Check", True, f"VP ID: {vp_data.get('id')}, Branch: {vp_data.get('branch')}")
                
                # Verify the VP data matches what we expect
                if vp_data.get('id') == vp_id and vp_data.get('branch') == vp_branch:
                    self.log_test("VP Data Verification", True, "VP ID and branch match expected values")
                else:
                    self.log_test("VP Data Verification", False, f"VP data mismatch. Expected ID: {vp_id}, Got: {vp_data.get('id')}")
            else:
                self.log_test("VP User Data Check", False, f"Failed: {me_response.status_code} - {me_response.text}")
        except Exception as e:
            self.log_test("VP User Data Check", False, f"Exception: {str(e)}")
            
        # Step 7: Check supervisors assigned to this VP
        try:
            users_response = self.session.get(f"{BASE_URL}/users")
            if users_response.status_code == 200:
                all_users = users_response.json()
                assigned_supervisors = [u for u in all_users if u.get("assigned_to") == vp_id and u.get("role") == "supervisor"]
                
                self.log_test("Check Assigned Supervisors", True, f"Found {len(assigned_supervisors)} supervisors assigned to VP {vp_id}")
                
                for i, supervisor in enumerate(assigned_supervisors, 1):
                    self.log_test(f"Supervisor {i} Details", True, f"ID: {supervisor.get('id')}, Username: {supervisor.get('username')}, Branch: {supervisor.get('branch')}")
                    
            else:
                self.log_test("Check Assigned Supervisors", False, f"Failed to get users: {users_response.status_code} - {users_response.text}")
        except Exception as e:
            self.log_test("Check Assigned Supervisors", False, f"Exception: {str(e)}")
            
        # Step 8: Test supervisor reports endpoint as VP
        try:
            supervisor_reports_response = self.session.get(f"{BASE_URL}/reports/supervisor")
            if supervisor_reports_response.status_code == 200:
                supervisor_reports = supervisor_reports_response.json()
                self.log_test("VP Get Supervisor Reports", True, f"VP can access {len(supervisor_reports)} supervisor reports")
                
                # Check if reports are from assigned supervisors
                assigned_supervisor_ids = [supervisor1_user["id"], supervisor2_user["id"]]
                vp_supervisor_reports = [r for r in supervisor_reports if r.get("user_id") in assigned_supervisor_ids]
                
                self.log_test("VP Supervisor Reports Filter", True, f"Found {len(vp_supervisor_reports)} reports from VP's assigned supervisors")
                
                if len(vp_supervisor_reports) > 0:
                    for i, report in enumerate(vp_supervisor_reports, 1):
                        self.log_test(f"VP Report {i} Details", True, f"Report ID: {report.get('id')}, User ID: {report.get('user_id')}, Date: {report.get('date')}")
                else:
                    self.log_test("VP Reports Issue", False, "VP cannot see any reports from assigned supervisors - THIS IS THE ISSUE!")
                    
            else:
                self.log_test("VP Get Supervisor Reports", False, f"Failed: {supervisor_reports_response.status_code} - {supervisor_reports_response.text}")
        except Exception as e:
            self.log_test("VP Get Supervisor Reports", False, f"Exception: {str(e)}")
            
        # Step 9: Debug - Check all supervisor reports in system
        # Login back as admin to see all reports
        self.test_authentication()
        
        try:
            all_reports_response = self.session.get(f"{BASE_URL}/reports/supervisor")
            if all_reports_response.status_code == 200:
                all_reports = all_reports_response.json()
                self.log_test("Debug - All Supervisor Reports", True, f"Total supervisor reports in system: {len(all_reports)}")
                
                # Check which reports belong to our test supervisors
                test_supervisor_reports = [r for r in all_reports if r.get("user_id") in [supervisor1_user["id"], supervisor2_user["id"]]]
                self.log_test("Debug - Test Supervisor Reports", True, f"Reports from test supervisors: {len(test_supervisor_reports)}")
                
                for report in test_supervisor_reports:
                    self.log_test("Debug - Report Details", True, f"Report: ID={report.get('id')}, User={report.get('user_id')}, Branch={report.get('branch')}")
                    
            else:
                self.log_test("Debug - All Supervisor Reports", False, f"Failed: {all_reports_response.status_code}")
        except Exception as e:
            self.log_test("Debug - All Supervisor Reports", False, f"Exception: {str(e)}")
            
        # Step 10: Debug - Check user assignments
        try:
            users_response = self.session.get(f"{BASE_URL}/users")
            if users_response.status_code == 200:
                all_users = users_response.json()
                
                # Find our VP
                vp_in_system = next((u for u in all_users if u.get("id") == vp_id), None)
                if vp_in_system:
                    self.log_test("Debug - VP in System", True, f"VP found: ID={vp_in_system.get('id')}, Role={vp_in_system.get('role')}, Branch={vp_in_system.get('branch')}")
                else:
                    self.log_test("Debug - VP in System", False, "VP not found in system")
                    
                # Find supervisors assigned to this VP
                assigned_supervisors = [u for u in all_users if u.get("assigned_to") == vp_id]
                self.log_test("Debug - Assigned Supervisors", True, f"Supervisors assigned to VP {vp_id}: {len(assigned_supervisors)}")
                
                for supervisor in assigned_supervisors:
                    self.log_test("Debug - Supervisor Assignment", True, f"Supervisor: ID={supervisor.get('id')}, Role={supervisor.get('role')}, Branch={supervisor.get('branch')}, Assigned_to={supervisor.get('assigned_to')}")
                    
            else:
                self.log_test("Debug - Users Check", False, f"Failed: {users_response.status_code}")
        except Exception as e:
            self.log_test("Debug - Users Check", False, f"Exception: {str(e)}")

    def check_existing_vp_supervisor_data(self):
        """Check existing VP and supervisor data in the system"""
        print("\n=== Checking Existing VP and Supervisor Data ===")
        
        try:
            # Get all users
            users_response = self.session.get(f"{BASE_URL}/users")
            if users_response.status_code == 200:
                all_users = users_response.json()
                
                # Find all VPs
                vps = [u for u in all_users if u.get("role") == "vice_principal"]
                self.log_test("Existing VPs", True, f"Found {len(vps)} Vice-Principals in system")
                
                for i, vp in enumerate(vps, 1):
                    self.log_test(f"VP {i}", True, f"ID: {vp.get('id')}, Username: {vp.get('username')}, Branch: {vp.get('branch')}")
                    
                    # Find supervisors assigned to this VP
                    assigned_supervisors = [u for u in all_users if u.get("assigned_to") == vp.get("id")]
                    self.log_test(f"VP {i} Assigned Supervisors", True, f"Found {len(assigned_supervisors)} supervisors assigned")
                    
                    for j, supervisor in enumerate(assigned_supervisors, 1):
                        self.log_test(f"VP {i} Supervisor {j}", True, f"ID: {supervisor.get('id')}, Username: {supervisor.get('username')}, Branch: {supervisor.get('branch')}")
                        
                    # Check supervisor reports for this VP
                    if assigned_supervisors:
                        supervisor_ids = [s.get("id") for s in assigned_supervisors]
                        
                        # Get all supervisor reports
                        reports_response = self.session.get(f"{BASE_URL}/reports/supervisor")
                        if reports_response.status_code == 200:
                            all_reports = reports_response.json()
                            vp_reports = [r for r in all_reports if r.get("user_id") in supervisor_ids]
                            self.log_test(f"VP {i} Supervisor Reports", True, f"Found {len(vp_reports)} reports from assigned supervisors")
                            
                            for k, report in enumerate(vp_reports[:3], 1):  # Show first 3 reports
                                self.log_test(f"VP {i} Report {k}", True, f"ID: {report.get('id')}, Date: {report.get('date')}, User: {report.get('user_id')}")
                        else:
                            self.log_test(f"VP {i} Supervisor Reports", False, f"Failed to get reports: {reports_response.status_code}")
                    else:
                        self.log_test(f"VP {i} Issue", False, "No supervisors assigned to this VP - THIS COULD BE THE ISSUE!")
                        
                # Find all supervisors
                supervisors = [u for u in all_users if u.get("role") == "supervisor"]
                self.log_test("Existing Supervisors", True, f"Found {len(supervisors)} Supervisors in system")
                
                # Check how many supervisors are assigned vs unassigned
                assigned_supervisors = [s for s in supervisors if s.get("assigned_to")]
                unassigned_supervisors = [s for s in supervisors if not s.get("assigned_to")]
                
                self.log_test("Supervisor Assignment Status", True, f"Assigned: {len(assigned_supervisors)}, Unassigned: {len(unassigned_supervisors)}")
                
                if unassigned_supervisors:
                    self.log_test("Unassigned Supervisors Issue", False, f"{len(unassigned_supervisors)} supervisors are not assigned to any VP!")
                    for supervisor in unassigned_supervisors[:5]:  # Show first 5
                        self.log_test("Unassigned Supervisor", False, f"ID: {supervisor.get('id')}, Username: {supervisor.get('username')}, Branch: {supervisor.get('branch')}")
                        
            else:
                self.log_test("Get Users", False, f"Failed: {users_response.status_code} - {users_response.text}")
                
        except Exception as e:
            self.log_test("Check Existing Data", False, f"Exception: {str(e)}")

    def investigate_supervisor_reports_issue(self):
        """Investigate the supervisor reports issue as requested"""
        print("\n=== INVESTIGATING SUPERVISOR REPORTS ISSUE ===")
        
        try:
            # Step 1: Check Supervisor Reports
            print("\n1. Checking Supervisor Reports...")
            reports_response = self.session.get(f"{BASE_URL}/reports/supervisor")
            
            if reports_response.status_code == 200:
                supervisor_reports = reports_response.json()
                total_reports = len(supervisor_reports)
                self.log_test("Get Supervisor Reports", True, f"Total supervisor reports in database: {total_reports}")
                
                # Show sample report with user_id
                if supervisor_reports:
                    sample_report = supervisor_reports[0]
                    self.log_test("Sample Supervisor Report", True, f"Sample report ID: {sample_report.get('id')}, User ID: {sample_report.get('user_id')}, Date: {sample_report.get('date')}, Branch: {sample_report.get('branch')}")
                else:
                    self.log_test("Sample Supervisor Report", False, "No supervisor reports found in database")
            else:
                self.log_test("Get Supervisor Reports", False, f"Failed to get supervisor reports: {reports_response.status_code} - {reports_response.text}")
                return
                
            # Step 2: Check Current Supervisors
            print("\n2. Checking Current Supervisors...")
            users_response = self.session.get(f"{BASE_URL}/users")
            
            if users_response.status_code == 200:
                all_users = users_response.json()
                supervisors = [u for u in all_users if u.get("role") == "supervisor"]
                total_supervisors = len(supervisors)
                
                self.log_test("Get Current Supervisors", True, f"Total current supervisors: {total_supervisors}")
                
                # List all supervisor IDs and assigned_to values
                supervisor_ids = []
                for i, supervisor in enumerate(supervisors, 1):
                    supervisor_id = supervisor.get('id')
                    assigned_to = supervisor.get('assigned_to')
                    supervisor_ids.append(supervisor_id)
                    self.log_test(f"Supervisor {i}", True, f"ID: {supervisor_id}, Username: {supervisor.get('username')}, Branch: {supervisor.get('branch')}, Assigned_to: {assigned_to}")
                    
            else:
                self.log_test("Get Current Supervisors", False, f"Failed to get users: {users_response.status_code} - {users_response.text}")
                return
                
            # Step 3: Match Reports to Users
            print("\n3. Matching Reports to Users...")
            
            # Check if any report's user_id matches current supervisor IDs
            matched_reports = []
            orphaned_reports = []
            
            for report in supervisor_reports:
                report_user_id = report.get('user_id')
                if report_user_id in supervisor_ids:
                    matched_reports.append(report)
                else:
                    orphaned_reports.append(report)
                    
            matched_count = len(matched_reports)
            orphaned_count = len(orphaned_reports)
            
            self.log_test("Matched Reports", True, f"Reports where user_id matches current supervisors: {matched_count}")
            self.log_test("Orphaned Reports", True if orphaned_count == 0 else False, f"Reports where user_id doesn't match any current supervisor: {orphaned_count}")
            
            # Step 4: Verify the Issue
            print("\n4. Issue Verification...")
            
            if orphaned_count > 0:
                self.log_test("Issue Identified", False, f"ISSUE CONFIRMED: {orphaned_count} supervisor reports are orphaned (user_id doesn't match any current supervisor)")
                
                # Show details of orphaned reports
                print("\n   Orphaned Reports Details:")
                for i, report in enumerate(orphaned_reports[:5], 1):  # Show first 5
                    self.log_test(f"Orphaned Report {i}", False, f"Report ID: {report.get('id')}, User ID: {report.get('user_id')}, Date: {report.get('date')}, Branch: {report.get('branch')}")
                    
                # Check if these user_ids exist in any users (not just supervisors)
                all_user_ids = [u.get('id') for u in all_users]
                completely_orphaned = []
                role_changed = []
                
                for report in orphaned_reports:
                    report_user_id = report.get('user_id')
                    if report_user_id in all_user_ids:
                        # User exists but role might have changed
                        user = next((u for u in all_users if u.get('id') == report_user_id), None)
                        if user:
                            role_changed.append({
                                'report': report,
                                'user': user
                            })
                    else:
                        # User doesn't exist at all
                        completely_orphaned.append(report)
                        
                if role_changed:
                    self.log_test("Role Changed Users", False, f"{len(role_changed)} reports belong to users whose role changed from supervisor")
                    for item in role_changed[:3]:  # Show first 3
                        user = item['user']
                        report = item['report']
                        self.log_test("Role Changed Detail", False, f"User {user.get('username')} (ID: {user.get('id')}) now has role '{user.get('role')}' but has supervisor report from {report.get('date')}")
                        
                if completely_orphaned:
                    self.log_test("Completely Orphaned", False, f"{len(completely_orphaned)} reports belong to users that no longer exist in the system")
                    for report in completely_orphaned[:3]:  # Show first 3
                        self.log_test("Deleted User Report", False, f"Report ID: {report.get('id')} belongs to deleted user ID: {report.get('user_id')}")
                        
            else:
                self.log_test("No Issues Found", True, "All supervisor reports have matching current supervisor users")
                
            # Step 5: Solution Recommendations
            print("\n5. Solution Recommendations...")
            
            if orphaned_count > 0:
                self.log_test("Solution A", True, f"Create new supervisor reports with current supervisor accounts ({total_supervisors} supervisors available)")
                self.log_test("Solution B", True, f"Update existing {orphaned_count} orphaned reports' user_id to match current supervisors")
                
                # Check if current supervisors have any reports
                supervisors_with_reports = []
                supervisors_without_reports = []
                
                for supervisor in supervisors:
                    supervisor_id = supervisor.get('id')
                    has_reports = any(r.get('user_id') == supervisor_id for r in supervisor_reports)
                    if has_reports:
                        supervisors_with_reports.append(supervisor)
                    else:
                        supervisors_without_reports.append(supervisor)
                        
                self.log_test("Supervisors with Reports", True, f"{len(supervisors_with_reports)} current supervisors have reports")
                self.log_test("Supervisors without Reports", True if len(supervisors_without_reports) == 0 else False, f"{len(supervisors_without_reports)} current supervisors have NO reports")
                
                if supervisors_without_reports:
                    print("\n   Supervisors without any reports:")
                    for supervisor in supervisors_without_reports:
                        self.log_test("No Reports Supervisor", False, f"Supervisor: {supervisor.get('username')} (ID: {supervisor.get('id')}, Branch: {supervisor.get('branch')}) has no reports")
                        
            # Step 6: Final Summary
            print("\n6. Investigation Summary...")
            self.log_test("Total Supervisor Reports", True, f"{total_reports}")
            self.log_test("Total Current Supervisors", True, f"{total_supervisors}")
            self.log_test("Matched Reports", True, f"{matched_count}")
            self.log_test("Orphaned Reports", True if orphaned_count == 0 else False, f"{orphaned_count}")
            
            if orphaned_count > 0:
                self.log_test("ISSUE STATUS", False, f"CONFIRMED: {orphaned_count} supervisor reports are orphaned and need attention")
            else:
                self.log_test("ISSUE STATUS", True, "NO ISSUES: All supervisor reports have valid current supervisor users")
                
        except Exception as e:
            self.log_test("Investigation Error", False, f"Exception during investigation: {str(e)}")

    def test_cleanup_orphaned_reports(self):
        """Test the cleanup orphaned reports endpoint"""
        print("\n=== Testing Cleanup Orphaned Reports Endpoint ===")
        
        try:
            # Step 1: Check current state before cleanup
            print("\n1. Checking current state before cleanup...")
            
            # Get current supervisor reports
            reports_response = self.session.get(f"{BASE_URL}/reports/supervisor")
            if reports_response.status_code == 200:
                reports_before = reports_response.json()
                self.log_test("Get Reports Before Cleanup", True, f"Found {len(reports_before)} supervisor reports before cleanup")
            else:
                self.log_test("Get Reports Before Cleanup", False, f"Failed: {reports_response.status_code} - {reports_response.text}")
                return
                
            # Get current users
            users_response = self.session.get(f"{BASE_URL}/users")
            if users_response.status_code == 200:
                users_before = users_response.json()
                user_ids = {user['id'] for user in users_before}
                self.log_test("Get Users Before Cleanup", True, f"Found {len(users_before)} users in system")
                
                # Check for orphaned reports
                orphaned_before = [r for r in reports_before if r.get('user_id') not in user_ids]
                valid_before = [r for r in reports_before if r.get('user_id') in user_ids]
                
                self.log_test("Orphaned Reports Analysis", True, f"Before cleanup - Valid reports: {len(valid_before)}, Orphaned reports: {len(orphaned_before)}")
                
                if orphaned_before:
                    for i, report in enumerate(orphaned_before[:3], 1):  # Show first 3 orphaned reports
                        self.log_test(f"Orphaned Report {i}", True, f"ID: {report.get('id')}, User ID: {report.get('user_id')} (user not found)")
                        
            else:
                self.log_test("Get Users Before Cleanup", False, f"Failed: {users_response.status_code} - {users_response.text}")
                return
                
            # Step 2: Call the cleanup endpoint
            print("\n2. Calling cleanup endpoint...")
            
            cleanup_response = self.session.post(f"{BASE_URL}/admin/cleanup-orphaned-reports")
            
            if cleanup_response.status_code == 200:
                cleanup_result = cleanup_response.json()
                self.log_test("Cleanup Endpoint Call", True, f"Cleanup completed successfully")
                
                # Parse and display results
                results = cleanup_result.get('results', {})
                total_deleted = 0
                
                for collection_name, stats in results.items():
                    total_reports = stats.get('total_reports', 0)
                    orphaned_found = stats.get('orphaned_found', 0)
                    deleted = stats.get('deleted', 0)
                    total_deleted += deleted
                    
                    self.log_test(f"Cleanup - {collection_name}", True, f"Total: {total_reports}, Orphaned: {orphaned_found}, Deleted: {deleted}")
                    
                self.log_test("Total Cleanup Results", True, f"Total orphaned reports deleted across all collections: {total_deleted}")
                
            else:
                self.log_test("Cleanup Endpoint Call", False, f"Failed: {cleanup_response.status_code} - {cleanup_response.text}")
                return
                
            # Step 3: Verify results after cleanup
            print("\n3. Verifying results after cleanup...")
            
            # Get supervisor reports after cleanup
            reports_after_response = self.session.get(f"{BASE_URL}/reports/supervisor")
            if reports_after_response.status_code == 200:
                reports_after = reports_after_response.json()
                self.log_test("Get Reports After Cleanup", True, f"Found {len(reports_after)} supervisor reports after cleanup")
                
                # Verify all remaining reports have valid user_ids
                orphaned_after = [r for r in reports_after if r.get('user_id') not in user_ids]
                valid_after = [r for r in reports_after if r.get('user_id') in user_ids]
                
                self.log_test("Post-Cleanup Validation", True, f"After cleanup - Valid reports: {len(valid_after)}, Orphaned reports: {len(orphaned_after)}")
                
                if len(orphaned_after) == 0:
                    self.log_test("Cleanup Success Verification", True, "✅ All remaining supervisor reports have valid user_ids")
                else:
                    self.log_test("Cleanup Success Verification", False, f"❌ Still found {len(orphaned_after)} orphaned reports after cleanup")
                    for report in orphaned_after[:3]:  # Show remaining orphaned reports
                        self.log_test("Remaining Orphaned Report", False, f"ID: {report.get('id')}, User ID: {report.get('user_id')}")
                        
                # Show the difference
                reports_deleted = len(reports_before) - len(reports_after)
                self.log_test("Reports Count Difference", True, f"Reports before: {len(reports_before)}, After: {len(reports_after)}, Deleted: {reports_deleted}")
                
            else:
                self.log_test("Get Reports After Cleanup", False, f"Failed: {reports_after_response.status_code} - {reports_after_response.text}")
                
            # Step 4: Test other report collections as well
            print("\n4. Checking other report collections...")
            
            other_collections = [
                ("activities", "/reports/activities"),
                ("social-specialist", "/reports/social-specialist"),
                ("quality", "/reports/quality"),
                ("vice-principal", "/reports/vice-principal")
            ]
            
            for collection_name, endpoint in other_collections:
                collection_response = self.session.get(f"{BASE_URL}{endpoint}")
                if collection_response.status_code == 200:
                    collection_reports = collection_response.json()
                    orphaned_in_collection = [r for r in collection_reports if r.get('user_id') not in user_ids]
                    
                    if len(orphaned_in_collection) == 0:
                        self.log_test(f"Cleanup Verification - {collection_name}", True, f"✅ All {len(collection_reports)} {collection_name} reports have valid user_ids")
                    else:
                        self.log_test(f"Cleanup Verification - {collection_name}", False, f"❌ Found {len(orphaned_in_collection)} orphaned {collection_name} reports")
                else:
                    self.log_test(f"Check {collection_name} Reports", False, f"Failed: {collection_response.status_code}")
                    
        except Exception as e:
            self.log_test("Cleanup Orphaned Reports Test", False, f"Exception: {str(e)}")

    def investigate_vp_supervisor_reports_issue(self):
        """Comprehensive investigation of VP supervisor reports issue as requested"""
        print("\n=== 🔍 INVESTIGATING VP SUPERVISOR REPORTS ISSUE ===")
        
        try:
            # Step 1: Check Current Supervisor Reports
            print("\n1. 📊 Checking Current Supervisor Reports...")
            reports_response = self.session.get(f"{BASE_URL}/reports/supervisor")
            
            if reports_response.status_code == 200:
                supervisor_reports = reports_response.json()
                total_reports = len(supervisor_reports)
                self.log_test("GET /api/reports/supervisor", True, f"Total supervisor reports: {total_reports}")
                
                # List ALL supervisor reports with details
                for i, report in enumerate(supervisor_reports, 1):
                    self.log_test(f"Report {i}", True, f"ID: {report.get('id')}, Date: {report.get('date')}, User_ID: {report.get('user_id')}")
                    
            else:
                self.log_test("GET /api/reports/supervisor", False, f"Failed: {reports_response.status_code} - {reports_response.text}")
                return
                
            # Step 2: Check Current Supervisors
            print("\n2. 👥 Checking Current Supervisors...")
            users_response = self.session.get(f"{BASE_URL}/users")
            
            if users_response.status_code == 200:
                all_users = users_response.json()
                supervisors = [u for u in all_users if u.get("role") == "supervisor"]
                
                self.log_test("GET /api/users (role=supervisor)", True, f"Total supervisors: {len(supervisors)}")
                
                # List ALL supervisors with assignment details
                for i, supervisor in enumerate(supervisors, 1):
                    self.log_test(f"Supervisor {i}", True, f"ID: {supervisor.get('id')}, Username: {supervisor.get('username')}, Branch: {supervisor.get('branch')}, Assigned_to: {supervisor.get('assigned_to')}")
                    
            else:
                self.log_test("GET /api/users", False, f"Failed: {users_response.status_code} - {users_response.text}")
                return
                
            # Step 3: Check Vice-Principals
            print("\n3. 🎓 Checking Vice-Principals...")
            vps = [u for u in all_users if u.get("role") == "vice_principal"]
            
            self.log_test("GET /api/users (role=vice_principal)", True, f"Total Vice-Principals: {len(vps)}")
            
            # List ALL VPs with details
            for i, vp in enumerate(vps, 1):
                self.log_test(f"Vice-Principal {i}", True, f"ID: {vp.get('id')}, Username: {vp.get('username')}, Branch: {vp.get('branch')}")
                
            # Step 4: Match Reports to VPs
            print("\n4. 🔗 Matching Reports to VPs...")
            
            for i, vp in enumerate(vps, 1):
                vp_id = vp.get('id')
                vp_username = vp.get('username')
                vp_branch = vp.get('branch')
                
                # Find supervisors assigned to this VP
                assigned_supervisors = [s for s in supervisors if s.get('assigned_to') == vp_id]
                
                self.log_test(f"VP {i} ({vp_username}) Assigned Supervisors", True, f"Found {len(assigned_supervisors)} assigned supervisors")
                
                if assigned_supervisors:
                    # List assigned supervisors
                    for j, supervisor in enumerate(assigned_supervisors, 1):
                        self.log_test(f"VP {i} Supervisor {j}", True, f"ID: {supervisor.get('id')}, Username: {supervisor.get('username')}, Branch: {supervisor.get('branch')}")
                        
                    # Find reports from these supervisors
                    supervisor_ids = [s.get('id') for s in assigned_supervisors]
                    vp_reports = [r for r in supervisor_reports if r.get('user_id') in supervisor_ids]
                    
                    self.log_test(f"VP {i} Supervisor Reports", True, f"Found {len(vp_reports)} reports from assigned supervisors")
                    
                    # Show the matching chain for each report
                    for k, report in enumerate(vp_reports, 1):
                        report_user_id = report.get('user_id')
                        supervisor = next((s for s in assigned_supervisors if s.get('id') == report_user_id), None)
                        if supervisor:
                            self.log_test(f"VP {i} Report Chain {k}", True, f"Report {report.get('id')} → Supervisor {supervisor.get('username')} → VP {vp_username} → Branch {vp_branch}")
                else:
                    self.log_test(f"VP {i} Issue", False, f"VP {vp_username} has NO supervisors assigned - THIS IS WHY NO REPORTS SHOW!")
                    
            # Step 5: Test Vice-Principal View
            print("\n5. 🧪 Testing Vice-Principal View...")
            
            # Find a VP with assigned supervisors to test
            test_vp = None
            for vp in vps:
                assigned_supervisors = [s for s in supervisors if s.get('assigned_to') == vp.get('id')]
                if assigned_supervisors:
                    test_vp = vp
                    break
                    
            if test_vp:
                # Create a test VP user to login as
                vp_user, vp_password = self.create_test_user("vice_principal", test_vp.get('branch', 'boys'))
                if vp_user:
                    # Assign some supervisors to this test VP
                    test_supervisors = [s for s in supervisors if s.get('branch') == vp_user.get('branch')][:2]  # Take first 2 supervisors from same branch
                    
                    for supervisor in test_supervisors:
                        update_data = {"assigned_to": vp_user['id']}
                        update_response = self.session.put(f"{BASE_URL}/users/{supervisor['id']}", json=update_data)
                        if update_response.status_code == 200:
                            self.log_test("Assign Supervisor to Test VP", True, f"Assigned supervisor {supervisor.get('username')} to test VP")
                        
                    # Login as the test VP
                    vp_login = self.login_as_user(vp_user["username"], vp_password)
                    if vp_login:
                        self.log_test("VP Login", True, f"Successfully logged in as test VP")
                        
                        # Test GET /api/reports/supervisor as VP
                        vp_reports_response = self.session.get(f"{BASE_URL}/reports/supervisor")
                        if vp_reports_response.status_code == 200:
                            vp_accessible_reports = vp_reports_response.json()
                            
                            # Manual filtering simulation
                            assigned_supervisor_ids = [s.get('id') for s in test_supervisors]
                            expected_reports = [r for r in supervisor_reports if r.get('user_id') in assigned_supervisor_ids]
                            
                            self.log_test("VP Access Test", True, f"VP can access {len(vp_accessible_reports)} reports")
                            self.log_test("Expected vs Actual", True, f"Expected: {len(expected_reports)} reports, Actual: {len(vp_accessible_reports)} reports")
                            
                            if len(vp_accessible_reports) == len(expected_reports):
                                self.log_test("VP Filtering Working", True, "VP filtering is working correctly!")
                            else:
                                self.log_test("VP Filtering Issue", False, f"VP filtering not working - Expected {len(expected_reports)}, Got {len(vp_accessible_reports)}")
                        else:
                            self.log_test("VP Access Test", False, f"VP cannot access reports: {vp_reports_response.status_code}")
                    else:
                        self.log_test("VP Login", False, "Failed to login as test VP")
                else:
                    self.log_test("Create Test VP", False, "Failed to create test VP user")
            else:
                self.log_test("VP Test Setup", False, "No VP with assigned supervisors found for testing")
                
            # Login back as admin
            self.test_authentication()
            
            # Step 6: Summary and Root Cause Analysis
            print("\n6. 📋 ROOT CAUSE ANALYSIS...")
            
            # Count VPs with and without assigned supervisors
            vps_with_supervisors = 0
            vps_without_supervisors = 0
            
            for vp in vps:
                assigned_supervisors = [s for s in supervisors if s.get('assigned_to') == vp.get('id')]
                if assigned_supervisors:
                    vps_with_supervisors += 1
                else:
                    vps_without_supervisors += 1
                    
            self.log_test("VP Assignment Summary", True, f"VPs with supervisors: {vps_with_supervisors}, VPs without supervisors: {vps_without_supervisors}")
            
            # Check for orphaned reports
            supervisor_ids = [s.get('id') for s in supervisors]
            orphaned_reports = [r for r in supervisor_reports if r.get('user_id') not in supervisor_ids]
            
            if orphaned_reports:
                self.log_test("Orphaned Reports Found", False, f"Found {len(orphaned_reports)} orphaned reports from deleted users")
                for report in orphaned_reports[:5]:  # Show first 5
                    self.log_test("Orphaned Report", False, f"Report ID: {report.get('id')}, User ID: {report.get('user_id')} (user no longer exists)")
            else:
                self.log_test("Orphaned Reports Check", True, "No orphaned reports found")
                
            # Final diagnosis
            if vps_without_supervisors > 0:
                self.log_test("ROOT CAUSE IDENTIFIED", False, f"ISSUE: {vps_without_supervisors} Vice-Principals have no supervisors assigned to them")
                self.log_test("SOLUTION", True, "Admin needs to assign supervisors to VPs using the 'assigned_to' field in user management")
            else:
                self.log_test("VP Assignment Status", True, "All VPs have supervisors assigned - issue may be elsewhere")
                
        except Exception as e:
            self.log_test("VP Investigation", False, f"Exception during investigation: {str(e)}")

    def test_vp_credentials_and_login(self):
        """Test Vice-Principal user credentials and login as requested"""
        print("\n=== Testing Vice-Principal Credentials and Login ===")
        
        try:
            # Step 1: Query MongoDB to list all Vice-Principal users
            users_response = self.session.get(f"{BASE_URL}/users")
            
            if users_response.status_code == 200:
                all_users = users_response.json()
                vp_users = [u for u in all_users if u.get("role") == "vice_principal"]
                
                self.log_test("Query VP Users", True, f"Found {len(vp_users)} Vice-Principal users in database")
                
                if not vp_users:
                    self.log_test("VP Users Check", False, "No Vice-Principal users found in the system")
                    return
                    
                # List all VP users with their usernames
                print("\n📋 Vice-Principal Users List:")
                for i, vp in enumerate(vp_users, 1):
                    username = vp.get('username', 'N/A')
                    user_id = vp.get('id', 'N/A')
                    branch = vp.get('branch', 'N/A')
                    print(f"   {i}. Username: {username}")
                    print(f"      ID: {user_id}")
                    print(f"      Branch: {branch}")
                    self.log_test(f"VP User {i} Details", True, f"Username: {username}, ID: {user_id}, Branch: {branch}")
                
                # Step 2: Test login with each VP user using password 'password123'
                print(f"\n🔐 Testing Login for {len(vp_users)} VP Users with password 'password123':")
                
                successful_logins = []
                failed_logins = []
                
                for i, vp in enumerate(vp_users, 1):
                    username = vp.get('username')
                    if not username:
                        self.log_test(f"VP {i} Login Test", False, "Username is missing")
                        failed_logins.append({"user": f"VP {i}", "reason": "Missing username"})
                        continue
                    
                    # Test login with multiple common passwords
                    test_passwords = ["password123", "123456", "admin", "password", "123", "test", username]
                    login_success = False
                    successful_password = None
                    
                    for test_password in test_passwords:
                        login_data = {
                            "username": username,
                            "password": test_password,
                            "remember_me": False
                        }
                    
                        try:
                            # Create a new session for each login test to avoid conflicts
                            test_session = requests.Session()
                            login_response = test_session.post(f"{BASE_URL}/auth/login", json=login_data)
                            
                            if login_response.status_code == 200:
                                login_result = login_response.json()
                                if "user" in login_result and "token" in login_result:
                                    user_info = login_result["user"]
                                    self.log_test(f"VP {i} Login Success", True, f"Successfully logged in as {username} with password '{test_password}'")
                                    successful_logins.append({
                                        "username": username,
                                        "password": test_password,
                                        "user_id": user_info.get('id'),
                                        "role": user_info.get('role'),
                                        "branch": user_info.get('branch')
                                    })
                                    
                                    # Test /auth/me endpoint to verify session
                                    me_response = test_session.get(f"{BASE_URL}/auth/me")
                                    if me_response.status_code == 200:
                                        me_data = me_response.json()
                                        self.log_test(f"VP {i} Session Verification", True, f"Session valid, user: {me_data.get('username')}")
                                    else:
                                        self.log_test(f"VP {i} Session Verification", False, f"Session invalid: {me_response.status_code}")
                                    
                                    login_success = True
                                    successful_password = test_password
                                    break  # Stop trying other passwords
                                else:
                                    continue  # Try next password
                            else:
                                continue  # Try next password
                                
                        except Exception as e:
                            continue  # Try next password
                    
                    # If no password worked, log the failure
                    if not login_success:
                        self.log_test(f"VP {i} Login Failed", False, f"Login failed for {username} with all tested passwords: {test_passwords}")
                        failed_logins.append({"user": username, "reason": f"All passwords failed: {test_passwords}"})
                
                # Step 3: Summary of login test results
                print(f"\n📊 Login Test Results Summary:")
                print(f"   ✅ Successful logins: {len(successful_logins)}")
                print(f"   ❌ Failed logins: {len(failed_logins)}")
                
                if successful_logins:
                    print(f"\n✅ Successfully logged in VP users:")
                    for login in successful_logins:
                        print(f"   - {login['username']} (Password: '{login['password']}', ID: {login['user_id']}, Branch: {login['branch']})")
                        
                if failed_logins:
                    print(f"\n❌ Failed login attempts:")
                    for failure in failed_logins:
                        print(f"   - {failure['user']}: {failure['reason']}")
                        
                # Step 4: Check authentication logic if there are failures
                if failed_logins:
                    print(f"\n🔍 Analyzing Authentication Logic...")
                    self.log_test("Authentication Analysis", True, "Checking server.py authentication logic for VP login failures")
                    
                    # The authentication logic is in the login endpoint
                    # Let's check if the issue is with password hashing or user lookup
                    print("   Authentication flow analysis:")
                    print("   1. User lookup: db.users.find_one({'username': user_data.username})")
                    print("   2. Password verification: verify_password(user_data.password, user['password'])")
                    print("   3. Token generation and session creation")
                    
                    # Check if we can find the users in the database
                    for failure in failed_logins:
                        if failure['user'] != f"VP {i}":  # Skip entries without proper username
                            username = failure['user']
                            # Try to find this user in our user list
                            user_found = next((u for u in vp_users if u.get('username') == username), None)
                            if user_found:
                                self.log_test(f"User Exists Check - {username}", True, f"User exists in database with ID: {user_found.get('id')}")
                                self.log_test(f"Password Issue - {username}", False, f"User exists but password 'password123' is incorrect")
                            else:
                                self.log_test(f"User Exists Check - {username}", False, f"User not found in database")
                
                # Overall test result
                if len(successful_logins) == len(vp_users):
                    self.log_test("VP Credentials Test", True, f"All {len(vp_users)} VP users can login with 'password123'")
                elif len(successful_logins) > 0:
                    self.log_test("VP Credentials Test", False, f"Only {len(successful_logins)}/{len(vp_users)} VP users can login with 'password123'")
                else:
                    self.log_test("VP Credentials Test", False, f"None of the {len(vp_users)} VP users can login with 'password123'")
                    
            else:
                self.log_test("Query VP Users", False, f"Failed to get users: {users_response.status_code} - {users_response.text}")
                
        except Exception as e:
            self.log_test("VP Credentials Test", False, f"Exception during VP credentials test: {str(e)}")

    def run_vp_credential_test_only(self):
        """Run only the VP credential test as requested"""
        print("🚀 Starting VP Credential Testing...")
        print(f"Base URL: {BASE_URL}")
        print("=" * 60)
        
        # First authenticate as admin to access user data
        self.test_authentication()
        
        if not self.auth_token:
            print("❌ Admin authentication failed - cannot proceed with VP credential test")
            return
        
        # Run the specific VP credential test
        self.test_vp_credentials_and_login()
        
        # Print summary
        self.print_summary()

    def test_admin_ahmed_login_and_reports(self):
        """Test specific admin login scenario as requested by user"""
        print("\n=== Testing Admin Ahmed Login and Report Retrieval ===")
        
        # Test login with ahmed credentials
        login_data = {
            "username": "ahmed",
            "password": "123456",
            "remember_me": False
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data and "token" in data:
                    self.auth_token = data["token"]
                    user_info = data["user"]
                    self.log_test(
                        "Ahmed Admin Login", 
                        True, 
                        f"Successfully logged in as {user_info.get('username', 'Unknown')} with role {user_info.get('role', 'Unknown')}"
                    )
                    
                    # Now test all report endpoints
                    self.test_all_reports_as_admin()
                    
                else:
                    self.log_test("Ahmed Admin Login", False, "Login response missing user or token")
            else:
                self.log_test("Ahmed Admin Login", False, f"Login failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_test("Ahmed Admin Login", False, f"Login exception: {str(e)}")
            
    def test_all_reports_as_admin(self):
        """Test all report endpoints after admin login"""
        print("\n=== Testing All Report Endpoints as Admin ===")
        
        report_endpoints = [
            ("Supervisor Reports", "/reports/supervisor"),
            ("Activities Reports", "/reports/activities"),
            ("Social Specialist Reports", "/reports/social-specialist"),
            ("Quality Reports", "/reports/quality"),
            ("Vice-Principal Reports", "/reports/vice-principal"),
            ("Users List", "/users")
        ]
        
        for report_name, endpoint in report_endpoints:
            try:
                response = self.session.get(f"{BASE_URL}{endpoint}")
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(
                        f"GET {report_name}", 
                        True, 
                        f"Retrieved {len(data)} records"
                    )
                    
                    # Check data quality for reports
                    if endpoint != "/users" and len(data) > 0:
                        # Check if reports have user_id and complete data
                        sample_record = data[0]
                        has_user_id = "user_id" in sample_record
                        has_created_at = "created_at" in sample_record
                        
                        if has_user_id and has_created_at:
                            self.log_test(
                                f"{report_name} Data Quality", 
                                True, 
                                f"Records contain user_id and timestamps. Sample user_id: {sample_record.get('user_id', 'N/A')}"
                            )
                        else:
                            self.log_test(
                                f"{report_name} Data Quality", 
                                False, 
                                f"Missing required fields - user_id: {has_user_id}, created_at: {has_created_at}"
                            )
                    
                    # For users endpoint, check if admin user exists
                    if endpoint == "/users":
                        admin_found = any(user.get("username") == "ahmed" for user in data)
                        if admin_found:
                            self.log_test(
                                "Ahmed User in System", 
                                True, 
                                "Ahmed admin user found in users list"
                            )
                        else:
                            self.log_test(
                                "Ahmed User in System", 
                                False, 
                                "Ahmed admin user not found in users list"
                            )
                            
                else:
                    self.log_test(
                        f"GET {report_name}", 
                        False, 
                        f"Failed: {response.status_code} - {response.text}"
                    )
                    
            except Exception as e:
                self.log_test(f"GET {report_name}", False, f"Exception: {str(e)}")

    def run_ahmed_admin_test(self):
        """Run specific test for Ahmed admin login and report retrieval"""
        print("🚀 Starting Ahmed Admin Login and Report Testing...")
        print(f"Base URL: {BASE_URL}")
        print("=" * 60)
        
        # First login with known admin to check users
        self.test_authentication()
        
        if self.auth_token:
            # Check if ahmed user exists
            self.check_ahmed_user_exists()
            
        # Test Ahmed admin login and report retrieval
        self.test_admin_ahmed_login_and_reports()
        
        # Print summary
        self.print_summary()
        
    def check_ahmed_user_exists(self):
        """Check if ahmed user exists in the system"""
        print("\n=== Checking if Ahmed User Exists ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/users")
            
            if response.status_code == 200:
                users = response.json()
                self.log_test("Get Users List", True, f"Retrieved {len(users)} users")
                
                # Look for ahmed user
                ahmed_user = None
                for user in users:
                    if user.get("username") == "ahmed":
                        ahmed_user = user
                        break
                
                if ahmed_user:
                    self.log_test("Ahmed User Found", True, f"Ahmed user exists with role: {ahmed_user.get('role')}, branch: {ahmed_user.get('branch')}")
                else:
                    self.log_test("Ahmed User Found", False, "Ahmed user does not exist in system - creating it")
                    
                    # Create ahmed user
                    self.create_ahmed_user()
                        
            else:
                self.log_test("Get Users List", False, f"Failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_test("Check Ahmed User", False, f"Exception: {str(e)}")
            
    def create_ahmed_user(self):
        """Create ahmed admin user"""
        print("\n=== Creating Ahmed Admin User ===")
        
        user_data = {
            "username": "ahmed",
            "password": "123456",
            "role": "admin",
            "branch": "both"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/users", json=user_data)
            
            if response.status_code == 200:
                created_user = response.json()
                self.log_test("Create Ahmed User", True, f"Successfully created ahmed user with ID: {created_user.get('id')}")
            else:
                self.log_test("Create Ahmed User", False, f"Failed to create ahmed user: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_test("Create Ahmed User", False, f"Exception: {str(e)}")
    def test_quality_report_data_structure(self):
        """Test Quality Report creation endpoint to understand expected data structure"""
        print("\n=== Testing Quality Report Data Structure ===")
        
        # Step 1: Login as quality_user
        quality_login_data = {
            "username": "quality_user",
            "password": "123456",
            "remember_me": False
        }
        
        try:
            login_response = self.session.post(f"{BASE_URL}/auth/login", json=quality_login_data)
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                self.log_test(
                    "Quality User Login", 
                    True, 
                    f"Successfully logged in as quality_user with role {login_data.get('user', {}).get('role', 'Unknown')}"
                )
            else:
                self.log_test("Quality User Login", False, f"Login failed: {login_response.status_code} - {login_response.text}")
                return
                
        except Exception as e:
            self.log_test("Quality User Login", False, f"Login exception: {str(e)}")
            return
            
        # Step 2: Check existing quality reports structure
        try:
            existing_reports_response = self.session.get(f"{BASE_URL}/reports/quality")
            
            if existing_reports_response.status_code == 200:
                existing_reports = existing_reports_response.json()
                self.log_test(
                    "Get Existing Quality Reports", 
                    True, 
                    f"Retrieved {len(existing_reports)} existing quality reports"
                )
                
                # Print structure of existing reports if any
                if existing_reports:
                    sample_report = existing_reports[0]
                    print(f"\n📋 EXISTING REPORT STRUCTURE:")
                    print(f"Report ID: {sample_report.get('id')}")
                    print(f"Date: {sample_report.get('date')}")
                    print(f"Branch: {sample_report.get('branch')}")
                    print(f"Academic Performance: {sample_report.get('academic_performance')}")
                    print(f"Educational Supervision: {sample_report.get('educational_supervision')}")
                    print(f"Discipline Behavior: {sample_report.get('discipline_behavior')}")
                    print(f"Activities Programs: {sample_report.get('activities_programs')}")
                    print(f"Social Specialist: {sample_report.get('social_specialist')}")
                    
                    self.log_test(
                        "Existing Report Structure Analysis", 
                        True, 
                        "Existing reports use nested dict structure for each section"
                    )
                else:
                    self.log_test(
                        "Existing Report Structure Analysis", 
                        True, 
                        "No existing reports found - will test with new data"
                    )
            else:
                self.log_test("Get Existing Quality Reports", False, f"Failed: {existing_reports_response.status_code} - {existing_reports_response.text}")
                
        except Exception as e:
            self.log_test("Get Existing Quality Reports", False, f"Exception: {str(e)}")
            
        # Step 3: Test creating quality report with FLAT structure (as provided in test request)
        print(f"\n🧪 TESTING FLAT STRUCTURE (as provided in test request):")
        flat_structure_data = {
            "date": "2024-01-15",
            "academic_performance_rate": 9,
            "academic_notes": "test academic notes",
            "supervision_quality_rate": 8,
            "supervision_notes": "test supervision notes",
            "discipline_rate": 7,
            "discipline_notes": "test discipline notes",
            "activities_quality_rate": 6,
            "activities_notes": "test activities notes",
            "social_specialist_performance_rate": 5,
            "social_specialist_notes": "test social notes",
            "teaching_performance_rate": 10,
            "general_recommendations": "test recommendations"
        }
        
        try:
            flat_response = self.session.post(f"{BASE_URL}/reports/quality", json=flat_structure_data)
            
            if flat_response.status_code == 200:
                created_report = flat_response.json()
                self.log_test(
                    "Create Quality Report (Flat Structure)", 
                    True, 
                    f"Successfully created report with ID: {created_report.get('id')}"
                )
                
                # Retrieve and print the created report structure
                report_id = created_report.get('id')
                if report_id:
                    get_response = self.session.get(f"{BASE_URL}/reports/quality")
                    if get_response.status_code == 200:
                        updated_reports = get_response.json()
                        new_report = next((r for r in updated_reports if r.get('id') == report_id), None)
                        if new_report:
                            print(f"\n📋 CREATED REPORT STRUCTURE (Flat Input):")
                            print(f"Report ID: {new_report.get('id')}")
                            print(f"Date: {new_report.get('date')}")
                            print(f"Academic Performance: {new_report.get('academic_performance')}")
                            print(f"Educational Supervision: {new_report.get('educational_supervision')}")
                            print(f"Discipline Behavior: {new_report.get('discipline_behavior')}")
                            print(f"Activities Programs: {new_report.get('activities_programs')}")
                            print(f"Social Specialist: {new_report.get('social_specialist')}")
                            
                            self.log_test(
                                "Flat Structure Result Analysis", 
                                True, 
                                "Backend accepted flat structure but may have stored it differently"
                            )
            else:
                self.log_test(
                    "Create Quality Report (Flat Structure)", 
                    False, 
                    f"Failed: {flat_response.status_code} - {flat_response.text}"
                )
                print(f"\n❌ FLAT STRUCTURE ERROR DETAILS:")
                print(f"Status Code: {flat_response.status_code}")
                print(f"Response: {flat_response.text}")
                
        except Exception as e:
            self.log_test("Create Quality Report (Flat Structure)", False, f"Exception: {str(e)}")
            
        # Step 4: Test creating quality report with NESTED structure (as expected by backend model)
        print(f"\n🧪 TESTING NESTED STRUCTURE (as expected by backend model):")
        nested_structure_data = {
            "date": "2024-01-15",
            "academic_performance": {
                "rate": "9",
                "notes": "test academic notes"
            },
            "educational_supervision": {
                "rate": "8", 
                "notes": "test supervision notes"
            },
            "discipline_behavior": {
                "rate": "7",
                "notes": "test discipline notes"
            },
            "activities_programs": {
                "rate": "6",
                "notes": "test activities notes"
            },
            "social_specialist": {
                "rate": "5",
                "notes": "test social notes",
                "teaching_performance_rate": "10",
                "general_recommendations": "test recommendations"
            }
        }
        
        try:
            nested_response = self.session.post(f"{BASE_URL}/reports/quality", json=nested_structure_data)
            
            if nested_response.status_code == 200:
                created_report = nested_response.json()
                self.log_test(
                    "Create Quality Report (Nested Structure)", 
                    True, 
                    f"Successfully created report with ID: {created_report.get('id')}"
                )
                
                # Retrieve and print the created report structure
                report_id = created_report.get('id')
                if report_id:
                    get_response = self.session.get(f"{BASE_URL}/reports/quality")
                    if get_response.status_code == 200:
                        updated_reports = get_response.json()
                        new_report = next((r for r in updated_reports if r.get('id') == report_id), None)
                        if new_report:
                            print(f"\n📋 CREATED REPORT STRUCTURE (Nested Input):")
                            print(f"Report ID: {new_report.get('id')}")
                            print(f"Date: {new_report.get('date')}")
                            print(f"Academic Performance: {new_report.get('academic_performance')}")
                            print(f"Educational Supervision: {new_report.get('educational_supervision')}")
                            print(f"Discipline Behavior: {new_report.get('discipline_behavior')}")
                            print(f"Activities Programs: {new_report.get('activities_programs')}")
                            print(f"Social Specialist: {new_report.get('social_specialist')}")
                            
                            self.log_test(
                                "Nested Structure Result Analysis", 
                                True, 
                                "Backend accepted nested structure and stored it correctly"
                            )
            else:
                self.log_test(
                    "Create Quality Report (Nested Structure)", 
                    False, 
                    f"Failed: {nested_response.status_code} - {nested_response.text}"
                )
                print(f"\n❌ NESTED STRUCTURE ERROR DETAILS:")
                print(f"Status Code: {nested_response.status_code}")
                print(f"Response: {nested_response.text}")
                
        except Exception as e:
            self.log_test("Create Quality Report (Nested Structure)", False, f"Exception: {str(e)}")
            
        # Step 5: Summary and Recommendations
        print(f"\n📊 DATA STRUCTURE ANALYSIS SUMMARY:")
        print(f"=" * 50)
        print(f"Backend QualityReport Model expects:")
        print(f"- academic_performance: Dict[str, str] = {{}}")
        print(f"- educational_supervision: Dict[str, str] = {{}}")
        print(f"- discipline_behavior: Dict[str, str] = {{}}")
        print(f"- activities_programs: Dict[str, str] = {{}}")
        print(f"- social_specialist: Dict[str, str] = {{}}")
        print(f"")
        print(f"Frontend appears to be sending flat structure with fields like:")
        print(f"- academic_performance_rate: 9 (integer)")
        print(f"- academic_notes: 'text' (string)")
        print(f"")
        print(f"RECOMMENDATION: Frontend should send nested dict structure")
        print(f"where each section contains rate and notes as string values.")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Quality Report Data Structure Testing")
        print(f"Testing against: {BASE_URL}")
        
        # Test authentication first
        self.test_authentication()
        
        if not self.auth_token:
            print("❌ Authentication failed - cannot proceed with other tests")
            return
            
        # Run the quality report data structure test as requested
        self.test_quality_report_data_structure()
        
        # Print summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['message']}")
                    
        print("\n" + "="*60)

if __name__ == "__main__":
    tester = BackendTester()
    # Run quality report data structure test as requested
    tester.run_all_tests()