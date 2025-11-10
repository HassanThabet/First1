#!/usr/bin/env python3
"""
Authorization Testing Script for Chairman, Director, and Quality Dashboard Fix
Tests the specific authorization fix for report endpoints access
"""

import requests
import json
import sys

# Configuration
BASE_URL = "https://myproject-4.preview.emergentagent.com/api"

# Test credentials as specified in the review request
TEST_USERS = {
    "chairman": {"username": "ثابت", "password": "123456"},
    "director": {"username": "ahmed", "password": "123456"},
    "quality": {"username": "quality_user", "password": "123456"}
}

# Report endpoints to test
REPORT_ENDPOINTS = [
    "/reports/supervisor",
    "/reports/vice-principal", 
    "/reports/activities",
    "/reports/educational-supervision",
    "/reports/social-specialist",
    "/reports/quality"
]

# Additional endpoints to test
ADDITIONAL_ENDPOINTS = [
    "/users",
    "/teachers"
]

class AuthorizationTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message="", status_code=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        status_info = f" (HTTP {status_code})" if status_code else ""
        print(f"{status} {test_name}: {message}{status_info}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "status_code": status_code
        })
        
    def login_user(self, role, credentials):
        """Login as specific user role"""
        login_data = {
            "username": credentials["username"],
            "password": credentials["password"],
            "remember_me": False
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data and "token" in data:
                    user_info = data["user"]
                    self.log_test(
                        f"{role.title()} Login", 
                        True, 
                        f"Successfully logged in as {user_info.get('username')} with role {user_info.get('role')}",
                        response.status_code
                    )
                    return True, user_info
                else:
                    self.log_test(f"{role.title()} Login", False, "Login response missing user or token", response.status_code)
                    return False, None
            else:
                self.log_test(f"{role.title()} Login", False, f"Login failed: {response.text}", response.status_code)
                return False, None
                
        except Exception as e:
            self.log_test(f"{role.title()} Login", False, f"Login exception: {str(e)}")
            return False, None
            
    def test_endpoint_access(self, role, endpoint):
        """Test access to a specific endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}{endpoint}")
            
            if response.status_code == 200:
                data = response.json()
                data_count = len(data) if isinstance(data, list) else "N/A"
                self.log_test(
                    f"{role.title()} - {endpoint}", 
                    True, 
                    f"Access granted, retrieved {data_count} records",
                    response.status_code
                )
                return True
            elif response.status_code == 401:
                self.log_test(
                    f"{role.title()} - {endpoint}", 
                    False, 
                    "AUTHORIZATION FAILED - 401 Unauthorized",
                    response.status_code
                )
                return False
            elif response.status_code == 403:
                self.log_test(
                    f"{role.title()} - {endpoint}", 
                    False, 
                    "ACCESS FORBIDDEN - 403 Forbidden",
                    response.status_code
                )
                return False
            else:
                self.log_test(
                    f"{role.title()} - {endpoint}", 
                    False, 
                    f"Unexpected response: {response.text}",
                    response.status_code
                )
                return False
                
        except Exception as e:
            self.log_test(f"{role.title()} - {endpoint}", False, f"Exception: {str(e)}")
            return False
            
    def test_user_role_authorization(self, role, credentials):
        """Test all endpoints for a specific user role"""
        print(f"\n=== Testing {role.upper()} User Authorization ===")
        
        # Login as the user
        login_success, user_info = self.login_user(role, credentials)
        if not login_success:
            print(f"❌ Cannot test {role} - login failed")
            return False
            
        # Test all report endpoints
        report_success_count = 0
        for endpoint in REPORT_ENDPOINTS:
            if self.test_endpoint_access(role, endpoint):
                report_success_count += 1
                
        # Test additional endpoints
        additional_success_count = 0
        for endpoint in ADDITIONAL_ENDPOINTS:
            if self.test_endpoint_access(role, endpoint):
                additional_success_count += 1
                
        # Summary for this role
        total_endpoints = len(REPORT_ENDPOINTS) + len(ADDITIONAL_ENDPOINTS)
        total_success = report_success_count + additional_success_count
        
        success_rate = (total_success / total_endpoints) * 100
        
        if success_rate == 100:
            self.log_test(
                f"{role.title()} Overall Result", 
                True, 
                f"ALL ENDPOINTS ACCESSIBLE ({total_success}/{total_endpoints}) - Authorization fix working!"
            )
            return True
        else:
            self.log_test(
                f"{role.title()} Overall Result", 
                False, 
                f"SOME ENDPOINTS FAILED ({total_success}/{total_endpoints}) - Authorization issues remain"
            )
            return False
            
    def run_authorization_tests(self):
        """Run comprehensive authorization tests"""
        print("🔍 TESTING AUTHORIZATION FIX FOR CHAIRMAN, DIRECTOR, AND QUALITY DASHBOARDS")
        print("=" * 80)
        
        overall_success = True
        role_results = {}
        
        # Test each user role
        for role, credentials in TEST_USERS.items():
            role_success = self.test_user_role_authorization(role, credentials)
            role_results[role] = role_success
            if not role_success:
                overall_success = False
                
        # Final summary
        print(f"\n{'=' * 80}")
        print("🎯 AUTHORIZATION TEST SUMMARY")
        print("=" * 80)
        
        for role, success in role_results.items():
            status = "✅ WORKING" if success else "❌ FAILED"
            print(f"{role.upper()} Dashboard Authorization: {status}")
            
        if overall_success:
            print("\n🎉 SUCCESS: Authorization fix is working correctly!")
            print("✅ All three user roles (Chairman, Director, Quality) can access report data without 401 errors")
            print("✅ Chairman has same access level as Director")
            print("✅ Quality can see all reports for their branch")
        else:
            print("\n⚠️  ISSUES FOUND: Authorization fix needs attention!")
            failed_roles = [role for role, success in role_results.items() if not success]
            print(f"❌ Failed roles: {', '.join(failed_roles)}")
            
        # Test statistics
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"\n📊 Test Statistics:")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        return overall_success

def main():
    """Main test execution"""
    tester = AuthorizationTester()
    
    try:
        success = tester.run_authorization_tests()
        
        # Exit with appropriate code
        if success:
            print("\n✅ All authorization tests passed!")
            sys.exit(0)
        else:
            print("\n❌ Some authorization tests failed!")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()