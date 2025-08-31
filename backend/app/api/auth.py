from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
import json
from ..models import User, get_db
from ..services.auth import AuthService, get_current_active_user, security
from ..config import settings
from .schemas import (
    UserRegistrationRequest,
    UserLoginRequest,
    UserUpdateRequest,
    UserResponse,
    LoginResponse,
    MessageResponse,
    ErrorResponse,
    UserRole
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegistrationRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = AuthService.get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        role=user_data.role.value,
        skills_json="[]",
        learning_progress_json="{}"
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Convert to response format
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        role=new_user.role,
        is_active=new_user.is_active,
        skills=json.loads(new_user.skills_json),
        learning_progress=json.loads(new_user.learning_progress_json),
        created_at=new_user.created_at,
        last_active=new_user.last_active
    )

@router.post("/login", response_model=LoginResponse)
async def login_user(
    login_data: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Login user and return JWT token"""
    # Authenticate user
    user = await AuthService.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = AuthService.create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    
    # Create session
    await AuthService.create_user_session(db, user, access_token)
    
    # Update last active
    user.last_active = user.created_at  # Will be updated by SQLAlchemy
    await db.commit()
    
    # Return response
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        is_active=user.is_active,
        skills=json.loads(user.skills_json),
        learning_progress=json.loads(user.learning_progress_json),
        created_at=user.created_at,
        last_active=user.last_active
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,  # Convert to seconds
        user=user_response
    )

@router.post("/logout", response_model=MessageResponse)
async def logout_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Logout user and revoke session"""
    token = credentials.credentials
    success = await AuthService.revoke_session(db, token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    return MessageResponse(message="Successfully logged out")

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        is_active=current_user.is_active,
        skills=json.loads(current_user.skills_json),
        learning_progress=json.loads(current_user.learning_progress_json),
        created_at=current_user.created_at,
        last_active=current_user.last_active
    )

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user information"""
    # Update fields if provided
    if user_update.name is not None:
        current_user.name = user_update.name
    
    if user_update.role is not None:
        current_user.role = user_update.role.value
    
    if user_update.skills is not None:
        current_user.skills_json = json.dumps(user_update.skills)
    
    if user_update.learning_progress is not None:
        current_user.learning_progress_json = json.dumps(user_update.learning_progress)
    
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        is_active=current_user.is_active,
        skills=json.loads(current_user.skills_json),
        learning_progress=json.loads(current_user.learning_progress_json),
        created_at=current_user.created_at,
        last_active=current_user.last_active
    )

@router.get("/verify", response_model=MessageResponse)
async def verify_token(
    current_user: User = Depends(get_current_active_user)
):
    """Verify if token is valid"""
    return MessageResponse(message="Token is valid")