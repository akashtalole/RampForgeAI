"""
Project Management data models for storing PM integration data.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field

from .database import Base


class ProjectManagementProject(Base):
    """Database model for project management projects."""
    __tablename__ = "pm_projects"
    
    id = Column(String, primary_key=True)
    external_id = Column(String, nullable=False)  # ID from external PM system
    service_id = Column(String, ForeignKey("mcp_services.id"), nullable=False)
    name = Column(String, nullable=False)
    key = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    project_type = Column(String, nullable=False)  # jira, azure_devops
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_synced = Column(DateTime, nullable=True)
    
    # Relationships
    work_items = relationship("WorkItem", back_populates="project", cascade="all, delete-orphan")
    team_members = relationship("TeamMember", back_populates="project", cascade="all, delete-orphan")
    workflows = relationship("Workflow", back_populates="project", cascade="all, delete-orphan")


class WorkItem(Base):
    """Database model for work items (tickets, issues, user stories)."""
    __tablename__ = "work_items"
    
    id = Column(String, primary_key=True)
    external_id = Column(String, nullable=False)
    project_id = Column(String, ForeignKey("pm_projects.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    item_type = Column(String, nullable=False)  # story, bug, task, epic
    status = Column(String, nullable=False)
    priority = Column(String, nullable=True)
    assignee = Column(String, nullable=True)
    reporter = Column(String, nullable=True)
    story_points = Column(Float, nullable=True)
    labels_json = Column(Text, nullable=True)  # JSON array of labels
    url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    project = relationship("ProjectManagementProject", back_populates="work_items")


class TeamMember(Base):
    """Database model for project team members."""
    __tablename__ = "team_members"
    
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("pm_projects.id"), nullable=False)
    external_id = Column(String, nullable=False)  # User ID from external system
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    role = Column(String, nullable=True)
    team = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("ProjectManagementProject", back_populates="team_members")


class Workflow(Base):
    """Database model for project workflows and statuses."""
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("pm_projects.id"), nullable=False)
    name = Column(String, nullable=False)
    external_id = Column(String, nullable=True)
    category = Column(String, nullable=True)  # to do, in progress, done
    order_index = Column(Integer, nullable=True)
    is_initial = Column(Boolean, default=False)
    is_final = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("ProjectManagementProject", back_populates="workflows")


class ProjectAnalytics(Base):
    """Database model for project analytics and insights."""
    __tablename__ = "project_analytics"
    
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("pm_projects.id"), nullable=False)
    analysis_date = Column(DateTime, default=datetime.utcnow)
    
    # Metrics
    total_work_items = Column(Integer, default=0)
    completed_work_items = Column(Integer, default=0)
    in_progress_work_items = Column(Integer, default=0)
    backlog_work_items = Column(Integer, default=0)
    
    # Team metrics
    active_team_members = Column(Integer, default=0)
    avg_completion_time_days = Column(Float, nullable=True)
    velocity_story_points = Column(Float, nullable=True)
    
    # Communication patterns (JSON)
    communication_patterns_json = Column(Text, nullable=True)
    workflow_patterns_json = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


# Pydantic models for API responses
class ProjectOverviewResponse(BaseModel):
    """Project overview response model."""
    id: str
    name: str
    key: str
    description: Optional[str]
    project_type: str
    status: str
    url: Optional[str]
    last_synced: Optional[datetime]
    
    # Current status
    total_work_items: int
    completed_work_items: int
    in_progress_work_items: int
    backlog_work_items: int
    
    # Team info
    active_team_members: int
    team_members: List[Dict[str, Any]]
    
    # Workflows
    workflows: List[Dict[str, Any]]
    
    # Recent activity
    recent_work_items: List[Dict[str, Any]]


class WorkItemResponse(BaseModel):
    """Work item response model."""
    id: str
    external_id: str
    title: str
    description: Optional[str]
    item_type: str
    status: str
    priority: Optional[str]
    assignee: Optional[str]
    reporter: Optional[str]
    story_points: Optional[float]
    labels: List[str] = Field(default_factory=list)
    url: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]


class TeamMemberResponse(BaseModel):
    """Team member response model."""
    id: str
    external_id: str
    name: str
    email: Optional[str]
    role: Optional[str]
    team: Optional[str]
    is_active: bool


class ProjectAnalyticsResponse(BaseModel):
    """Project analytics response model."""
    project_id: str
    analysis_date: datetime
    
    # Work item metrics
    total_work_items: int
    completed_work_items: int
    in_progress_work_items: int
    backlog_work_items: int
    completion_rate: float
    
    # Team metrics
    active_team_members: int
    avg_completion_time_days: Optional[float]
    velocity_story_points: Optional[float]
    
    # Patterns
    communication_patterns: Dict[str, Any] = Field(default_factory=dict)
    workflow_patterns: Dict[str, Any] = Field(default_factory=dict)


class ProjectSyncStatus(BaseModel):
    """Project synchronization status."""
    project_id: str
    service_id: str
    last_synced: Optional[datetime]
    sync_status: str  # success, error, in_progress
    work_items_synced: int
    team_members_synced: int
    workflows_synced: int
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)