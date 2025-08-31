# Backend API Documentation

## API Overview

The RampForgeAI API is built with FastAPI and provides comprehensive endpoints for authentication, MCP service management, project management integration, and AI-powered analysis features.

**Base URL**: `http://localhost:8000`  
**API Version**: v1  
**Documentation**: `http://localhost:8000/api/docs` (Swagger UI)  
**Alternative Docs**: `http://localhost:8000/api/redoc` (ReDoc)

## Authentication

### JWT Token Authentication
All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Token Lifecycle
- **Access Token Expiry**: 30 minutes (configurable)
- **Refresh Strategy**: Client-side token refresh before expiry
- **Session Management**: Database-backed session tracking

## Core API Endpoints

### Health and Status

#### GET /
Root endpoint providing basic API status.

**Response**:
```json
{
  "message": "RampForgeAI API is running"
}
```

#### GET /api/health
Health check endpoint with detailed status information.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "service": "RampForgeAI API"
}
```

#### GET /api/v1/status
Detailed API status with endpoint information.

**Response**:
```json
{
  "api_version": "v1",
  "status": "operational",
  "timestamp": "2024-01-15T10:30:00Z",
  "endpoints": {
    "health": "/api/health",
    "docs": "/api/docs",
    "redoc": "/api/redoc"
  }
}
```

## Authentication Endpoints

### POST /api/v1/auth/register
Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe",
  "role": "developer"
}
```

**Response** (201 Created):
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "developer",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email already exists

### POST /api/v1/auth/login
Authenticate user and receive JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "developer"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Missing required fields

### POST /api/v1/auth/logout
Logout user and invalidate session.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "message": "Successfully logged out"
}
```

### GET /api/v1/auth/me
Get current authenticated user profile.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "developer",
  "skills": ["Python", "JavaScript", "React"],
  "learning_progress": {
    "onboarding": 0.75,
    "project_analysis": 0.5
  },
  "created_at": "2024-01-15T10:30:00Z",
  "last_active": "2024-01-15T15:45:00Z"
}
```

## MCP Service Management

### GET /api/v1/mcp/services
List all configured MCP services for the authenticated user.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `enabled` (optional): Filter by enabled status (true/false)
- `service_type` (optional): Filter by service type

**Response** (200 OK):
```json
[
  {
    "id": "service_123",
    "service_type": "github",
    "name": "My GitHub Integration",
    "endpoint": "https://api.github.com",
    "enabled": true,
    "status": "connected",
    "last_connected": "2024-01-15T14:30:00Z",
    "last_error": null,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
]
```

