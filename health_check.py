#!/usr/bin/env python3
"""
Backend Health Check for School Management System
Comprehensive testing of all critical endpoints for deployment readiness
"""

import requests
import json
import time
from datetime import datetime, timezone

# Configuration
BASE_URL = "https://edu-supervision.preview.emergentagent.com/api"
ADMIN_USERNAME = "مدارس الفجر الجديد الأهلية"
ADMIN_PASSWORD = "2002002Hh"

class HealthChecker:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, message="", response_time=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        time_info = f" ({response_time:.2f}s)" if response_time else ""
        slow_warning = " ⚠️ SLOW" if response_time and response_time > 1.0 else ""
        print(f"{status} {test_name}: {message}{time_info}{slow_warning}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_time": response_time
        })
        
    def test_authentication(self):
        """Test authentication with admin credentials"""
        print("\n=== 🔐 Testing Authentication & User Management ===")
        
        login_data = {
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD,
            "remember_me": False
        }
        
        try:
            start_time = time.time()
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data and "token" in data:
                    self.auth_token = data["token"]
                    user_info = data["user"]
                    self.log_test(
                        "POST /api/auth/login", 
                        True, 
                        f"Admin login successful - Role: {user_info.get('role', 'Unknown')}",
                        response_time
                    )
                    
                    # Test /auth/me endpoint
                    start_time = time.time()
                    me_response = self.session.get(f"{BASE_URL}/auth/me")
                    me_response_time = time.time() - start_time
                    
                    if me_response.status_code == 200:
                        me_data = me_response.json()
                        self.log_test(
                            "GET /api/auth/me", 
                            True, 
                            f"User info retrieved: {me_data.get('username', 'Unknown')}",
                            me_response_time
                        )
                    else:
                        self.log_test(
                            "GET /api/auth/me", 
                            False, 
                            f"Failed: {me_response.status_code}",
                            me_response_time
                        )
                else:
                    self.log_test("POST /api/auth/login", False, "Response missing user or token", response_time)
            else:
                self.log_test("POST /api/auth/login", False, f"Status: {response.status_code}", response_time)
                
        except Exception as e:
            self.log_test("POST /api/auth/login", False, f"Exception: {str(e)}")
            
    def test_users_endpoint(self):
        """Test users management endpoint"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/users")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                users = response.json()
                self.log_test(
                    "GET /api/users", 
                    True, 
                    f"Retrieved {len(users)} users",
                    response_time
                )
            else:
                self.log_test("GET /api/users", False, f"Status: {response.status_code}", response_time)
                
        except Exception as e:
            self.log_test("GET /api/users", False, f"Exception: {str(e)}")
            
    def test_teachers_endpoint(self):
        """Test teachers endpoint"""
        print("\n=== 👨‍🏫 Testing Teachers & Subjects ===")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/teachers")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                teachers = response.json()
                self.log_test(
                    "GET /api/teachers", 
                    True, 
                    f"Retrieved {len(teachers)} teachers",
                    response_time
                )
            else:
                self.log_test("GET /api/teachers", False, f"Status: {response.status_code}", response_time)
                
        except Exception as e:
            self.log_test("GET /api/teachers", False, f"Exception: {str(e)}")
    
    def test_subjects_endpoint(self):
        """Test subjects endpoint"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/subjects")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                subjects = response.json()
                self.log_test(
                    "GET /api/subjects", 
                    True, 
                    f"Retrieved {len(subjects)} subjects",
                    response_time
                )
            else:
                self.log_test("GET /api/subjects", False, f"Status: {response.status_code}", response_time)
                
        except Exception as e:
            self.log_test("GET /api/subjects", False, f"Exception: {str(e)}")
    
    def test_report_endpoints(self):
        """Test all report endpoints"""
        print("\n=== 📊 Testing Reports Endpoints ===")
        
        report_endpoints = [
            ("GET /api/reports/activities", "/reports/activities"),
            ("GET /api/reports/supervisor", "/reports/supervisor"),
            ("GET /api/reports/educational-supervision", "/reports/educational-supervision"),
            ("GET /api/reports/quality", "/reports/quality"),
            ("GET /api/reports/director", "/reports/director"),
            ("GET /api/reports/vice-principal", "/reports/vice-principal"),
            ("GET /api/reports/social-specialist", "/reports/social-specialist")
        ]
        
        for test_name, endpoint in report_endpoints:
            try:
                start_time = time.time()
                response = self.session.get(f"{BASE_URL}{endpoint}")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    reports = response.json()
                    self.log_test(
                        test_name, 
                        True, 
                        f"Retrieved {len(reports)} reports",
                        response_time
                    )
                elif response.status_code == 401:
                    self.log_test(test_name, False, "401 Unauthorized", response_time)
                elif response.status_code == 403:
                    self.log_test(test_name, False, "403 Forbidden", response_time)
                elif response.status_code == 500:
                    self.log_test(test_name, False, "500 Internal Server Error", response_time)
                else:
                    self.log_test(test_name, False, f"Status: {response.status_code}", response_time)
                    
            except Exception as e:
                self.log_test(test_name, False, f"Exception: {str(e)}")
    
    def test_database_connectivity(self):
        """Test database connectivity"""
        print("\n=== 🗄️ Testing Database Connectivity ===")
        
        try:
            # Test database by checking if we can retrieve users
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/users")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                users = response.json()
                # Check if admin user exists
                admin_exists = any(user.get("username") == ADMIN_USERNAME for user in users)
                
                self.log_test(
                    "MongoDB Connection", 
                    True, 
                    f"Database accessible - {len(users)} users found",
                    response_time
                )
                
                self.log_test(
                    "Admin User Exists", 
                    admin_exists, 
                    "Admin user found in database" if admin_exists else "Admin user missing"
                )
                
                # Check for collections by counting different user roles
                roles = {}
                for user in users:
                    role = user.get('role', 'unknown')
                    roles[role] = roles.get(role, 0) + 1
                
                self.log_test(
                    "User Collections", 
                    len(roles) > 0, 
                    f"Found {len(roles)} different user roles: {', '.join(roles.keys())}"
                )
                
            else:
                self.log_test("MongoDB Connection", False, f"Database error: {response.status_code}", response_time)
                
        except Exception as e:
            self.log_test("MongoDB Connection", False, f"Exception: {str(e)}")
    
    def calculate_health_metrics(self):
        """Calculate health metrics"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # Calculate average response time for successful tests
        successful_times = [r["response_time"] for r in self.test_results if r["success"] and r["response_time"]]
        avg_response_time = sum(successful_times) / len(successful_times) if successful_times else 0
        
        # Count slow endpoints
        slow_endpoints = [r for r in self.test_results if r["response_time"] and r["response_time"] > 1.0]
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "avg_response_time": avg_response_time,
            "slow_endpoints": len(slow_endpoints)
        }
    
    def print_health_summary(self):
        """Print comprehensive health summary"""
        metrics = self.calculate_health_metrics()
        
        print("\n" + "="*70)
        print("🏥 BACKEND HEALTH CHECK SUMMARY")
        print("="*70)
        
        # Overall metrics
        print(f"📊 Total Tests: {metrics['total_tests']}")
        print(f"✅ Passed: {metrics['passed_tests']}")
        print(f"❌ Failed: {metrics['failed_tests']}")
        print(f"📈 Success Rate: {metrics['success_rate']:.1f}%")
        print(f"⏱️ Average Response Time: {metrics['avg_response_time']:.2f}s")
        
        # Health status
        if metrics['success_rate'] >= 95:
            health_status = "🟢 EXCELLENT"
            deployment_status = "🚀 READY FOR DEPLOYMENT"
        elif metrics['success_rate'] >= 85:
            health_status = "🟡 GOOD"
            deployment_status = "⚠️ DEPLOYMENT WITH MONITORING"
        elif metrics['success_rate'] >= 70:
            health_status = "🟠 FAIR"
            deployment_status = "⚠️ DEPLOYMENT WITH CAUTION"
        else:
            health_status = "🔴 POOR"
            deployment_status = "🛑 NOT READY FOR DEPLOYMENT"
        
        print(f"🏥 Overall Health: {health_status}")
        print(f"🚀 Deployment Status: {deployment_status}")
        
        # Categorize results
        working_endpoints = []
        failed_endpoints = []
        slow_endpoints = []
        
        for result in self.test_results:
            if result["success"]:
                if result["response_time"] and result["response_time"] > 1.0:
                    slow_endpoints.append(f"{result['test']} ({result['response_time']:.2f}s)")
                else:
                    working_endpoints.append(result["test"])
            else:
                failed_endpoints.append(f"{result['test']}: {result['message']}")
        
        # Print categorized results
        if working_endpoints:
            print(f"\n✅ Working Endpoints ({len(working_endpoints)}):")
            for endpoint in working_endpoints:
                print(f"  ✅ {endpoint}")
        
        if failed_endpoints:
            print(f"\n❌ Failed Endpoints ({len(failed_endpoints)}):")
            for endpoint in failed_endpoints:
                print(f"  ❌ {endpoint}")
        
        if slow_endpoints:
            print(f"\n⚠️ Slow Endpoints (> 1 second) ({len(slow_endpoints)}):")
            for endpoint in slow_endpoints:
                print(f"  ⚠️ {endpoint}")
        
        print("\n" + "="*70)
        
        # Recommendations
        if metrics['success_rate'] < 100:
            print("🔧 RECOMMENDATIONS:")
            if failed_endpoints:
                print("  • Fix failed endpoints before deployment")
            if slow_endpoints:
                print("  • Optimize slow endpoints for better performance")
            if metrics['success_rate'] < 85:
                print("  • Conduct thorough debugging before deployment")
        else:
            print("🎉 ALL SYSTEMS OPERATIONAL - READY FOR PRODUCTION!")
        
        print("="*70)

    def run_health_check(self):
        """Run comprehensive backend health check"""
        print("🏥 BACKEND HEALTH CHECK FOR DEPLOYMENT READINESS")
        print(f"🌐 Testing Backend: {BASE_URL}")
        print(f"👤 Admin User: {ADMIN_USERNAME}")
        print(f"🕐 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run all tests
        self.test_authentication()
        
        if self.auth_token:
            self.test_database_connectivity()
            self.test_users_endpoint()
            self.test_teachers_endpoint()
            self.test_subjects_endpoint()
            self.test_report_endpoints()
        else:
            print("❌ Cannot proceed with other tests - authentication failed")
        
        # Print comprehensive summary
        self.print_health_summary()

if __name__ == "__main__":
    checker = HealthChecker()
    checker.run_health_check()