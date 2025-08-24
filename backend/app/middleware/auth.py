from fastapi import Request, HTTPException, status
from fastapi.security.utils import get_authorization_scheme_param
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import get_db
from ..services.auth import AuthService
import json
from datetime import datetime

class AuthMiddleware(BaseHTTPMiddleware):
    """Authentication middleware for protected routes"""
    
    def __init__(self, app, protected_paths: list = None):
        super().__init__(app)
        self.protected_paths = protected_paths or [
            "/api/v1/auth/me",
            "/api/v1/auth/logout", 
            "/api/v1/auth/verify",
            "/api/v1/repositories",
            "/api/v1/analysis",
            "/api/v1/chat",
            "/api/v1/learning"
        ]
    
    async def dispatch(self, request: Request, call_next):
        """Process request through authentication middleware"""
        path = request.url.path
        
        # Skip authentication for public routes
        if not self._is_protected_path(path):
            return await call_next(request)
        
        # Extract token from Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization:
            return self._unauthorized_response("Missing authorization header")
        
        scheme, token = get_authorization_scheme_param(authorization)
        if scheme.lower() != "bearer":
            return self._unauthorized_response("Invalid authentication scheme")
        
        if not token:
            return self._unauthorized_response("Missing token")
        
        # Validate token and get user
        try:
            # Get database session
            async with AsyncSession(bind=request.app.state.db_engine) as db:
                user = await AuthService.get_user_by_token(db, token)
                if not user:
                    return self._unauthorized_response("Invalid or expired token")
                
                # Add user to request state
                request.state.current_user = user
                
        except Exception as e:
            return self._unauthorized_response(f"Authentication error: {str(e)}")
        
        return await call_next(request)
    
    def _is_protected_path(self, path: str) -> bool:
        """Check if path requires authentication"""
        return any(path.startswith(protected_path) for protected_path in self.protected_paths)
    
    def _unauthorized_response(self, detail: str) -> JSONResponse:
        """Return unauthorized response"""
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "error": True,
                "code": "UNAUTHORIZED",
                "message": detail,
                "timestamp": datetime.utcnow().isoformat()
            },
            headers={"WWW-Authenticate": "Bearer"}
        )

# Dependency to get current user from middleware
async def get_current_user_from_middleware(request: Request):
    """Get current user from middleware state"""
    if not hasattr(request.state, "current_user"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated"
        )
    return request.state.current_user