### POST /api/v1/mcp/services
Create a new MCP service configuration.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "service_type": "github",
  "name": "My GitHub Integration",
  "endpoint": "https://api.github.com",
  "enabled": true,
  "credentials": {
    "token": "ghp_xxxxxxxxxxxxxxxxxxxx"
  },
  "rate_limits": {
    "requests_per_minute": 60,
    "requests_per_hour": 1000
  },
  "timeout": 30,
  "retry_attempts": 3
}
```

**Response** (201 Created):
```json
{
  "id": "service_123",
  "service_type": "github",
  "name": "My GitHub Integration",
  "endpoint": "https://api.github.com",
  "enabled": true,
  "status": "disconnected",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid service configuration
- `409 Conflict`: Service with same name already exists

### GET /api/v1/mcp/services/{service_id}
Get details of a specific MCP service.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "id": "service_123",
  "service_type": "github",
  "name": "My GitHub Integration",
  "endpoint": "https://api.github.com",
  "enabled": true,
  "status": "connected",
  "last_connected": "2024-01-15T14:30:00Z",
  "last_error": null,
  "rate_limits": {
    "requests_per_minute": 60,
    "requests_per_hour": 1000
  },
  "timeout": 30,
  "retry_attempts": 3,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

### PUT /api/v1/mcp/services/{service_id}
Update an existing MCP service configuration.

**Headers**: `Authorization: Bearer <token>`

**Request Body**: Same as POST request

**Response** (200 OK): Updated service object

### DELETE /api/v1/mcp/services/{service_id}
Delete an MCP service configuration.

**Headers**: `Authorization: Bearer <token>`

**Response** (204 No Content)

### POST /api/v1/mcp/services/{service_id}/connect
Connect to an MCP service and test the connection.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "connected",
  "message": "Successfully connected to GitHub API",
  "connection_time": "2024-01-15T14:30:00Z",
  "test_results": {
    "authentication": "success",
    "api_access": "success",
    "rate_limits": {
      "remaining": 4999,
      "reset_time": "2024-01-15T15:00:00Z"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid credentials or configuration
- `503 Service Unavailable`: External service not accessible

### POST /api/v1/mcp/services/{service_id}/disconnect
Disconnect from an MCP service.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "disconnected",
  "message": "Successfully disconnected from service",
  "disconnection_time": "2024-01-15T14:35:00Z"
}
```

### GET /api/v1/mcp/services/{service_id}/health
Perform health check on a specific MCP service.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "service_id": "service_123",
  "status": "healthy",
  "response_time_ms": 245,
  "last_check": "2024-01-15T14:40:00Z",
  "details": {
    "api_status": "operational",
    "rate_limit_status": "normal",
    "authentication": "valid"
  }
}
```

### POST /api/v1/mcp/sync
Synchronize data from all connected MCP services.

**Headers**: `Authorization: Bearer <token>`

**Request Body** (optional):
```json
{
  "service_types": ["github", "jira"],
  "force_refresh": false
}
```

**Response** (200 OK):
```json
{
  "sync_id": "sync_456",
  "status": "completed",
  "total_services": 3,
  "successful_syncs": 2,
  "failed_syncs": 1,
  "sync_results": [
    {
      "service_id": "service_123",
      "service_type": "github",
      "status": "success",
      "records_synced": 150,
      "sync_time": "2024-01-15T14:45:00Z"
    }
  ],
  "started_at": "2024-01-15T14:44:00Z",
  "completed_at": "2024-01-15T14:45:30Z"
}
```

### GET /api/v1/mcp/health
Perform health check on all configured MCP services.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "overall_status": "healthy",
  "total_services": 3,
  "healthy_services": 2,
  "unhealthy_services": 1,
  "health_checks": [
    {
      "service_id": "service_123",
      "service_type": "github",
      "status": "connected",
      "response_time_ms": 245,
      "last_check": "2024-01-15T14:50:00Z"
    }
  ],
  "check_time": "2024-01-15T14:50:00Z"
}
```

## Repository and Analysis Endpoints

### GET /api/v1/repositories
List all repositories accessible to the authenticated user.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `type` (optional): Filter by repository type (github, gitlab, local)
- `status` (optional): Filter by analysis status
- `limit` (optional): Number of results to return (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**Response** (200 OK):
```json
[
  {
    "id": "repo_123",
    "name": "RampForgeAI",
    "url": "https://github.com/company/rampforge",
    "type": "github",
    "last_analyzed": "2024-01-15T12:00:00Z",
    "analysis_status": "completed",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### POST /api/v1/repositories
Add a new repository for analysis.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "My Repository",
  "url": "https://github.com/user/repo",
  "type": "github"
}
```

**Response** (201 Created): Repository object

### GET /api/v1/repositories/{repository_id}/analysis
Get analysis results for a specific repository.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "id": "analysis_123",
  "repository_id": "repo_123",
  "complexity_score": 7.5,
  "feature_count": 23,
  "architecture": {
    "components": [
      {
        "name": "Frontend",
        "type": "nextjs",
        "complexity": 6.2,
        "files": 45,
        "dependencies": ["Backend API", "Authentication"]
      }
    ],
    "dependencies": [
      {
        "from": "Frontend",
        "to": "Backend API",
        "type": "http_api"
      }
    ]
  },
  "features": [
    {
      "name": "User Authentication",
      "description": "JWT-based authentication system",
      "files": ["auth.py", "AuthProvider.tsx"],
      "complexity": 5,
      "test_coverage": 0.9
    }
  ],
  "patterns": [
    {
      "name": "Repository Pattern",
      "occurrences": 8,
      "confidence": 0.95
    }
  ],
  "recommendations": [
    {
      "type": "refactoring",
      "priority": "medium",
      "description": "Consider extracting common validation logic",
      "affected_files": ["validation.py", "forms.py"]
    }
  ],
  "created_at": "2024-01-15T12:00:00Z"
}
```

### POST /api/v1/repositories/{repository_id}/analyze
Trigger a new analysis for a repository.

**Headers**: `Authorization: Bearer <token>`

**Request Body** (optional):
```json
{
  "force_refresh": false,
  "analysis_type": "full",
  "include_dependencies": true
}
```

**Response** (202 Accepted):
```json
{
  "analysis_id": "analysis_456",
  "status": "queued",
  "estimated_completion": "2024-01-15T15:30:00Z",
  "message": "Analysis has been queued and will begin shortly"
}
```

## Project Management Endpoints

### GET /api/v1/projects
List all projects accessible to the authenticated user.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `status` (optional): Filter by project status
- `limit` (optional): Number of results to return (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**Response** (200 OK):
```json
{
  "projects": [
    {
      "id": "project_123",
      "name": "RampForgeAI Platform",
      "description": "AI-powered developer onboarding platform",
      "status": "active",
      "repository_url": "https://github.com/company/rampforge",
      "pm_tool": "jira",
      "pm_project_key": "RAMP",
      "team_size": 8,
      "last_analyzed": "2024-01-15T12:00:00Z",
      "complexity_score": 7.5,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T12:00:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### POST /api/v1/projects
Create a new project configuration.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "New Project",
  "description": "Project description",
  "repository_url": "https://github.com/company/new-project",
  "pm_tool": "jira",
  "pm_project_key": "NEW",
  "team_members": ["user1@example.com", "user2@example.com"]
}
```

**Response** (201 Created): Project object

### GET /api/v1/projects/{project_id}
Get detailed information about a specific project.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "id": "project_123",
  "name": "RampForgeAI Platform",
  "description": "AI-powered developer onboarding platform",
  "status": "active",
  "repository": {
    "url": "https://github.com/company/rampforge",
    "type": "github",
    "last_analyzed": "2024-01-15T12:00:00Z",
    "analysis_status": "completed"
  },
  "project_management": {
    "tool": "jira",
    "project_key": "RAMP",
    "workspace_url": "https://company.atlassian.net",
    "last_synced": "2024-01-15T14:00:00Z"
  },
  "team": {
    "size": 8,
    "members": [
      {
        "email": "dev1@company.com",
        "name": "Developer One",
        "role": "senior_developer"
      }
    ],
    "velocity": {
      "current_sprint": 45,
      "average": 42,
      "trend": "increasing"
    }
  },
  "metrics": {
    "complexity_score": 7.5,
    "feature_count": 23,
    "technical_debt_ratio": 0.15,
    "test_coverage": 0.85
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

### GET /api/v1/projects/{project_id}/analysis
Get codebase analysis results for a project.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "project_id": "project_123",
  "analysis_id": "analysis_456",
  "status": "completed",
  "complexity_score": 7.5,
  "architecture": {
    "components": [
      {
        "name": "Frontend",
        "type": "nextjs",
        "complexity": 6.2,
        "files": 45,
        "dependencies": ["Backend API", "Authentication"]
      }
    ],
    "dependencies": [
      {
        "from": "Frontend",
        "to": "Backend API",
        "type": "http_api"
      }
    ]
  },
  "features": [
    {
      "name": "User Authentication",
      "description": "JWT-based authentication system",
      "files": ["auth.py", "AuthProvider.tsx"],
      "complexity": 5,
      "test_coverage": 0.9
    }
  ],
  "patterns": [
    {
      "name": "Repository Pattern",
      "occurrences": 8,
      "confidence": 0.95
    }
  ],
  "recommendations": [
    {
      "type": "refactoring",
      "priority": "medium",
      "description": "Consider extracting common validation logic",
      "affected_files": ["validation.py", "forms.py"]
    }
  ],
  "created_at": "2024-01-15T12:00:00Z",
  "updated_at": "2024-01-15T12:30:00Z"
}
```

### POST /api/v1/projects/{project_id}/analyze
Trigger a new codebase analysis for a project.

**Headers**: `Authorization: Bearer <token>`

**Request Body** (optional):
```json
{
  "force_refresh": false,
  "analysis_type": "full",
  "include_dependencies": true
}
```

**Response** (202 Accepted):
```json
{
  "analysis_id": "analysis_789",
  "status": "queued",
  "estimated_completion": "2024-01-15T15:30:00Z",
  "message": "Analysis has been queued and will begin shortly"
}
```

### GET /api/v1/projects/{project_id}/workflow
Get workflow analysis for a project.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "project_id": "project_123",
  "workflow_analysis": {
    "process_mining": {
      "common_workflows": [
        {
          "name": "Feature Development",
          "frequency": 0.85,
          "average_duration": "5.2 days",
          "steps": [
            "Issue Creation",
            "Development",
            "Code Review",
            "Testing",
            "Deployment"
          ]
        }
      ],
      "bottlenecks": [
        {
          "step": "Code Review",
          "average_wait_time": "1.5 days",
          "impact": "high"
        }
      ]
    },
    "team_collaboration": {
      "communication_patterns": [
        {
          "type": "code_review_discussions",
          "frequency": "high",
          "effectiveness": 0.8
        }
      ],
      "knowledge_sharing": {
        "documentation_coverage": 0.7,
        "code_comments_ratio": 0.6
      }
    },
    "performance_metrics": {
      "velocity_trend": "stable",
      "cycle_time": "6.8 days",
      "lead_time": "8.2 days",
      "deployment_frequency": "2.3 per week"
    }
  },
  "generated_at": "2024-01-15T14:00:00Z"
}
```

### GET /api/v1/projects/{project_id}/team
Get team insights and analytics for a project.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "project_id": "project_123",
  "team_insights": {
    "members": [
      {
        "id": "member_123",
        "name": "John Doe",
        "email": "john@company.com",
        "role": "senior_developer",
        "skills": ["Python", "React", "AWS"],
        "workload": {
          "current_tasks": 3,
          "capacity_utilization": 0.85,
          "burnout_risk": "low"
        },
        "performance": {
          "velocity": 12,
          "quality_score": 0.92,
          "collaboration_score": 0.88
        }
      }
    ],
    "team_dynamics": {
      "collaboration_index": 0.85,
      "knowledge_distribution": 0.7,
      "communication_effectiveness": 0.8
    },
    "skill_matrix": {
      "frontend": {
        "coverage": 0.9,
        "depth": "high",
        "experts": ["john@company.com"]
      },
      "backend": {
        "coverage": 0.8,
        "depth": "medium",
        "experts": ["jane@company.com"]
      }
    },
    "recommendations": [
      {
        "type": "skill_development",
        "priority": "medium",
        "description": "Consider cross-training in DevOps practices",
        "affected_members": ["john@company.com"]
      }
    ]
  },
  "generated_at": "2024-01-15T14:00:00Z"
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Invalid input data provided",
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  },
  "timestamp": "2024-01-15T14:00:00Z",
  "request_id": "req_123456"
}
```

### Common HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `202 Accepted`: Request accepted for processing
- `204 No Content`: Successful request with no response body
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: External service unavailable

### Error Codes
- `AUTHENTICATION_ERROR`: Authentication failures
- `AUTHORIZATION_ERROR`: Permission denied
- `VALIDATION_ERROR`: Input validation failures
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `RESOURCE_CONFLICT`: Resource already exists
- `MCP_SERVICE_ERROR`: MCP integration failures
- `ANALYSIS_ERROR`: Code analysis failures
- `EXTERNAL_SERVICE_ERROR`: External API failures

## Rate Limiting

### Default Limits
- **Authenticated requests**: 1000 requests per hour
- **Authentication endpoints**: 10 requests per minute
- **Analysis endpoints**: 5 requests per minute
- **Bulk operations**: 2 requests per minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## Pagination

### Query Parameters
- `limit`: Number of items to return (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

### Response Format
```json
{
  "items": [...],
  "total": 150,
  "limit": 50,
  "offset": 0,
  "has_more": true
}
```