# Backend Documentation

## Overview

The RampForgeAI backend is built with FastAPI and Python 3.11+, providing a robust REST API for the AI-powered developer onboarding platform. The backend handles authentication, MCP service integration, project management data processing, and AI-powered analysis.

## Architecture

### Technology Stack
- **Framework**: FastAPI 0.115.0
- **Language**: Python 3.11+
- **ASGI Server**: Uvicorn with standard extras
- **Database**: SQLAlchemy 2.0.36 with SQLite/aiosqlite
- **Caching**: Redis 7
- **Authentication**: python-jose with cryptography, passlib with bcrypt
- **Testing**: pytest with asyncio support

### Core Components
- **API Layer**: FastAPI routers and endpoints
- **Service Layer**: Business logic and external integrations
- **Data Layer**: SQLAlchemy models and database operations
- **MCP Integration**: Model Context Protocol client implementations
- **AI Integration**: Google Vertex AI and Gemini Flash 2.5

## Project Structure

```
backend/
├── app/
│   ├── api/                    # API route handlers
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── mcp/               # MCP service endpoints
│   │   └── project_management/ # Project management endpoints
│   ├── models/                # SQLAlchemy database models
│   │   ├── __init__.py        # Database initialization
│   │   ├── user.py            # User and authentication models
│   │   ├── mcp.py             # MCP service models
│   │   └── project.py         # Project management models
│   ├── services/              # Business logic layer
│   │   ├── auth_service.py    # Authentication logic
│   │   ├── mcp_service.py     # MCP integration logic
│   │   └── pm_service.py      # Project management logic
│   ├── config.py              # Application configuration
│   └── main.py                # FastAPI application entry point
├── .env.example               # Environment variables template
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Container configuration
└── pytest.ini                # Test configuration
```

## Key Features

### FastAPI Application Structure

#### Main Application (`app/main.py`)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup: Create database tables
    await create_tables()
    yield
    # Shutdown: cleanup if needed

app = FastAPI(
    title=settings.api_title,
    description="AI-powered developer onboarding platform API",
    version=settings.api_version,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth_router)
app.include_router(mcp_router)
app.include_router(pm_router)
```

#### Health Check Endpoints
- `GET /`: Root endpoint with basic status
- `GET /api/health`: Health check with timestamp and version
- `GET /api/v1/status`: Detailed API status information

### Authentication System

#### JWT-Based Authentication
- Secure token generation and validation
- Password hashing with bcrypt
- Session management with database storage
- Role-based access control

#### User Management
- User registration and login
- Profile management
- Skill tracking and learning progress
- Session lifecycle management

### MCP Integration Layer

#### Supported Services
- **GitHub**: Repository data, issues, pull requests
- **GitLab**: Project data, merge requests, issues
- **Jira**: Projects, issues, workflows, team data
- **Azure DevOps**: Work items, repositories, team information
- **Confluence**: Documentation and knowledge base

#### MCP Client Architecture
```python
class MCPConfig(BaseModel):
    service_type: str
    endpoint: str
    credentials: Dict[str, str]
    enabled: bool
    rate_limits: Dict[str, int]

class MCPClient:
    async def connect_service(self, config: MCPConfig) -> bool
    async def fetch_repository_data(self, repo_url: str) -> RepositoryData
    async def fetch_project_data(self, project_id: str) -> ProjectData
    async def sync_data(self) -> SyncResult
