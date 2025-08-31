#!/usr/bin/env python3
"""
Test the authentication flow to diagnose session issues
"""

import asyncio
import httpx
import json

async def test_auth_flow():
    """Test the complete authentication flow"""
    
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        print("🔍 Testing Authentication Flow")
        print("=" * 50)
        
        # Test 1: Health check
        print("\n1. Testing backend health...")
        try:
            response = await client.get(f"{base_url}/api/health")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print(f"   Response: {response.json()}")
            else:
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"   ❌ Backend not reachable: {e}")
            return
        
        # Test 2: Login
        print("\n2. Testing login...")
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        
        try:
            response = await client.post(f"{base_url}/api/v1/auth/login", json=login_data)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                auth_data = response.json()
                token = auth_data["access_token"]
                user = auth_data["user"]
                print(f"   ✅ Login successful!")
                print(f"   Token: {token[:20]}...")
                print(f"   User: {user['name']} ({user['email']})")
                
                # Test 3: Verify token
                print("\n3. Testing token verification...")
                headers = {"Authorization": f"Bearer {token}"}
                response = await client.get(f"{base_url}/api/v1/auth/verify", headers=headers)
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    print(f"   ✅ Token is valid!")
                else:
                    print(f"   ❌ Token verification failed: {response.text}")
                
                # Test 4: Get current user
                print("\n4. Testing get current user...")
                response = await client.get(f"{base_url}/api/v1/auth/me", headers=headers)
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    user_data = response.json()
                    print(f"   ✅ User data retrieved!")
                    print(f"   Name: {user_data['name']}")
                    print(f"   Email: {user_data['email']}")
                    print(f"   Role: {user_data['role']}")
                else:
                    print(f"   ❌ Get user failed: {response.text}")
                
                # Test 5: Multiple requests to simulate session usage
                print("\n5. Testing multiple requests...")
                for i in range(3):
                    response = await client.get(f"{base_url}/api/v1/auth/me", headers=headers)
                    print(f"   Request {i+1}: {response.status_code}")
                    if response.status_code != 200:
                        print(f"   ❌ Request {i+1} failed: {response.text}")
                        break
                else:
                    print(f"   ✅ All requests successful!")
                
            else:
                print(f"   ❌ Login failed: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Login error: {e}")

if __name__ == "__main__":
    asyncio.run(test_auth_flow())