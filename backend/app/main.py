from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from datetime import datetime
from contextlib import asynccontextmanager

# Import configuration and models
from .config import settings
from .models import create_tables
from .api import auth_router
from .api.mcp import router as mcp_router
from .api.project_management import router as pm_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup: Create database tables
    await create_tables()
    yield
    # Shutdown: cleanup if needed

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    description="AI-powered developer onboarding platform API",
    version=settings.api_version,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# Configure CORS
cors_origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API routers
app.include_router(auth_router)
app.include_router(mcp_router)
app.include_router(pm_router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "RampForgeAI API is running"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.api_version,
        "service": "RampForgeAI API"
    }

@app.get("/api/v1/status")
async def api_status():
    """API status endpoint with more detailed information"""
    return {
        "api_version": "v1",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "health": "/api/health",
            "docs": "/api/docs",
            "redoc": "/api/redoc"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )