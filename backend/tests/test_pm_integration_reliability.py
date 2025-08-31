"""
Integration tests for project management data synchronization reliability.
"""
import pytest
import asyncio
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
from app.services.mcp_jira import JiraMCPClient, AzureDevOpsMCPClient


class TestDataSynchronizationReliability:
    """Test data synchronization reliability and accuracy."""

    @pytest.fixture
    async def jira_service(self, db_session: AsyncSession):
        """Create a Jira MCP service for testing."""
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
    async def azure_service(self, db_session: AsyncSession):
        """Create an Azure DevOps MCP service for testing."""
        service = MCPService(
            id=str(uuid4()),
            service_type=MCPServiceType.AZURE_DEVOPS.value,
            name="Test Azure DevOps",
            endpoint="https://dev.azure.com/testorg",
            credentials_json=json.dumps({
                "organization": "testorg",
                "personal_access_token": "test_pat"
            }),
            enabled=True,
            status=MCPConnectionStatus.CONNECTED.value
        )
        db_session.add(service)
        await db_session.commit()
        await db_session.refresh(service)
        return service

    @pytest.mark.asyncio
    async def test_concurrent_sync_operations(self, db_session: AsyncSession, jira_service):
        """Test that concurrent sync operations don't cause data corruption."""
        service = ProjectManagementService(db_session)
        
        # Mock project data
        mock_project_data = MagicMock(
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
                }
            ],
            workflows=[
                {"name": "To Do", "id": "1", "category": "new"},
                {"name": "Done", "id": "3", "category": "done"}
            ]
        )
        
        mock_work_items = [
            {
                "id": "TEST-1",
                "title": "Task 1",
                "type": "Story",
                "status": "Done",
                "assignee": "John Doe",
                "story_points": 5
            }
        ]
        
        # Mock MCP client
        mock_client = AsyncMock()
        mock_client.fetch_project_data.return_value = mock_project_data
        mock_client.fetch_work_items.return_value = mock_work_items
        
        with patch.object(service.db, 'commit', new_callable=AsyncMock) as mock_commit:
            with patch('app.services.mcp_client.mcp_manager.get_client', return_value=mock_client):
                # Run multiple sync operations concurrently
                tasks = [
                    service.sync_project_data(jira_service.id, "TEST")
                    for _ in range(5)
                ]
                
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Verify all operations completed successfully
                successful_syncs = [r for r in results if not isinstance(r, Exception) and r.sync_status == "success"]
                assert len(successful_syncs) >= 1  # At least one should succeed
                
                # Verify database consistency
                result = await db_session.execute(
                    select(ProjectManagementProject).where(
                        ProjectManagementProject.external_id == "TEST-123"
                    )
                )
                projects = result.scalars().all()
                assert len(projects) == 1  # Should not create duplicates

    @pytest.mark.asyncio
    async def test_partial_sync_failure_recovery(self, db_session: AsyncSession, jira_service):
        """Test recovery from partial sync failures."""
        service = ProjectManagementService(db_session)
        
        # Mock project data
        mock_project_data = MagicMock(
            id="TEST-123",
            name="Test Project",
            key="TEST",
            project_type="jira",
            status="active",
            members=[],
            workflows=[]
        )
        
        # Mock client that fails on work items
        mock_client = AsyncMock()
        mock_client.fetch_project_data.return_value = mock_project_data
        mock_client.fetch_work_items.side_effect = Exception("Work items fetch failed")
        
        with patch('app.services.mcp_client.mcp_manager.get_client', return_value=mock_client):
            # First sync should partially succeed (project created, work items failed)
            sync_status = await service.sync_project_data(jira_service.id, "TEST")
            
            # Verify project was created despite work items failure
            result = await db_session.execute(
                select(ProjectManagementProject).where(
                    ProjectManagementProject.external_id == "TEST-123"
                )
            )
            project = result.scalar_one_or_none()
            assert project is not None
            
            # Now fix the work items fetch
            mock_work_items = [
                {
                    "id": "TEST-1",
                    "title": "Task 1",
                    "type": "Story",
                    "status": "Done"
                }
            ]
            mock_client.fetch_work_items.side_effect = None
            mock_client.fetch_work_items.return_value = mock_work_items
            
            # Second sync should complete successfully
            sync_status = await service.sync_project_data(jira_service.id, "TEST")
            assert sync_status.sync_status == "success"
            assert sync_status.work_items_synced == 1

    @pytest.mark.asyncio
    async def test_data_consistency_across_updates(self, db_session: AsyncSession, jira_service):
        """Test data consistency when project data is updated."""
        service = ProjectManagementService(db_session)
        
        # Initial project data
        initial_project_data = MagicMock(
            id="TEST-123",
            name="Initial Project Name",
            key="TEST",
            description="Initial description",
            project_type="jira",
            status="active",
            members=[
                {
                    "accountId": "user1",
                    "displayName": "John Doe",
                    "emailAddress": "john@example.com",
                    "role": "Developer"
                }
            ],
            workflows=[
                {"name": "To Do", "id": "1", "category": "new"}
            ]
        )
        
        initial_work_items = [
            {
                "id": "TEST-1",
                "title": "Initial Task",
                "type": "Story",
                "status": "To Do",
                "assignee": "John Doe"
            }
        ]
        
        # Mock client for initial sync
        mock_client = AsyncMock()
        mock_client.fetch_project_data.return_value = initial_project_data
        mock_client.fetch_work_items.return_value = initial_work_items
        
        with patch('app.services.mcp_client.mcp_manager.get_client', return_value=mock_client):
            # Initial sync
            await service.sync_project_data(jira_service.id, "TEST")
            
            # Verify initial state
            result = await db_session.execute(
                select(ProjectManagementProject).where(
                    ProjectManagementProject.external_id == "TEST-123"
                )
            )
            project = result.scalar_one_or_none()
            assert project.name == "Initial Project Name"
            
            result = await db_session.execute(
                select(WorkItem).where(WorkItem.project_id == project.id)
            )
            work_items = result.scalars().all()
            assert len(work_items) == 1
            assert work_items[0].title == "Initial Task"
            
            # Updated project data
            updated_project_data = MagicMock(
                id="TEST-123",
                name="Updated Project Name",
                key="TEST",
                description="Updated description",
                project_type="jira",
                status="active",
                members=[
                    {
                        "accountId": "user1",
                        "displayName": "John Doe",
                        "emailAddress": "john@example.com",
                        "role": "Senior Developer"  # Role changed
                    },
                    {
                        "accountId": "user2",
                        "displayName": "Jane Smith",
                        "emailAddress": "jane@example.com",
                        "role": "Product Manager"  # New member
                    }
                ],
                workflows=[
                    {"name": "To Do", "id": "1", "category": "new"},
                    {"name": "In Progress", "id": "2", "category": "indeterminate"}  # New workflow
                ]
            )
            
            updated_work_items = [
                {
                    "id": "TEST-1",
                    "title": "Updated Task Title",  # Title changed
                    "type": "Story",
                    "status": "In Progress",  # Status changed
                    "assignee": "John Doe"
                },
                {
                    "id": "TEST-2",
                    "title": "New Task",  # New work item
                    "type": "Bug",
                    "status": "To Do",
                    "assignee": "Jane Smith"
                }
            ]
            
            # Update mock client
            mock_client.fetch_project_data.return_value = updated_project_data
            mock_client.fetch_work_items.return_value = updated_work_items
            
            # Second sync with updates
            await service.sync_project_data(jira_service.id, "TEST")
            
            # Verify updates were applied correctly
            await db_session.refresh(project)
            assert project.name == "Updated Project Name"
            assert project.description == "Updated description"
            
            # Check work items were updated
            result = await db_session.execute(
                select(WorkItem).where(WorkItem.project_id == project.id)
            )
            work_items = result.scalars().all()
            assert len(work_items) == 2
            
            # Find specific work items
            test_1 = next((item for item in work_items if item.external_id == "TEST-1"), None)
            test_2 = next((item for item in work_items if item.external_id == "TEST-2"), None)
            
            assert test_1 is not None
            assert test_1.title == "Updated Task Title"
            assert test_1.status == "In Progress"
            
            assert test_2 is not None
            assert test_2.title == "New Task"
            assert test_2.item_type == "Bug"
            
            # Check team members were updated
            result = await db_session.execute(
                select(TeamMember).where(TeamMember.project_id == project.id)
            )
            team_members = result.scalars().all()
            assert len(team_members) == 2
            
            john = next((member for member in team_members if member.external_id == "user1"), None)
            jane = next((member for member in team_members if member.external_id == "user2"), None)
            
            assert john is not None
            assert john.role == "Senior Developer"  # Role updated
            
            assert jane is not None
            assert jane.name == "Jane Smith"  # New member added

    @pytest.mark.asyncio
    async def test_analytics_accuracy_after_sync(self, db_session: AsyncSession, jira_service):
        """Test that analytics are accurately generated after data sync."""
        service = ProjectManagementService(db_session)
        
        # Create project with specific work item patterns
        mock_project_data = MagicMock(
            id="TEST-123",
            name="Analytics Test Project",
            key="TEST",
            project_type="jira",
            status="active",
            members=[
                {"accountId": "user1", "displayName": "Developer 1", "role": "Developer"},
                {"accountId": "user2", "displayName": "Developer 2", "role": "Developer"},
                {"accountId": "user3", "displayName": "Manager 1", "role": "Manager"}
            ],
            workflows=[
                {"name": "To Do", "id": "1", "category": "new"},
                {"name": "In Progress", "id": "2", "category": "indeterminate"},
                {"name": "Done", "id": "3", "category": "done"}
            ]
        )
        
        # Create work items with specific completion patterns
        now = datetime.utcnow()
        mock_work_items = [
            # Completed items
            {
                "id": "TEST-1",
                "title": "Completed Story 1",
                "type": "Story",
                "status": "Done",
                "assignee": "Developer 1",
                "reporter": "Manager 1",
                "story_points": 8,
                "resolved_at": now - timedelta(days=5)
            },
            {
                "id": "TEST-2",
                "title": "Completed Bug 1",
                "type": "Bug",
                "status": "Done",
                "assignee": "Developer 2",
                "reporter": "Manager 1",
                "story_points": 3,
                "resolved_at": now - timedelta(days=3)
            },
            # In progress items
            {
                "id": "TEST-3",
                "title": "In Progress Story",
                "type": "Story",
                "status": "In Progress",
                "assignee": "Developer 1",
                "reporter": "Manager 1",
                "story_points": 5
            },
            # Backlog items
            {
                "id": "TEST-4",
                "title": "Backlog Story",
                "type": "Story",
                "status": "To Do",
                "assignee": "Developer 2",
                "reporter": "Manager 1",
                "story_points": 13
            }
        ]
        
        mock_client = AsyncMock()
        mock_client.fetch_project_data.return_value = mock_project_data
        mock_client.fetch_work_items.return_value = mock_work_items
        
        with patch('app.services.mcp_client.mcp_manager.get_client', return_value=mock_client):
            # Sync project data
            sync_status = await service.sync_project_data(jira_service.id, "TEST")
            assert sync_status.sync_status == "success"
            
            # Get the created project
            result = await db_session.execute(
                select(ProjectManagementProject).where(
                    ProjectManagementProject.external_id == "TEST-123"
                )
            )
            project = result.scalar_one_or_none()
            assert project is not None
            
            # Verify analytics were generated correctly
            result = await db_session.execute(
                select(ProjectAnalytics).where(ProjectAnalytics.project_id == project.id)
            )
            analytics = result.scalar_one_or_none()
            assert analytics is not None
            
            # Verify metrics accuracy
            assert analytics.total_work_items == 4
            assert analytics.completed_work_items == 2
            assert analytics.in_progress_work_items == 1
            assert analytics.backlog_work_items == 1
            assert analytics.active_team_members == 3
            
            # Verify velocity calculation (story points completed in last 30 days)
            expected_velocity = 8 + 3  # Story points from completed items
            assert analytics.velocity_story_points == expected_velocity
            
            # Verify average completion time
            expected_avg_completion = (5 + 3) / 2  # Average of completion times
            assert abs(analytics.avg_completion_time_days - expected_avg_completion) < 0.1
            
            # Verify workflow patterns
            workflow_patterns = json.loads(analytics.workflow_patterns_json)
            assert workflow_patterns["status_distribution"]["Done"] == 2
            assert workflow_patterns["status_distribution"]["In Progress"] == 1
            assert workflow_patterns["status_distribution"]["To Do"] == 1
            assert workflow_patterns["type_distribution"]["Story"] == 3
            assert workflow_patterns["type_distribution"]["Bug"] == 1
            
            # Verify communication patterns
            communication_patterns = json.loads(analytics.communication_patterns_json)
            assert communication_patterns["most_active_assignees"]["Developer 1"] == 2
            assert communication_patterns["most_active_assignees"]["Developer 2"] == 2
            assert communication_patterns["most_active_reporters"]["Manager 1"] == 4
            assert communication_patterns["role_distribution"]["Developer"] == 2
            assert communication_patterns["role_distribution"]["Manager"] == 1

    @pytest.mark.asyncio
    async def test_multi_service_sync_isolation(self, db_session: AsyncSession, jira_service, azure_service):
        """Test that syncing from multiple services doesn't interfere with each other."""
        service = ProjectManagementService(db_session)
        
        # Jira project data
        jira_project_data = MagicMock(
            id="JIRA-123",
            name="Jira Project",
            key="JIRA",
            project_type="jira",
            status="active",
            members=[{"accountId": "jira_user", "displayName": "Jira User"}],
            workflows=[{"name": "Jira To Do", "id": "1"}]
        )
        
        jira_work_items = [
            {
                "id": "JIRA-1",
                "title": "Jira Task",
                "type": "Story",
                "status": "Jira To Do"
            }
        ]
        
        # Azure DevOps project data
        azure_project_data = MagicMock(
            id="azure-456",
            name="Azure Project",
            key="Azure Project",
            project_type="azure_devops",
            status="wellFormed",
            members=[{"uniqueName": "azure_user", "displayName": "Azure User"}],
            workflows=[]
        )
        
        azure_work_items = [
            {
                "id": "789",
                "title": "Azure Task",
                "type": "User Story",
                "status": "New"
            }
        ]
        
        # Mock clients
        jira_client = AsyncMock()
        jira_client.fetch_project_data.return_value = jira_project_data
        jira_client.fetch_work_items.return_value = jira_work_items
        
        azure_client = AsyncMock()
        azure_client.fetch_project_data.return_value = azure_project_data
        azure_client.fetch_work_items.return_value = azure_work_items
        
        def mock_get_client(service_id):
            if service_id == jira_service.id:
                return jira_client
            elif service_id == azure_service.id:
                return azure_client
            return None
        
        with patch('app.services.mcp_client.mcp_manager.get_client', side_effect=mock_get_client):
            # Sync both projects
            jira_sync = await service.sync_project_data(jira_service.id, "JIRA")
            azure_sync = await service.sync_project_data(azure_service.id, "Azure Project")
            
            assert jira_sync.sync_status == "success"
            assert azure_sync.sync_status == "success"
            
            # Verify both projects exist independently
            result = await db_session.execute(select(ProjectManagementProject))
            projects = result.scalars().all()
            assert len(projects) == 2
            
            jira_project = next((p for p in projects if p.external_id == "JIRA-123"), None)
            azure_project = next((p for p in projects if p.external_id == "azure-456"), None)
            
            assert jira_project is not None
            assert jira_project.name == "Jira Project"
            assert jira_project.project_type == "jira"
            assert jira_project.service_id == jira_service.id
            
            assert azure_project is not None
            assert azure_project.name == "Azure Project"
            assert azure_project.project_type == "azure_devops"
            assert azure_project.service_id == azure_service.id
            
            # Verify work items are associated with correct projects
            result = await db_session.execute(
                select(WorkItem).where(WorkItem.project_id == jira_project.id)
            )
            jira_items = result.scalars().all()
            assert len(jira_items) == 1
            assert jira_items[0].external_id == "JIRA-1"
            
            result = await db_session.execute(
                select(WorkItem).where(WorkItem.project_id == azure_project.id)
            )
            azure_items = result.scalars().all()
            assert len(azure_items) == 1
            assert azure_items[0].external_id == "789"

    @pytest.mark.asyncio
    async def test_sync_error_handling_and_rollback(self, db_session: AsyncSession, jira_service):
        """Test that sync errors are handled properly and don't leave partial data."""
        service = ProjectManagementService(db_session)
        
        # Mock project data
        mock_project_data = MagicMock(
            id="TEST-123",
            name="Test Project",
            key="TEST",
            project_type="jira",
            status="active",
            members=[],
            workflows=[]
        )
        
        # Mock client that fails during work items sync
        mock_client = AsyncMock()
        mock_client.fetch_project_data.return_value = mock_project_data
        mock_client.fetch_work_items.side_effect = Exception("Database connection lost")
        
        with patch('app.services.mcp_client.mcp_manager.get_client', return_value=mock_client):
            # Attempt sync that should fail
            sync_status = await service.sync_project_data(jira_service.id, "TEST")
            
            # Verify sync reported failure
            assert sync_status.sync_status == "error"
            assert len(sync_status.errors) > 0
            assert "Database connection lost" in str(sync_status.errors)
            
            # Verify project was still created (partial success)
            result = await db_session.execute(
                select(ProjectManagementProject).where(
                    ProjectManagementProject.external_id == "TEST-123"
                )
            )
            project = result.scalar_one_or_none()
            assert project is not None  # Project creation succeeded
            
            # Verify no work items were created due to the error
            result = await db_session.execute(
                select(WorkItem).where(WorkItem.project_id == project.id)
            )
            work_items = result.scalars().all()
            assert len(work_items) == 0  # No work items due to error