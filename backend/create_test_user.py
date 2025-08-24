#!/usr/bin/env python3
"""
Simple script to create a test user for manual testing
"""

import asyncio
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User, get_db
from app.services.auth import AuthService
import json

async def create_test_user():
    """Create a test user for manual testing"""
    
    # Test user data
    email = "test@example.com"
    name = "Test User"
    password = "password123"
    role = "developer"
    
    print(f"Creating test user: {email}")
    
    # Get database session
    async for db in get_db():
        try:
            # Check if user already exists
            result = await db.execute(select(User).where(User.email == email))
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"User {email} already exists!")
                print(f"User ID: {existing_user.id}")
                print(f"Name: {existing_user.name}")
                print(f"Role: {existing_user.role}")
                print(f"Active: {existing_user.is_active}")
                return
            
            # Create new user
            hashed_password = AuthService.get_password_hash(password)
            new_user = User(
                email=email,
                name=name,
                hashed_password=hashed_password,
                role=role,
                skills_json=json.dumps(["Python", "FastAPI", "React"]),
                learning_progress_json=json.dumps({})
            )
            
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            
            print(f"✅ Test user created successfully!")
            print(f"Email: {email}")
            print(f"Password: {password}")
            print(f"Name: {name}")
            print(f"Role: {role}")
            print(f"User ID: {new_user.id}")
            
        except Exception as e:
            print(f"❌ Error creating test user: {e}")
            await db.rollback()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(create_test_user())