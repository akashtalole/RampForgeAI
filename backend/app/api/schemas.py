from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "admin"
    DEVELOPER = "developer"
    TEAM_LEAD = "team_lead"
    OBSERVER = "observer"

# Request schemas
class UserRegistrationRequest(BaseModel):
    """User registration request schema"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole = UserRole.DEVELOPER

class UserLoginRequest(BaseModel):
    """User login request schema"""
    email: EmailStr
    password: str

class UserUpdateRequest(BaseModel):
    """User update request schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[UserRole] = None
    skills: Optional[List[str]] = None
    learning_progress: Optional[Dict[str, Any]] = None

# Response schemas
class UserResponse(BaseModel):
    """User response schema"""
    id: str
    email: str
    name: str
    role: str
    is_active: bool
    skills: List[str] = []
    learning_progress: Dict[str, Any] = {}
    created_at: datetime
    last_active: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class MessageResponse(BaseModel):
    """Generic message response schema"""
    message: str
    success: bool = True

class ErrorResponse(BaseModel):
    """Error response schema"""
    error: bool = True
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime
    request_id: Optional[str] = None