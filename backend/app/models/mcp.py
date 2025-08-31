"""
MCP (Model Context Protocol) data models and schemas.
"""
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer
from sqlalchemy.ext.declarative import declarative_base

from .database import Base


class MCPServiceType(str, Enum):
    """Supported MCP service types."""
    GITHUB = "github"
    GITLAB = "gitlab"
    JIRA = "jira"
    AZURE_DEVOPS = "azure_devops"
    CONFLUENCE = "confluence"


class MCPConnectionStatus(str, Enum):
    """MCP connection status."""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    ERROR = "error"


class MCPConfig(BaseModel):
    """MCP service configuration model."""
    service_type: MCPServiceType
    name: str = Field(..., description="Human-readable name for the service")
    endpoint: str = Field(..., description="Service API endpoint URL")
    credentials: Dict[str, str] = Field(default_factory=dict, description="Service credentials")
    enabled: bool = Field(default=True, description="Whether the service is enabled")
    rate_limits: Dict[str, int] = Field(default_factory=dict, description="Rate limiting configuration")
    timeout: int = Field(default=30, description="Request timeout in seconds")
    retry_attempts: int = Field(default=3, description="Number of retry attempts")
    
    class Config:
        json_encoders = {
            MCPServiceType: lambda v: v.value
        }


class MCPService(Base):
    """Database model for MCP service configurations."""
    __tablename__ = "mcp_services"
    
    id = Column(String, primary_key=True)
    service_type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    endpoint = Column(String, nullable=False)
    credentials_json = Column(Text, nullable=False)  # Encrypted JSON
    enabled = Column(Boolean, default=True)
    rate_limits_json = Column(Text, nullable=True)
    timeout = Column(Integer, default=30)
    retry_attempts = Column(Integer, default=3)
    status = Column(String, default=MCPConnectionStatus.DISCONNECTED.value)
    last_connected = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RepositoryData(BaseModel):
    """Repository data fetched from MCP services."""
    id: str
    name: str
    full_name: str
    url: str
    description: Optional[str] = None
    language: Optional[str] = None
    default_branch: str = "main"
    is_private: bool = False
    created_at: datetime
    updated_at: datetime
    size: int = 0
    stars: int = 0
    forks: int = 0
    topics: List[str] = Field(default_factory=list)


class ProjectData(BaseModel):
    """Project management data from MCP services."""
    id: str
    name: str
    key: str
    description: Optional[str] = None
    url: str
    project_type: str  # jira, azure_devops
    status: str
    created_at: datetime
    updated_at: datetime
    members: List[Dict[str, Any]] = Field(default_factory=list)
    workflows: List[Dict[str, Any]] = Field(default_factory=list)


class SyncResult(BaseModel):
    """Result of MCP data synchronization."""
    service_id: str
    service_type: MCPServiceType
    status: str  # success, partial, failed
    synced_at: datetime
    repositories_synced: int = 0
    projects_synced: int = 0
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class MCPHealthCheck(BaseModel):
    """MCP service health check result."""
    service_id: str
    service_type: MCPServiceType
    status: MCPConnectionStatus
    response_time_ms: Optional[int] = None
    error_message: Optional[str] = None
    checked_at: datetime