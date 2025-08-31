"""
Project Management service for data synchronization and analysis.
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import uuid4
from collections import defaultdict, Counter

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload

from ..models.project_management import (
    ProjectManagementProject, WorkItem, TeamMember, Workflow, ProjectAnalytics,
    ProjectOverviewResponse, WorkItemResponse, TeamMemberResponse, 
    ProjectAnalyticsResponse, ProjectSyncStatus
)
from ..models.mcp import MCPService
from .mcp_client import mcp_manager, MCPClientError


logger = logging.getLogger(__name__)


class ProjectManagementService:
    """Service for project management data synchronization and analysis."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def sync_project_data(self, service_id: str, project_identifier: str) -> ProjectSyncStatus:
        """Sync project data from an MCP service."""
        try:
            # Get MCP service
            result = await self.db.execute(
                select(MCPService).where(MCPService.id == service_id)
            )
            service = result.scalar_one_or_none()
            
            if not service:
                raise ValueError(f"MCP service {service_id} not found")
            
            # Get MCP client
            client = await mcp_manager.get_client(service_id)
            if not client:
                raise ValueError(f"MCP client for service {service_id} not connected")
            
            # Fetch project data from external service
            project_data = await client.fetch_project_data(project_identifier)
            
            # Sync project
            project = await self._sync_project(service_id, project_data)
            
            # Sync work items (if supported)
            work_items_synced = 0
            if hasattr(client, 'fetch_work_items'):
                try:
                    work_items = await client.fetch_work_items(project_identifier)
                    work_items_synced = await self._sync_work_items(project.id, work_items)
                except Exception as e:
                    logger.warning(f"Failed to sync work items: {e}")
            
            # Sync team members
            team_members_synced = await self._sync_team_members(project.id, project_data.members)
            
            # Sync workflows
            workflows_synced = await self._sync_workflows(project.id, project_data.workflows)
            
            # Update project sync timestamp
            await self.db.execute(
                update(ProjectManagementProject)
                .where(ProjectManagementProject.id == project.id)
                .values(last_synced=datetime.utcnow())
            )
            await self.db.commit()
            
            # Generate analytics
            await self._generate_project_analytics(project.id)
            
            return ProjectSyncStatus(
                project_id=project.id,
                service_id=service_id,
                last_synced=datetime.utcnow(),
                sync_status="success",
                work_items_synced=work_items_synced,
                team_members_synced=team_members_synced,
                workflows_synced=workflows_synced
            )
            
        except Exception as e:
            logger.error(f"Failed to sync project data: {e}")
            return ProjectSyncStatus(
                project_id="",
                service_id=service_id,
                last_synced=datetime.utcnow(),
                sync_status="error",
                work_items_synced=0,
                team_members_synced=0,
                workflows_synced=0,
                errors=[str(e)]
            )
    
    async def _sync_project(self, service_id: str, project_data) -> ProjectManagementProject:
        """Sync project information."""
        # Check if project already exists
        result = await self.db.execute(
            select(ProjectManagementProject)
            .where(
                ProjectManagementProject.service_id == service_id,
                ProjectManagementProject.external_id == project_data.id
            )
        )
        project = result.scalar_one_or_none()
        
        if project:
            # Update existing project
            await self.db.execute(
                update(ProjectManagementProject)
                .where(ProjectManagementProject.id == project.id)
                .values(
                    name=project_data.name,
                    key=project_data.key,
                    description=project_data.description,
                    url=project_data.url,
                    status=project_data.status,
                    updated_at=datetime.utcnow()
                )
            )
        else:
            # Create new project
            project_id = str(uuid4())
            project = ProjectManagementProject(
                id=project_id,
                external_id=project_data.id,
                service_id=service_id,
                name=project_data.name,
                key=project_data.key,
                description=project_data.description,
                url=project_data.url,
                project_type=project_data.project_type,
                status=project_data.status
            )
            self.db.add(project)
        
        await self.db.commit()
        await self.db.refresh(project)
        return project
    
    async def _sync_work_items(self, project_id: str, work_items_data: List[Dict]) -> int:
        """Sync work items for a project."""
        synced_count = 0
        
        for item_data in work_items_data:
            try:
                # Check if work item exists
                result = await self.db.execute(
                    select(WorkItem)
                    .where(
                        WorkItem.project_id == project_id,
                        WorkItem.external_id == item_data.get('id', '')
                    )
                )
                work_item = result.scalar_one_or_none()
                
                labels_json = json.dumps(item_data.get('labels', []))
                
                if work_item:
                    # Update existing work item
                    await self.db.execute(
                        update(WorkItem)
                        .where(WorkItem.id == work_item.id)
                        .values(
                            title=item_data.get('title', ''),
                            description=item_data.get('description'),
                            item_type=item_data.get('type', 'task'),
                            status=item_data.get('status', ''),
                            priority=item_data.get('priority'),
                            assignee=item_data.get('assignee'),
                            reporter=item_data.get('reporter'),
                            story_points=item_data.get('story_points'),
                            labels_json=labels_json,
                            url=item_data.get('url'),
                            updated_at=datetime.utcnow(),
                            resolved_at=item_data.get('resolved_at')
                        )
                    )
                else:
                    # Create new work item
                    work_item = WorkItem(
                        id=str(uuid4()),
                        external_id=item_data.get('id', ''),
                        project_id=project_id,
                        title=item_data.get('title', ''),
                        description=item_data.get('description'),
                        item_type=item_data.get('type', 'task'),
                        status=item_data.get('status', ''),
                        priority=item_data.get('priority'),
                        assignee=item_data.get('assignee'),
                        reporter=item_data.get('reporter'),
                        story_points=item_data.get('story_points'),
                        labels_json=labels_json,
                        url=item_data.get('url'),
                        resolved_at=item_data.get('resolved_at')
                    )
                    self.db.add(work_item)
                
                synced_count += 1
                
            except Exception as e:
                logger.warning(f"Failed to sync work item {item_data.get('id', 'unknown')}: {e}")
        
        await self.db.commit()
        return synced_count
    
    async def _sync_team_members(self, project_id: str, members_data: List[Dict]) -> int:
        """Sync team members for a project."""
        synced_count = 0
        
        # Clear existing members
        await self.db.execute(
            delete(TeamMember).where(TeamMember.project_id == project_id)
        )
        
        for member_data in members_data:
            try:
                member = TeamMember(
                    id=str(uuid4()),
                    project_id=project_id,
                    external_id=member_data.get('accountId', member_data.get('uniqueName', '')),
                    name=member_data.get('name', member_data.get('displayName', '')),
                    email=member_data.get('email', member_data.get('emailAddress')),
                    role=member_data.get('role'),
                    team=member_data.get('team'),
                    is_active=True
                )
                self.db.add(member)
                synced_count += 1
                
            except Exception as e:
                logger.warning(f"Failed to sync team member {member_data.get('name', 'unknown')}: {e}")
        
        await self.db.commit()
        return synced_count
    
    async def _sync_workflows(self, project_id: str, workflows_data: List[Dict]) -> int:
        """Sync workflows for a project."""
        synced_count = 0
        
        # Clear existing workflows
        await self.db.execute(
            delete(Workflow).where(Workflow.project_id == project_id)
        )
        
        for i, workflow_data in enumerate(workflows_data):
            try:
                workflow = Workflow(
                    id=str(uuid4()),
                    project_id=project_id,
                    name=workflow_data.get('name', ''),
                    external_id=workflow_data.get('id'),
                    category=workflow_data.get('category'),
                    order_index=i,
                    is_initial=(i == 0),
                    is_final=(i == len(workflows_data) - 1)
                )
                self.db.add(workflow)
                synced_count += 1
                
            except Exception as e:
                logger.warning(f"Failed to sync workflow {workflow_data.get('name', 'unknown')}: {e}")
        
        await self.db.commit()
        return synced_count
    
    async def _generate_project_analytics(self, project_id: str):
        """Generate analytics for a project."""
        try:
            # Get work items
            result = await self.db.execute(
                select(WorkItem).where(WorkItem.project_id == project_id)
            )
            work_items = result.scalars().all()
            
            # Get team members
            result = await self.db.execute(
                select(TeamMember).where(
                    TeamMember.project_id == project_id,
                    TeamMember.is_active == True
                )
            )
            team_members = result.scalars().all()
            
            # Calculate metrics
            total_work_items = len(work_items)
            completed_items = [item for item in work_items if item.resolved_at is not None]
            in_progress_items = [item for item in work_items if item.status.lower() in ['in progress', 'in review', 'testing']]
            backlog_items = [item for item in work_items if item.status.lower() in ['to do', 'backlog', 'new']]
            
            # Calculate average completion time
            avg_completion_time = None
            if completed_items:
                completion_times = []
                for item in completed_items:
                    if item.resolved_at and item.created_at:
                        completion_time = (item.resolved_at - item.created_at).days
                        completion_times.append(completion_time)
                
                if completion_times:
                    avg_completion_time = sum(completion_times) / len(completion_times)
            
            # Calculate velocity (story points completed in last 30 days)
            velocity = None
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            recent_completed = [
                item for item in completed_items 
                if item.resolved_at and item.resolved_at >= thirty_days_ago and item.story_points
            ]
            if recent_completed:
                velocity = sum(item.story_points for item in recent_completed if item.story_points)
            
            # Analyze communication patterns
            communication_patterns = self._analyze_communication_patterns(work_items, team_members)
            
            # Analyze workflow patterns
            workflow_patterns = self._analyze_workflow_patterns(work_items)
            
            # Delete existing analytics
            await self.db.execute(
                delete(ProjectAnalytics).where(ProjectAnalytics.project_id == project_id)
            )
            
            # Create new analytics
            analytics = ProjectAnalytics(
                id=str(uuid4()),
                project_id=project_id,
                total_work_items=total_work_items,
                completed_work_items=len(completed_items),
                in_progress_work_items=len(in_progress_items),
                backlog_work_items=len(backlog_items),
                active_team_members=len(team_members),
                avg_completion_time_days=avg_completion_time,
                velocity_story_points=velocity,
                communication_patterns_json=json.dumps(communication_patterns),
                workflow_patterns_json=json.dumps(workflow_patterns)
            )
            
            self.db.add(analytics)
            await self.db.commit()
            
        except Exception as e:
            logger.error(f"Failed to generate analytics for project {project_id}: {e}")
    
    def _analyze_communication_patterns(self, work_items: List[WorkItem], team_members: List[TeamMember]) -> Dict[str, Any]:
        """Analyze communication patterns from work items and team data."""
        patterns = {
            "most_active_assignees": {},
            "most_active_reporters": {},
            "collaboration_frequency": {},
            "team_distribution": {}
        }
        
        # Count assignee activity
        assignee_counts = Counter(item.assignee for item in work_items if item.assignee)
        patterns["most_active_assignees"] = dict(assignee_counts.most_common(10))
        
        # Count reporter activity
        reporter_counts = Counter(item.reporter for item in work_items if item.reporter)
        patterns["most_active_reporters"] = dict(reporter_counts.most_common(10))
        
        # Team distribution
        team_counts = Counter(member.team for member in team_members if member.team)
        patterns["team_distribution"] = dict(team_counts)
        
        # Role distribution
        role_counts = Counter(member.role for member in team_members if member.role)
        patterns["role_distribution"] = dict(role_counts)
        
        return patterns
    
    def _analyze_workflow_patterns(self, work_items: List[WorkItem]) -> Dict[str, Any]:
        """Analyze workflow patterns from work items."""
        patterns = {
            "status_distribution": {},
            "type_distribution": {},
            "priority_distribution": {},
            "completion_trends": {}
        }
        
        # Status distribution
        status_counts = Counter(item.status for item in work_items)
        patterns["status_distribution"] = dict(status_counts)
        
        # Type distribution
        type_counts = Counter(item.item_type for item in work_items)
        patterns["type_distribution"] = dict(type_counts)
        
        # Priority distribution
        priority_counts = Counter(item.priority for item in work_items if item.priority)
        patterns["priority_distribution"] = dict(priority_counts)
        
        # Completion trends (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        recent_completed = [
            item for item in work_items 
            if item.resolved_at and item.resolved_at >= six_months_ago
        ]
        
        # Group by month
        monthly_completions = defaultdict(int)
        for item in recent_completed:
            month_key = item.resolved_at.strftime("%Y-%m")
            monthly_completions[month_key] += 1
        
        patterns["completion_trends"] = dict(monthly_completions)
        
        return patterns
    
    async def get_project_overview(self, project_id: str) -> Optional[ProjectOverviewResponse]:
        """Get comprehensive project overview."""
        try:
            # Get project with relationships
            result = await self.db.execute(
                select(ProjectManagementProject)
                .options(
                    selectinload(ProjectManagementProject.work_items),
                    selectinload(ProjectManagementProject.team_members),
                    selectinload(ProjectManagementProject.workflows)
                )
                .where(ProjectManagementProject.id == project_id)
            )
            project = result.scalar_one_or_none()
            
            if not project:
                return None
            
            # Get analytics
            result = await self.db.execute(
                select(ProjectAnalytics)
                .where(ProjectAnalytics.project_id == project_id)
                .order_by(ProjectAnalytics.analysis_date.desc())
            )
            analytics = result.scalar_one_or_none()
            
            # Get recent work items (last 10)
            recent_work_items = sorted(
                project.work_items, 
                key=lambda x: x.updated_at, 
                reverse=True
            )[:10]
            
            return ProjectOverviewResponse(
                id=project.id,
                name=project.name,
                key=project.key,
                description=project.description,
                project_type=project.project_type,
                status=project.status,
                url=project.url,
                last_synced=project.last_synced,
                total_work_items=analytics.total_work_items if analytics else len(project.work_items),
                completed_work_items=analytics.completed_work_items if analytics else 0,
                in_progress_work_items=analytics.in_progress_work_items if analytics else 0,
                backlog_work_items=analytics.backlog_work_items if analytics else 0,
                active_team_members=analytics.active_team_members if analytics else len(project.team_members),
                team_members=[
                    {
                        "id": member.id,
                        "name": member.name,
                        "email": member.email,
                        "role": member.role,
                        "team": member.team,
                        "is_active": member.is_active
                    }
                    for member in project.team_members
                ],
                workflows=[
                    {
                        "id": workflow.id,
                        "name": workflow.name,
                        "category": workflow.category,
                        "order_index": workflow.order_index,
                        "is_initial": workflow.is_initial,
                        "is_final": workflow.is_final
                    }
                    for workflow in sorted(project.workflows, key=lambda x: x.order_index or 0)
                ],
                recent_work_items=[
                    {
                        "id": item.id,
                        "external_id": item.external_id,
                        "title": item.title,
                        "item_type": item.item_type,
                        "status": item.status,
                        "assignee": item.assignee,
                        "updated_at": item.updated_at,
                        "url": item.url
                    }
                    for item in recent_work_items
                ]
            )
            
        except Exception as e:
            logger.error(f"Failed to get project overview for {project_id}: {e}")
            return None
    
    async def get_project_analytics(self, project_id: str) -> Optional[ProjectAnalyticsResponse]:
        """Get project analytics."""
        try:
            result = await self.db.execute(
                select(ProjectAnalytics)
                .where(ProjectAnalytics.project_id == project_id)
                .order_by(ProjectAnalytics.analysis_date.desc())
            )
            analytics = result.scalar_one_or_none()
            
            if not analytics:
                return None
            
            completion_rate = 0.0
            if analytics.total_work_items > 0:
                completion_rate = analytics.completed_work_items / analytics.total_work_items
            
            communication_patterns = {}
            workflow_patterns = {}
            
            if analytics.communication_patterns_json:
                communication_patterns = json.loads(analytics.communication_patterns_json)
            
            if analytics.workflow_patterns_json:
                workflow_patterns = json.loads(analytics.workflow_patterns_json)
            
            return ProjectAnalyticsResponse(
                project_id=analytics.project_id,
                analysis_date=analytics.analysis_date,
                total_work_items=analytics.total_work_items,
                completed_work_items=analytics.completed_work_items,
                in_progress_work_items=analytics.in_progress_work_items,
                backlog_work_items=analytics.backlog_work_items,
                completion_rate=completion_rate,
                active_team_members=analytics.active_team_members,
                avg_completion_time_days=analytics.avg_completion_time_days,
                velocity_story_points=analytics.velocity_story_points,
                communication_patterns=communication_patterns,
                workflow_patterns=workflow_patterns
            )
            
        except Exception as e:
            logger.error(f"Failed to get project analytics for {project_id}: {e}")
            return None
    
    async def list_projects(self, service_id: Optional[str] = None) -> List[ProjectOverviewResponse]:
        """List all projects, optionally filtered by service."""
        try:
            query = select(ProjectManagementProject).options(
                selectinload(ProjectManagementProject.team_members),
                selectinload(ProjectManagementProject.workflows)
            )
            
            if service_id:
                query = query.where(ProjectManagementProject.service_id == service_id)
            
            result = await self.db.execute(query)
            projects = result.scalars().all()
            
            project_overviews = []
            for project in projects:
                overview = await self.get_project_overview(project.id)
                if overview:
                    project_overviews.append(overview)
            
            return project_overviews
            
        except Exception as e:
            logger.error(f"Failed to list projects: {e}")
            return []