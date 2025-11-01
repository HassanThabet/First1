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
BASE_URL = "https://fajr-school-manager.preview.emergentagent.com/api"
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
        
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for School Management System")
        print(f"Testing against: {BASE_URL}")
        
        # Test authentication first
        self.test_authentication()
        
        if not self.auth_token:
            print("❌ Authentication failed - cannot proceed with other tests")
            return
            
        # Test all endpoints
        self.test_teachers_endpoint()
        self.test_activities_reports()
        self.test_social_specialist_reports()
        self.test_quality_reports()
        
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
    tester.run_all_tests()