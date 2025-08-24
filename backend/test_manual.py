#!/usr/bin/env python3
"""Manual test script for authentication system"""

import asyncio
import httpx
import json
from app.main import app
from app.models import create_tables

async def test_auth_system():
    """Test the authentication system manually"""
    
    # Create database tables
    await create_tables()
    print("✓ Database tables created")
    
    # Start test client
    from httpx import ASGITransport
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        
        # Test 1: Register user
        print("\n1. Testing user registration...")
        register_data = {
            "email": "test@example.com",
            "name": "Test User", 
            "password": "testpassword123",
            "role": "developer"
        }
        
        response = await client.post("/api/v1/auth/register", json=register_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            user_data = response.json()
            print(f"✓ User registered: {user_data['email']}")
        else:
            print(f"✗ Registration failed: {response.text}")
            return
        
        # Test 2: Login user
        print("\n2. Testing user login...")
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        
        response = await client.post("/api/v1/auth/login", json=login_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data["access_token"]
            print(f"✓ Login successful, token: {token[:20]}...")
        else:
            print(f"✗ Login failed: {response.text}")
            return
        
        # Test 3: Access protected endpoint
        print("\n3. Testing protected endpoint...")
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            user_info = response.json()
            print(f"✓ Protected endpoint accessed: {user_info['email']}")
        else:
            print(f"✗ Protected endpoint failed: {response.text}")
            return
        
        # Test 4: Update user info
        print("\n4. Testing user update...")
        update_data = {
            "name": "Updated Test User",
            "skills": ["Python", "FastAPI", "React"]
        }
        response = await client.put("/api/v1/auth/me", json=update_data, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            updated_user = response.json()
            print(f"✓ User updated: {updated_user['name']}, skills: {updated_user['skills']}")
        else:
            print(f"✗ User update failed: {response.text}")
            return
        
        # Test 5: Verify token
        print("\n5. Testing token verification...")
        response = await client.get("/api/v1/auth/verify", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Token verification successful")
        else:
            print(f"✗ Token verification failed: {response.text}")
            return
        
        # Test 6: Logout
        print("\n6. Testing logout...")
        response = await client.post("/api/v1/auth/logout", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Logout successful")
        else:
            print(f"✗ Logout failed: {response.text}")
            return
        
        # Test 7: Verify token is invalid after logout
        print("\n7. Testing token invalidation after logout...")
        response = await client.get("/api/v1/auth/verify", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✓ Token properly invalidated after logout")
        else:
            print(f"✗ Token should be invalid: {response.text}")
            return
        
        print("\n🎉 All authentication tests passed!")

if __name__ == "__main__":
    asyncio.run(test_auth_system())