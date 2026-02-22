#!/usr/bin/env python3
"""
MyAlgorithm Backend API Testing Suite
Tests all API endpoints for the social media growth platform.
"""

import requests
import sys
import json
from datetime import datetime
import time

class MyAlgorithmAPITester:
    def __init__(self, base_url="https://viral-insights-19.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session_token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Test data
        self.test_user = {
            "email": "test@example.com", 
            "password": "test123"
        }
        
        self.new_user = {
            "name": f"TestUser_{int(time.time())}",
            "email": f"newuser_{int(time.time())}@example.com",
            "password": "TestPass123!"
        }
        
        print(f"🚀 Starting MyAlgorithm API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_session=False):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if use_session and self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        print(f"📡 {method} {endpoint}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"📄 Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    pass
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Error: {error_data}")
                except:
                    print(f"❌ Response: {response.text[:200]}")

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ FAILED - Exception: {str(e)}")
            return False, {}

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print(f"\n🔐 Testing Authentication Flow")
        print("=" * 40)
        
        # Test existing user login
        success, response = self.run_test(
            "Login with existing user", 
            "POST", 
            "/auth/login",
            200,
            data=self.test_user
        )
        
        if success and isinstance(response, dict) and 'user_id' in response:
            self.user_data = response
            print(f"🎯 Logged in as: {response.get('name', 'Unknown')} ({response.get('email')})")
            
            # Extract session token from cookies if available
            for cookie in self.session.cookies:
                if cookie.name == 'session_token':
                    self.session_token = cookie.value
                    print(f"🔑 Session token obtained: {self.session_token[:20]}...")
                    break
            
            return True
        else:
            print("❌ Failed to login with existing user, trying to register new user")
            
            # Test user registration  
            success, response = self.run_test(
                "Register new user",
                "POST", 
                "/auth/register",
                200,
                data=self.new_user
            )
            
            if success:
                self.user_data = response
                for cookie in self.session.cookies:
                    if cookie.name == 'session_token':
                        self.session_token = cookie.value
                        break
                return True
                
        return False

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print(f"\n🔐 Testing Auth Endpoints")
        print("=" * 40)
        
        # Test /auth/me - should return level and features data
        success, response = self.run_test(
            "Get current user info with level/features",
            "GET",
            "/auth/me", 
            200,
            use_session=True
        )
        
        if success and isinstance(response, dict):
            print(f"🎯 User profile includes:")
            if 'level' in response:
                level_info = response['level']
                print(f"   🎖️ Level: {level_info.get('level', 'N/A')} - {level_info.get('name', 'N/A')} ({level_info.get('xp', 0)} XP)")
            if 'features' in response:
                features = response['features']
                print(f"   ⚡ Features: daily_limit={features.get('daily_limit', 'N/A')}, competitors={features.get('competitors', False)}, favorites={features.get('favorites', False)}")
            if 'plan' in response:
                print(f"   💳 Plan: {response['plan']}")
        
        return success

    def test_logout_endpoint(self):
        """Test logout endpoint (should be called last)"""
        print(f"\n🔐 Testing Logout (Final)")
        print("=" * 40)
        
        # Test logout
        self.run_test(
            "Logout user",
            "POST",
            "/auth/logout",
            200,
            use_session=True
        )

    def test_dashboard_endpoints(self):
        """Test dashboard endpoints with gamification"""
        print(f"\n📊 Testing Dashboard Endpoints with Gamification")
        print("=" * 40)
        
        # Test dashboard overview - should return level, achievements, daily_usage
        success, response = self.run_test(
            "Dashboard overview with gamification",
            "GET",
            "/dashboard/overview",
            200,
            use_session=True
        )
        
        if success and isinstance(response, dict):
            print(f"🎯 Dashboard overview includes:")
            if 'level' in response:
                level_info = response['level']
                print(f"   🎖️ Level: {level_info.get('level', 'N/A')} - {level_info.get('name', 'N/A')}")
            if 'achievements' in response:
                earned_count = len(response['achievements'])
                total_count = len(response.get('all_achievements', []))
                print(f"   🏆 Achievements: {earned_count}/{total_count} earned")
            if 'daily_usage' in response:
                usage = response['daily_usage']
                print(f"   ⚡ Daily usage: {usage.get('used', 0)}/{usage.get('limit', 0)} analyses")
        
        # Test dashboard analyses
        self.run_test(
            "Dashboard analyses list",
            "GET", 
            "/dashboard/analyses",
            200,
            use_session=True
        )

    def test_content_analysis(self):
        """Test AI content analysis and XP system"""
        print(f"\n🤖 Testing Content Analysis with XP System")
        print("=" * 40)
        
        test_content = {
            "content": "Just posted my latest tutorial on how to create viral TikTok content! 🔥 What do you think? #contentcreator #viral #tips",
            "platform": "tiktok"
        }
        
        success, response = self.run_test(
            "AI Content Analysis with XP rewards",
            "POST",
            "/analyze/content", 
            200,
            data=test_content,
            use_session=True
        )
        
        if success and isinstance(response, dict):
            print(f"🎯 Analysis Results:")
            if 'viral_score' in response:
                print(f"   📈 Viral Score: {response['viral_score']}")
            if 'summary' in response:
                print(f"   📝 Summary: {response['summary'][:100]}...")
            if 'xp_earned' in response:
                print(f"   ⭐ XP Earned: {response['xp_earned']}")
            if 'remaining_today' in response:
                print(f"   ⚡ Remaining today: {response['remaining_today']}")
            if 'new_achievements' in response and response['new_achievements']:
                print(f"   🏆 New achievements: {response['new_achievements']}")
        
        return success

    def test_video_link_analysis(self):
        """Test new video link analysis feature"""
        print(f"\n🎬 Testing Video Link Analysis")
        print("=" * 40)
        
        # Test with a TikTok-like URL
        video_data = {
            "url": "https://www.tiktok.com/@user/video/7000000000000000000"
        }
        
        success, response = self.run_test(
            "Video Link Analysis", 
            "POST",
            "/analyze/video-link",
            200,
            data=video_data,
            use_session=True
        )
        
        if success and isinstance(response, dict):
            print(f"🎯 Video Analysis Results:")
            if 'video_data' in response:
                vd = response['video_data']
                print(f"   🎬 Platform: {vd.get('platform', 'N/A')}")
                print(f"   📝 Title: {vd.get('title', 'N/A')[:50]}...")
            if 'viral_score' in response:
                print(f"   📈 Viral Score: {response['viral_score']}")
            if 'xp_earned' in response:
                print(f"   ⭐ XP Earned: {response['xp_earned']}")
    def test_favorites_with_plan_gating(self):
        """Test favorites feature with plan gating"""
        print(f"\n⭐ Testing Favorites with Plan Gating")
        print("=" * 40)
        
        # First, we need an analysis to favorite
        test_content = {
            "content": "Sample content for favoriting test",
            "platform": "tiktok"
        }
        
        analysis_success, analysis_response = self.run_test(
            "Create analysis for favoriting",
            "POST",
            "/analyze/content",
            200,
            data=test_content,
            use_session=True
        )
        
        if analysis_success and isinstance(analysis_response, dict):
            analysis_id = analysis_response.get('analysis_id')
            
            if analysis_id:
                # Check user's plan for favorites
                auth_success, auth_response = self.run_test(
                    "Check user plan for favorites",
                    "GET", 
                    "/auth/me",
                    200,
                    use_session=True
                )
                
                if auth_success and isinstance(auth_response, dict):
                    features = auth_response.get('features', {})
                    favorites_allowed = features.get('favorites', False)
                    plan = auth_response.get('plan', 'free')
                    
                    print(f"   👤 User plan: {plan}")
                    print(f"   ⭐ Favorites feature: {favorites_allowed}")
                    
                    if favorites_allowed:
                        expected_status = 200
                        test_name = "Toggle favorite (Pro/Premium user)"
                    else:
                        expected_status = 403
                        test_name = "Toggle favorite (Free user - should be blocked)"
                    
                    favorite_data = {"analysis_id": analysis_id}
                    
                    success, response = self.run_test(
                        test_name,
                        "POST",
                        "/analyses/favorite",
                        expected_status,
                        data=favorite_data,
                        use_session=True
                    )
                    
                    if success and expected_status == 200:
                        print(f"🎯 Favorite toggled successfully")
                    elif success and expected_status == 403:
                        print(f"🎯 Plan gating working correctly - free user blocked")
                    
                    return success
        
        return False

    def test_user_stats_and_achievements(self):
        """Test user stats and achievements endpoint"""
        print(f"\n📊 Testing User Stats and Achievements")  
        print("=" * 40)
        
        success, response = self.run_test(
            "Get user stats and achievements",
            "GET",
            "/user/stats",
            200,
            use_session=True
        )
        
        if success and isinstance(response, dict):
            print(f"🎯 User Stats:")
            if 'level' in response:
                level_info = response['level']
                print(f"   🎖️ Level: {level_info.get('level', 'N/A')} - {level_info.get('name', 'N/A')} ({level_info.get('xp', 0)} XP)")
            if 'total_analyses' in response:
                print(f"   📊 Total analyses: {response['total_analyses']}")
            if 'achievements' in response:
                earned = sum(1 for ach in response['achievements'] if ach.get('earned', False))
                total = len(response['achievements'])
                print(f"   🏆 Achievements: {earned}/{total} earned")
        
        return success

        
        return success
        
    def test_daily_limit_for_free_users(self):
        """Test daily limit enforcement for free users"""
        print(f"\n⏰ Testing Daily Limit for Free Users")
        print("=" * 40)
        
        # Check if user is on free plan and has used analyses
        auth_success, auth_response = self.run_test(
            "Check user plan and usage",
            "GET",
            "/auth/me",
            200,
            use_session=True
        )
        
        if auth_success and isinstance(auth_response, dict):
            plan = auth_response.get('plan', 'free')
            features = auth_response.get('features', {})
            daily_limit = features.get('daily_limit', 3)
            
            print(f"   👤 User plan: {plan}")
            print(f"   ⚡ Daily limit: {daily_limit}")
            
            if plan == 'free' and daily_limit > 0:
                # Try to make multiple analyses to potentially hit limit
                test_content = {
                    "content": f"Test analysis {datetime.now().isoformat()}",
                    "platform": "tiktok"
                }
                
                success, response = self.run_test(
                    "Analysis within daily limit",
                    "POST", 
                    "/analyze/content",
                    200,
                    data=test_content,
                    use_session=True
                )
                
                if success:
                    remaining = response.get('remaining_today', -1)
                    print(f"   ⚡ Remaining after analysis: {remaining}")
                    
                    # If we're at limit, try one more to test 429 response
                    if remaining == 0:
                        print("   🚫 Testing daily limit exceeded...")
                        limit_success, limit_response = self.run_test(
                            "Analysis when daily limit exceeded",
                            "POST",
                            "/analyze/content", 
                            429,  # Should get rate limited
                            data=test_content,
                            use_session=True
                        )
                        return limit_success
            
        return True

    def test_growth_plan(self):
        """Test growth plan endpoint (mocked data)"""
        print(f"\n📈 Testing Growth Plan (Mocked Data)")
        print("=" * 40)
        
        success, response = self.run_test(
            "Get growth plan",
            "GET",
            "/growth-plan",
            200,
            use_session=True
        )
        
        if success and isinstance(response, dict):
            print(f"🎯 Growth Plan includes:")
            if 'weekly_strategy' in response:
                days = list(response['weekly_strategy'].keys())[:3]
                print(f"   📅 Weekly strategy for: {', '.join(days)}")
            if 'recommended_topics' in response:
                topics = response['recommended_topics'][:3] if response['recommended_topics'] else []
                print(f"   💡 Topics: {', '.join(topics)}")

    def test_competitors(self):
        """Test competitor analysis with plan gating"""
        print(f"\n👥 Testing Competitor Analysis with Plan Gating")
        print("=" * 40)
        
        competitor_data = {
            "username": "testcompetitor",
            "platform": "instagram"
        }
        
        # First check user's plan
        auth_success, auth_response = self.run_test(
            "Check user plan for competitors",
            "GET",
            "/auth/me",
            200,
            use_session=True
        )
        
        if auth_success and isinstance(auth_response, dict):
            plan = auth_response.get('plan', 'free') 
            features = auth_response.get('features', {})
            competitors_allowed = features.get('competitors', False)
            
            print(f"   👤 User plan: {plan}")
            print(f"   🔓 Competitors feature: {competitors_allowed}")
            
            if competitors_allowed:
                # Should succeed for Pro/Premium users
                expected_status = 200
                test_name = "Analyze competitor (Pro/Premium user)"
            else:
                # Should fail with 403 for free users
                expected_status = 403
                test_name = "Analyze competitor (Free user - should be blocked)"
            
            success, response = self.run_test(
                test_name,
                "POST",
                "/competitors/analyze",
                expected_status,
                data=competitor_data,
                use_session=True
            )
            
            if success and expected_status == 200 and isinstance(response, dict):
                print(f"🎯 Competitor Analysis:")
                if 'posting_frequency' in response:
                    print(f"   📊 Posting frequency: {response['posting_frequency']}")
                if 'avg_engagement_rate' in response:
                    print(f"   💬 Engagement rate: {response['avg_engagement_rate']}")
            elif success and expected_status == 403:
                print(f"🎯 Plan gating working correctly - free user blocked")
        
        return True

    def test_account_management(self):
        """Test account management endpoints"""
        print(f"\n👤 Testing Account Management")
        print("=" * 40)
        
        # Test profile update
        profile_update = {
            "name": f"Updated Name {int(time.time())}"
        }
        
        self.run_test(
            "Update user profile",
            "PUT",
            "/account/profile",
            200,
            data=profile_update,
            use_session=True
        )
        
        # Test password change (only for non-Google users)
        if self.user_data and 'password' in self.new_user:  # Only test if we registered with password
            password_change = {
                "current_password": self.new_user['password'],
                "new_password": "NewPassword123!"
            }
            
            self.run_test(
                "Change password",
                "PUT", 
                "/account/password",
                200,
                data=password_change,
                use_session=True
            )

    def test_billing_endpoints(self):
        """Test billing and Stripe integration"""
        print(f"\n💳 Testing Billing & Stripe Integration")
        print("=" * 40)
        
        # Test get plans
        success, response = self.run_test(
            "Get billing plans",
            "GET",
            "/billing/plans",
            200
        )
        
        if success and isinstance(response, list):
            print(f"🎯 Available plans: {[plan.get('name', 'Unknown') for plan in response]}")
        
        # Test billing history
        self.run_test(
            "Get billing history", 
            "GET",
            "/billing/history",
            200,
            use_session=True
        )
        
        # Test checkout creation (will create Stripe session)
        checkout_data = {
            "plan_id": "starter",
            "origin_url": "https://viral-insights-19.preview.emergentagent.com"
        }
        
        success, response = self.run_test(
            "Create Stripe checkout session",
            "POST",
            "/billing/checkout", 
            200,
            data=checkout_data,
            use_session=True
        )
        
        if success and isinstance(response, dict) and 'url' in response:
            print(f"🎯 Checkout URL created: {response['url'][:50]}...")

    def test_root_endpoint(self):
        """Test root API endpoint"""
        print(f"\n🏠 Testing Root Endpoint")
        print("=" * 40)
        
        self.run_test(
            "Root API endpoint",
            "GET",
            "/",
            200
        )

    def run_all_tests(self):
        """Run complete test suite"""
        try:
            # Test root endpoint first
            self.test_root_endpoint()
            
            # Authentication flow (required for protected endpoints)
            if not self.test_auth_flow():
                print("❌ Authentication failed - cannot test protected endpoints")
                return False
            
            # Test all protected endpoints (logout should be last to avoid session invalidation)
            self.test_auth_endpoints()
            self.test_dashboard_endpoints() 
            self.test_content_analysis()
            self.test_growth_plan()
            self.test_competitors()
            self.test_account_management()
            self.test_billing_endpoints()
            
            # Test logout last (this will invalidate session)
            self.test_logout_endpoint()
            
            return True
            
        except Exception as e:
            print(f"❌ Test suite failed with exception: {e}")
            return False
        
        finally:
            # Print final results
            print("\n" + "=" * 60)
            print(f"📊 TEST RESULTS SUMMARY")
            print("=" * 60)
            print(f"🎯 Tests Run: {self.tests_run}")
            print(f"✅ Tests Passed: {self.tests_passed}")
            print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
            print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
            print(f"⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            if self.tests_passed == self.tests_run:
                print("🎉 ALL TESTS PASSED!")
                return True
            else:
                print(f"⚠️  {self.tests_run - self.tests_passed} TESTS FAILED")
                return False

def main():
    """Main test execution"""
    tester = MyAlgorithmAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())