```

### Project Management Integration

#### Data Processing Pipeline
- Real-time synchronization with PM tools
- Workflow analysis and pattern recognition
- Team dynamics and communication analysis
- Performance metrics calculation

#### Analytics Engine
- Velocity tracking and trend analysis
- Bottleneck identification
- Team collaboration patterns
- Workload distribution analysis

## Database Models

### User and Authentication Models
```python
class User(Base):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    skills_json: Mapped[Optional[str]] = mapped_column(Text)
    learning_progress_json: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_active: Mapped[Optional[datetime]] = mapped_column(DateTime)

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    token_hash: Mapped[str] = mapped_column(String, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

### MCP Service Models
```python
class MCPService(Base):
    __tablename__ = "mcp_services"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    service_type: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    endpoint: Mapped[str] = mapped_column(String, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    credentials_json: Mapped[str] = mapped_column(Text, nullable=False)
    rate_limits_json: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="disconnected")
    last_connected: Mapped[Optional[datetime]] = mapped_column(DateTime)
    last_error: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

### Project Management Models
```python
class Repository(Base):
    __tablename__ = "repositories"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    last_analyzed: Mapped[Optional[datetime]] = mapped_column(DateTime)
    analysis_status: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CodebaseAnalysis(Base):
    __tablename__ = "codebase_analyses"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    repository_id: Mapped[str] = mapped_column(String, ForeignKey("repositories.id"))
    complexity_score: Mapped[Optional[float]] = mapped_column(Float)
    feature_count: Mapped[Optional[int]] = mapped_column(Integer)
    analysis_data_json: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

## API Endpoints

### Authentication Endpoints
- `POST /api/v1/auth/register`: User registration
- `POST /api/v1/auth/login`: User login
- `POST /api/v1/auth/logout`: User logout
- `GET /api/v1/auth/me`: Get current user profile
- `PUT /api/v1/auth/profile`: Update user profile

### MCP Service Endpoints
- `GET /api/v1/mcp/services`: List all MCP services
- `POST /api/v1/mcp/services`: Create new MCP service
- `GET /api/v1/mcp/services/{id}`: Get specific MCP service
- `PUT /api/v1/mcp/services/{id}`: Update MCP service
- `DELETE /api/v1/mcp/services/{id}`: Delete MCP service
- `POST /api/v1/mcp/services/{id}/connect`: Connect to service
- `POST /api/v1/mcp/services/{id}/disconnect`: Disconnect from service
- `GET /api/v1/mcp/services/{id}/health`: Health check service
- `POST /api/v1/mcp/sync`: Sync all services
- `GET /api/v1/mcp/health`: Health check all services

### Project Management Endpoints
- `GET /api/v1/projects`: List all projects
- `POST /api/v1/projects`: Create new project
- `GET /api/v1/projects/{id}`: Get specific project
- `PUT /api/v1/projects/{id}`: Update project
- `DELETE /api/v1/projects/{id}`: Delete project
- `GET /api/v1/projects/{id}/analysis`: Get project analysis
- `POST /api/v1/projects/{id}/analyze`: Trigger project analysis
- `GET /api/v1/projects/{id}/workflow`: Get workflow analysis
- `GET /api/v1/projects/{id}/team`: Get team insights

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=sqlite+aiosqlite:///./rampforge.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_TITLE=RampForgeAI API
API_VERSION=1.0.0
DEBUG=true

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External Services
VERTEX_AI_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Docker Configuration
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8000

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

## Error Handling

### Exception Hierarchy
```python
class RampForgeException(Exception):
    """Base exception for RampForge application"""
    def __init__(self, message: str, code: str = None):
        self.message = message
        self.code = code
        super().__init__(message)

class AuthenticationError(RampForgeException):
    """Authentication related errors"""
    pass

class MCPServiceError(RampForgeException):
    """MCP service integration errors"""
    pass

class ProjectAnalysisError(RampForgeException):
    """Project analysis errors"""
    pass
```

### Error Response Format
```python
class ErrorResponse(BaseModel):
    error: bool = True
    code: str
    message: str
    details: Optional[Dict] = None
    timestamp: datetime
    request_id: str
```

## Testing

### Unit Testing
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_mcp_service_creation():
    service_data = {
        "service_type": "github",
        "name": "Test GitHub",
        "endpoint": "https://api.github.com",
        "credentials": {"token": "test_token"}
    }
    
    response = client.post("/api/v1/mcp/services", json=service_data)
    assert response.status_code == 201
    assert response.json()["name"] == "Test GitHub"
```

### Integration Testing
```python
@pytest.mark.integration
async def test_github_integration():
    # Test actual GitHub API integration
    mcp_client = GitHubMCPClient()
    result = await mcp_client.fetch_repository_data("owner/repo")
    assert result.status == "success"
    assert len(result.files) > 0
```

## Deployment

### Production Configuration
- Environment-specific settings
- Database connection pooling
- Redis caching layer
- Logging configuration
- Health check endpoints
- Graceful shutdown handling

### Monitoring and Observability
- Structured logging with correlation IDs
- Performance metrics collection
- Error tracking and alerting
- Health check endpoints for load balancers
- Database connection monitoring