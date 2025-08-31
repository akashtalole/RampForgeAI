import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User, UserSession
from app.services.auth import AuthService
import json

class TestUserRegistration:
    """Test user registration functionality"""
    
    @pytest.mark.asyncio
    async def test_register_user_success(self, client: AsyncClient, test_user_data):
        """Test successful user registration"""
        response = await client.post("/api/v1/auth/register", json=test_user_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["email"] == test_user_data["email"]
        assert data["name"] == test_user_data["name"]
        assert data["role"] == test_user_data["role"]
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient, test_user_data):
        """Test registration with duplicate email"""
        # Register first user
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Try to register with same email
        response = await client.post("/api/v1/auth/register", json=test_user_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email"""
        invalid_data = {
            "email": "invalid-email",
            "name": "Test User",
            "password": "testpassword123",
            "role": "developer"
        }
        
        response = await client.post("/api/v1/auth/register", json=invalid_data)
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_register_short_password(self, client: AsyncClient):
        """Test registration with short password"""
        invalid_data = {
            "email": "test@example.com",
            "name": "Test User", 
            "password": "short",
            "role": "developer"
        }
        
        response = await client.post("/api/v1/auth/register", json=invalid_data)
        assert response.status_code == 422

class TestUserLogin:
    """Test user login functionality"""
    
    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user_data):
        """Test successful login"""
        # Register user first
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Login
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        assert "user" in data
        assert data["user"]["email"] == test_user_data["email"]
    
    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, client: AsyncClient, test_user_data):
        """Test login with invalid credentials"""
        # Register user first
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Try login with wrong password
        login_data = {
            "email": test_user_data["email"],
            "password": "wrongpassword"
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "incorrect" in data["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with nonexistent user"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "password123"
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401

class TestAuthenticatedEndpoints:
    """Test authenticated endpoint access"""
    
    async def get_auth_headers(self, client: AsyncClient, user_data):
        """Helper to get authentication headers"""
        # Register and login user
        await client.post("/api/v1/auth/register", json=user_data)
        login_response = await client.post("/api/v1/auth/login", json={
            "email": user_data["email"],
            "password": user_data["password"]
        })
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.mark.asyncio
    async def test_get_current_user(self, client: AsyncClient, test_user_data):
        """Test getting current user info"""
        headers = await self.get_auth_headers(client, test_user_data)
        
        response = await client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["name"] == test_user_data["name"]
    
    @pytest.mark.asyncio
    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test getting current user without token"""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_update_current_user(self, client: AsyncClient, test_user_data):
        """Test updating current user info"""
        headers = await self.get_auth_headers(client, test_user_data)
        
        update_data = {
            "name": "Updated Name",
            "skills": ["Python", "FastAPI", "React"]
        }
        
        response = await client.put("/api/v1/auth/me", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["skills"] == ["Python", "FastAPI", "React"]
    
    @pytest.mark.asyncio
    async def test_verify_token(self, client: AsyncClient, test_user_data):
        """Test token verification"""
        headers = await self.get_auth_headers(client, test_user_data)
        
        response = await client.get("/api/v1/auth/verify", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Token is valid"
    
    @pytest.mark.asyncio
    async def test_logout(self, client: AsyncClient, test_user_data):
        """Test user logout"""
        headers = await self.get_auth_headers(client, test_user_data)
        
        response = await client.post("/api/v1/auth/logout", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Successfully logged out"
        
        # Verify token is no longer valid
        verify_response = await client.get("/api/v1/auth/verify", headers=headers)
        assert verify_response.status_code == 401

class TestAuthService:
    """Test AuthService utility functions"""
    
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "testpassword123"
        hashed = AuthService.get_password_hash(password)
        
        assert hashed != password
        assert AuthService.verify_password(password, hashed)
        assert not AuthService.verify_password("wrongpassword", hashed)
    
    def test_jwt_token_creation_and_decoding(self):
        """Test JWT token creation and decoding"""
        data = {"sub": "user123", "email": "test@example.com"}
        token = AuthService.create_access_token(data)
        
        assert token is not None
        decoded = AuthService.decode_access_token(token)
        
        assert decoded is not None
        assert decoded["sub"] == "user123"
        assert decoded["email"] == "test@example.com"
        assert "exp" in decoded
    
    def test_invalid_jwt_token_decoding(self):
        """Test decoding invalid JWT token"""
        invalid_token = "invalid.jwt.token"
        decoded = AuthService.decode_access_token(invalid_token)
        assert decoded is None
    
    def test_token_hashing(self):
        """Test token hashing for storage"""
        token = "sample_jwt_token"
        hash1 = AuthService.hash_token(token)
        hash2 = AuthService.hash_token(token)
        
        assert hash1 == hash2  # Same token should produce same hash
        assert hash1 != token  # Hash should be different from original
    
    @pytest.mark.asyncio
    async def test_authenticate_user(self, test_db: AsyncSession):
        """Test user authentication"""
        # Create test user
        hashed_password = AuthService.get_password_hash("testpassword123")
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=hashed_password,
            role="developer"
        )
        test_db.add(user)
        await test_db.commit()
        
        # Test successful authentication
        authenticated_user = await AuthService.authenticate_user(
            test_db, "test@example.com", "testpassword123"
        )
        assert authenticated_user is not None
        assert authenticated_user.email == "test@example.com"
        
        # Test failed authentication
        failed_auth = await AuthService.authenticate_user(
            test_db, "test@example.com", "wrongpassword"
        )
        assert failed_auth is None