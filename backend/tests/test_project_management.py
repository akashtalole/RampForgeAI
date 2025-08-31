"""
Tests for project management integration and data synchronization.
"""
import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.project_management import (
    ProjectManagementProject, WorkItem, TeamMember, Workflow, ProjectAnalytics
)
from app.models.mcp import MCPService, MCPServiceType, MCPConnectionStatus
from app.services.project_management import ProjectManagementService
from app.services.mcp_jira import JiraMCPClient
from app.services.mcp_client import mcp_manager


@pytest.fixture
async def mock_mcp_service(db_session: AsyncSession):
    """Create a mock MCP service for testing."""
    service = MCPService(
        id=str(uuid4()),
        service_type=MCPServiceType.JIRA.value,
        name="Test Jira",
        endpoint="https://test.atlassian.net",
        credentials_json=json.dumps({
            "username": "test@example.com",
            "api_token": "test_token"
        }),
        enabled=True,
        status=MCPConnectionStatus.CONNECTED.value
    )
    db_session.add(service)
    await db_session.commit()
    await db_session.refresh(service)
    return service


@pytest.fixture
def mock_project_data():
    """Mock project data from MCP service."""
    return MagicMock(
        id="TEST-123",
        name="Test Project",
        key="TEST",
        description="A test project",
        url="https://test.atlassian.net/projects/TEST",
        project_type="jira",
        status="active",
        members=[
            {
                "accountId": "user1",
                "displayName": "John Doe",
                "emailAddress": "john@example.com",
                "role": "Developer"
            },
            {
                "accountId": "user2", 
                "displayName": "Jane Smith",
                "emailAddress": "jane@example.com",
                "role": "Product Manager"
            }
        ],
        workflows=[
            {"name": "To Do", "id": "1", "category": "new"},
            {"name": "In Progress", "id": "2", "category": "indeterminate"},
            {"name": "Done", "id": "3", "category": "done"}
        ]
    )


@pytest.fixture
def mock_work_items():
    """Mock work items data."""
    return [
        {
            "id": "TEST-1",
            "title": "Implement user authentication",
            "description": "Add login and registration functionality",
            "type": "Story",
            "status": "In Progress",
            "priority": "High",
            "assignee": "John Doe",
            "reporter": "Jane Smith",
            "story_points": 8,
            "labels": ["backend", "security"],
            "url": "https://test.atlassian.net/browse/TEST-1",
            "resolved_at": None
        },
        {
            "id": "TEST-2", 
            "title": "Fix login bug",
            "description": "Users cannot login with special characters",
            "type": "Bug",
            "status": "Done",
            "priority": "Critical",
            "assignee": "John Doe",
            "reporter": "Jane Smith", 
            "story_points": 3,
            "labels": ["frontend", "bug"],
            "url": "https://test.atlassian.net/browse/TEST-2",
            "resolved_at": datetime.utcnow() - timedelta(days=2)
        }
    ]


class TestProjectManagementService:
    """Test cases for ProjectManagementService."""

    @pytest.mark.asyncio
    async def test_sync_project_data_success(self, db_session: AsyncSession, mock_mcp_service, mock_project_data, mock_work_items):
        """Test successful project data synchronization."""
        service = ProjectManagementService(db_session)
        
        # Mock MCP client
        mock_client = AsyncMock()
        mock_client.fetch_project_data.return_value = mock_project_data
        mock_client.fetch_work_items.return_value = mock_work_items
        
        with patch.object(mcp_manager, 'get_client', return_value=mock_client):
            sync_status = await service.sync_project_data(mock_mcp_service.id, "TEST")
            
            assert sync_status.sync_status == "success"
            assert sync_status.service_id == mock_mcp_service.id
            assert sync_status.work_items_synced == 2
            assert sync_status.team_members_synced == 2
            assert sync_status.workflows_synced == 3

    @pytest.mark.asyncio
    async def test_sync_project_data_creates_new_project(self, db_session: AsyncSession, mock_mcp_service, mock_project_data):
        """Test that sync creates a new project when it doesn't exist."""
        service = ProjectManagementService(db_session)
        
        mock_client = AsyncMock()
        mock_client.fetch_project_data.return_value = mock_project_data
        mock_client.fetch_work_items.return_value = []
        
        with patch.object(mcp_manager, 'get_client', return_value=mock_client):
            await service.sync_project_data(mock_mcp_service.id, "TEST")
            
            # Verify project was created
            result = await db_session.execute(
                select(ProjectManagementProject).where(
                    ProjectManagementProject.external_id == "TEST-123"
                )
            )
            project = result.scalar_one_or_none()
            
            assert project is not None
            assert project.name == "Test Project"
            assert project.key == "TEST"
            assert project.project_type == "jira"

    @pytest.mark.asyncio
    async def test_get_project_overview(self, db_session: AsyncSession, mock_mcp_service):
        """Test getting project overview with all related data."""
        service = ProjectManagementService(db_session)
        
        # Create test project
        project = ProjectManagementProject(
            id=str(uuid4()),
            external_id="TEST-123",
            service_id=mock_mcp_service.id,
            name="Test Project",
            key="TEST",
            description="Test description",
            project_type="jira",
            status="active",
            url="https://test.atlassian.net/projects/TEST"
        )
        db_session.add(project)
        await db_session.commit()
        
        # Add analytics
        analytics = ProjectAnalytics(
            id=str(uuid4()),
            project_id=project.id,
            total_work_items=10,
            completed_work_items=6,
            in_progress_work_items=3,
            backlog_work_items=1,
            active_team_members=5
        )
        db_session.add(analytics)
        await db_session.commit()
        
        # Get overview
        overview = await service.get_project_overview(project.id)
        
        assert overview is not None
        assert overview.name == "Test Project"
        assert overview.key == "TEST"
        assert overview.total_work_items == 10
        assert overview.completed_work_items == 6
        assert overview.active_team_members == 5


class TestJiraMCPClient:
    """Test cases for Jira MCP client."""

    @pytest.fixture
    def jira_config(self):
        """Jira MCP configuration for testing."""
        from app.models.mcp import MCPConfig
        return MCPConfig(
            name="test-jira",
            service_type="jira",
            endpoint="https://test.atlassian.net",
            credentials={
                "username": "test@example.com",
                "api_token": "test_token"
            },
            enabled=True
        )

    def test_jira_client_initialization(self, jira_config):
        """Test Jira client initialization."""
        client = JiraMCPClient(jira_config)
        
        assert client.service_type == "jira"
        assert client.username == "test@example.com"
        assert client.api_token == "test_token"
        assert "https://test.atlassian.net/rest/api/3" in client.api_base

    def test_jira_auth_headers(self, jira_config):
        """Test Jira authentication header generation."""
        client = JiraMCPClient(jira_config)
        headers = client._get_auth_headers()
        
        assert "Authorization" in headers
        assert headers["Authorization"].startswith("Basic ")
        assert headers["Accept"] == "application/json"
        assert headers["Content-Type"] == "application/json"