from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    api_title: str = "RampForgeAI API"
    api_version: str = "1.0.0"
    debug: bool = False
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"
    
    # Database Configuration
    database_url: str = "sqlite+aiosqlite:///./rampforge.db"
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    
    # Security Configuration
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # External Services
    github_token: Optional[str] = None
    gitlab_token: Optional[str] = None
    jira_url: Optional[str] = None
    jira_token: Optional[str] = None
    
    # AI Services
    vertex_ai_project: Optional[str] = None
    vertex_ai_location: str = "us-central1"
    
    model_config = {"env_file": ".env"}

settings = Settings()