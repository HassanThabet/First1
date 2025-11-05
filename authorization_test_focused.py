#!/usr/bin/env python3
"""
Focused Authorization Testing - Testing working endpoints only
Tests the authorization fix while excluding the broken supervisor reports endpoint
"""

import requests
import json

# Configuration
BASE_URL = "https://quality-school-dash.preview.emergentagent.com/api"

# Test credentials
TEST_USERS = {
    "chairman": {"username": "ثابت", "password": "123456"},
    "director": {"username": "ahmed", "password": "123456"}, 
    "quality": {"username": "quality_user", "password": "123456"}
}

# Working report endpoints (excluding supervisor due to data corruption)
WORKING_ENDPOINTS = [
    "/reports/vice-principal",
    "/reports/activities", 
    "/reports/educational-supervision",
    "/reports/social-specialist",
    "/reports/quality",
    "/users",
    "/teachers"
]

class FocusedAuthTester:
    def __init__(self):
        self.session = requests.Session()
        self.results = []
        
    def log_result(self, test, success, message, status_code=None):
        status = "✅" if success else "❌"
        code_info = f" ({status_code})" if status_code else ""
        print(f"{status} {test}: {message}{code_info}")
        self.results.append({"test": test, "success": success, "message": message, "status_code": status_code})
        
    def login_user(self, role, credentials):
        login_data = {
            "username": credentials["username"],
            "password": credentials["password"],
            "remember_me": False
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                user_info = data["user"]
                self.log_result(f"{role.title()} Login", True, f"Logged in as {user_info.get('username')} (role: {user_info.get('role')})", 200)
                return True
            else:
                self.log_result(f"{role.title()} Login", False, f"Login failed: {response.text}", response.status_code)
                return False
        except Exception as e:
            self.log_result(f"{role.title()} Login", False, f"Exception: {str(e)}")
            return False
            
    def test_endpoint(self, role, endpoint):
        try:
            response = self.session.get(f"{BASE_URL}{endpoint}")
            
            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else "N/A"
                self.log_result(f"{role} {endpoint}", True, f"Access granted, {count} records", 200)
                return True
            elif response.status_code == 401:
                self.log_result(f"{role} {endpoint}", False, "401 Unauthorized - Authorization failed!", 401)
                return False
            elif response.status_code == 403:
                self.log_result(f"{role} {endpoint}", False, "403 Forbidden - Access denied!", 403)
                return False
            else:
                self.log_result(f"{role} {endpoint}", False, f"Unexpected error: {response.text}", response.status_code)
                return False
        except Exception as e:
            self.log_result(f"{role} {endpoint}", False, f"Exception: {str(e)}")
            return False
            
    def test_role_authorization(self, role, credentials):
        print(f"\n=== Testing {role.upper()} Authorization ===")
        
        if not self.login_user(role, credentials):
            return False
            
        success_count = 0
        for endpoint in WORKING_ENDPOINTS:
            if self.test_endpoint(role, endpoint):
                success_count += 1
                
        total = len(WORKING_ENDPOINTS)
        success_rate = (success_count / total) * 100
        
        if success_rate == 100:
            self.log_result(f"{role.title()} Overall", True, f"ALL working endpoints accessible ({success_count}/{total})")
            return True
        else:
            self.log_result(f"{role.title()} Overall", False, f"Some endpoints failed ({success_count}/{total})")
            return False
            
    def run_tests(self):
        print("🔍 FOCUSED AUTHORIZATION TEST - WORKING ENDPOINTS ONLY")
        print("=" * 70)
        print("NOTE: Excluding /reports/supervisor due to data corruption issue")
        print("=" * 70)
        
        all_passed = True
        role_results = {}
        
        for role, credentials in TEST_USERS.items():
            role_success = self.test_role_authorization(role, credentials)
            role_results[role] = role_success
            if not role_success:
                all_passed = False
                
        print(f"\n{'=' * 70}")
        print("🎯 AUTHORIZATION TEST RESULTS")
        print("=" * 70)
        
        for role, success in role_results.items():
            status = "✅ WORKING" if success else "❌ FAILED"
            print(f"{role.upper()} Authorization: {status}")
            
        # Statistics
        total_tests = len(self.results)
        passed = sum(1 for r in self.results if r["success"])
        
        print(f"\n📊 Statistics: {passed}/{total_tests} tests passed ({(passed/total_tests)*100:.1f}%)")
        
        if all_passed:
            print("\n🎉 SUCCESS: Authorization fix is working!")
            print("✅ Chairman, Director, and Quality can access all working report endpoints")
            print("✅ No 401 authorization errors found")
        else:
            print("\n⚠️ Authorization issues found!")
            
        return all_passed

def main():
    tester = FocusedAuthTester()
    success = tester.run_tests()
    
    print(f"\n{'=' * 70}")
    print("📋 SUMMARY FOR MAIN AGENT")
    print("=" * 70)
    
    if success:
        print("✅ AUTHORIZATION FIX VERIFIED: Working correctly for all testable endpoints")
        print("✅ Chairman, Director, and Quality roles can access report data without 401 errors")
        print("⚠️  DATA ISSUE FOUND: /reports/supervisor endpoint has data corruption")
        print("   - Error: Integer fields contain float values (8.5, 7.5)")
        print("   - Fields affected: student_discipline, teacher_attendance_rate")
        print("   - This is a DATA INTEGRITY issue, not an authorization issue")
        print("   - Recommendation: Clean up supervisor reports data or update Pydantic model")
    else:
        print("❌ AUTHORIZATION ISSUES REMAIN: Some endpoints still failing")
        
    return success

if __name__ == "__main__":
    main()