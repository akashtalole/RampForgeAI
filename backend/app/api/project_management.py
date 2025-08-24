"""
Project Management API endpoints.
"""
import logging
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from ..models.database import get_db
from ..models.project_management import (
    ProjectOverviewResponse, ProjectAnalyticsResponse, ProjectSyncStatus,
    WorkItemResponse, TeamMemberResponse
)
from ..services.project_management import ProjectManagementService
from ..services.auth import get_current_active_user
from ..models.user import User


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/project-management", tags=["Project Management"])


class SyncProjectRequest(BaseModel):
    """Request model for syncing project data."""
    service_id: str
    project_identifier: str


class ProjectDashboardResponse(BaseModel):
    """Response model for project dashboard."""
    total_projects: int
    active_projects: int
    total_work_items: int
    completed_work_items: int
    in_progress_work_items: int
    active_team_members: int
    recent_projects: List[ProjectOverviewResponse]


@router.get("/dashboard", response_model=ProjectDashboardResponse)
async def get_project_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get project management dashboard overview."""
    try:
        pm_service = ProjectManagementService(db)
        projects = await pm_service.list_projects()
        
        # Calculate dashboard metrics
        total_projects = len(projects)
        active_projects = len([p for p in projects if p.status.lower() in ['active', 'wellformed']])
        total_work_items = sum(p.total_work_items for p in projects)
        completed_work_items = sum(p.completed_work_items for p in projects)
        in_progress_work_items = sum(p.in_progress_work_items for p in projects)
        active_team_members = sum(p.active_team_members for p in projects)
        
        # Get recent projects (last 5)
        recent_projects = sorted(
            projects, 
            key=lambda x: x.last_synced or x.updated_at, 
            reverse=True
        )[:5]
        
        return ProjectDashboardResponse(
            total_projects=total_projects,
            active_projects=active_projects,
            total_work_items=total_work_items,
            completed_work_items=completed_work_items,
            in_progress_work_items=in_progress_work_items,
            active_team_members=active_team_members,
            recent_projects=recent_projects
        )
        
    except Exception as e:
        logger.error(f"Failed to get project dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get project dashboard"
        )


@router.get("/projects", response_model=List[ProjectOverviewResponse])
async def list_projects(
    service_id: Optional[str] = Query(None, description="Filter by MCP service ID"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all projects with overview information."""
    try:
        pm_service = ProjectManagementService(db)
        projects = await pm_service.list_projects(service_id)
        return projects
        
    except Exception as e:
        logger.error(f"Failed to list projects: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list projects"
        )


@router.get("/projects/{project_id}", response_model=ProjectOverviewResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed project overview."""
    try:
        pm_service = ProjectManagementService(db)
        project = await pm_service.get_project_overview(project_id)
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return project
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get project"
        )


@router.get("/projects/{project_id}/analytics", response_model=ProjectAnalyticsResponse)
async def get_project_analytics(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get project analytics and insights."""
    try:
        pm_service = ProjectManagementService(db)
        analytics = await pm_service.get_project_analytics(project_id)
        
        if not analytics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project analytics not found"
            )
        
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get project analytics for {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get project analytics"
        )


@router.post("/sync", response_model=ProjectSyncStatus)
async def sync_project(
    request: SyncProjectRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Sync project data from an MCP service."""
    try:
        pm_service = ProjectManagementService(db)
        sync_status = await pm_service.sync_project_data(
            request.service_id,
            request.project_identifier
        )
        
        if sync_status.sync_status == "error":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sync failed: {'; '.join(sync_status.errors)}"
            )
        
        return sync_status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to sync project: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync project"
        )


@router.post("/sync-all")
async def sync_all_projects(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Sync all projects from all connected MCP services."""
    try:
        from ..services.mcp_client import mcp_manager
        from sqlalchemy import select
        from ..models.mcp import MCPService
        
        # Get all enabled MCP services
        result = await db.execute(
            select(MCPService).where(MCPService.enabled == True)
        )
        services = result.scalars().all()
        
        sync_results = []
        pm_service = ProjectManagementService(db)
        
        for service in services:
            try:
                # Get connected client
                client = await mcp_manager.get_client(service.id)
                if not client:
                    logger.warning(f"Service {service.name} not connected, skipping")
                    continue
                
                # List projects from the service
                projects = await client.list_projects(limit=50)
                
                for project_data in projects:
                    try:
                        sync_status = await pm_service.sync_project_data(
                            service.id,
                            project_data.key or project_data.id
                        )
                        sync_results.append(sync_status)
                        
                    except Exception as e:
                        logger.error(f"Failed to sync project {project_data.name}: {e}")
                        sync_results.append(ProjectSyncStatus(
                            project_id="",
                            service_id=service.id,
                            last_synced=None,
                            sync_status="error",
                            work_items_synced=0,
                            team_members_synced=0,
                            workflows_synced=0,
                            errors=[str(e)]
                        ))
                        
            except Exception as e:
                logger.error(f"Failed to sync from service {service.name}: {e}")
        
        successful_syncs = len([r for r in sync_results if r.sync_status == "success"])
        failed_syncs = len([r for r in sync_results if r.sync_status == "error"])
        
        return {
            "message": f"Sync completed: {successful_syncs} successful, {failed_syncs} failed",
            "total_synced": len(sync_results),
            "successful": successful_syncs,
            "failed": failed_syncs,
            "results": [result.dict() for result in sync_results]
        }
        
    except Exception as e:
        logger.error(f"Failed to sync all projects: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync all projects"
        )


@router.get("/work-items", response_model=List[WorkItemResponse])
async def list_work_items(
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    assignee: Optional[str] = Query(None, description="Filter by assignee"),
    limit: int = Query(100, description="Maximum number of items to return"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List work items with optional filters."""
    try:
        from sqlalchemy import select
        from ..models.project_management import WorkItem
        import json
        
        query = select(WorkItem)
        
        if project_id:
            query = query.where(WorkItem.project_id == project_id)
        
        if status:
            query = query.where(WorkItem.status.ilike(f"%{status}%"))
        
        if assignee:
            query = query.where(WorkItem.assignee.ilike(f"%{assignee}%"))
        
        query = query.order_by(WorkItem.updated_at.desc()).limit(limit)
        
        result = await db.execute(query)
        work_items = result.scalars().all()
        
        work_item_responses = []
        for item in work_items:
            labels = []
            if item.labels_json:
                try:
                    labels = json.loads(item.labels_json)
                except:
                    pass
            
            work_item_responses.append(WorkItemResponse(
                id=item.id,
                external_id=item.external_id,
                title=item.title,
                description=item.description,
                item_type=item.item_type,
                status=item.status,
                priority=item.priority,
                assignee=item.assignee,
                reporter=item.reporter,
                story_points=item.story_points,
                labels=labels,
                url=item.url,
                created_at=item.created_at,
                updated_at=item.updated_at,
                resolved_at=item.resolved_at
            ))
        
        return work_item_responses
        
    except Exception as e:
        logger.error(f"Failed to list work items: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list work items"
        )


@router.get("/team-members", response_model=List[TeamMemberResponse])
async def list_team_members(
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    active_only: bool = Query(True, description="Show only active members"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List team members with optional filters."""
    try:
        from sqlalchemy import select
        from ..models.project_management import TeamMember
        
        query = select(TeamMember)
        
        if project_id:
            query = query.where(TeamMember.project_id == project_id)
        
        if active_only:
            query = query.where(TeamMember.is_active == True)
        
        query = query.order_by(TeamMember.name)
        
        result = await db.execute(query)
        team_members = result.scalars().all()
        
        return [
            TeamMemberResponse(
                id=member.id,
                external_id=member.external_id,
                name=member.name,
                email=member.email,
                role=member.role,
                team=member.team,
                is_active=member.is_active
            )
            for member in team_members
        ]
        
    except Exception as e:
        logger.error(f"Failed to list team members: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list team members"
        )


@router.get("/insights/workflow-analysis")
async def get_workflow_analysis(
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get workflow analysis and team process insights."""
    try:
        from sqlalchemy import select
        from ..models.project_management import ProjectAnalytics
        import json
        
        query = select(ProjectAnalytics)
        
        if project_id:
            query = query.where(ProjectAnalytics.project_id == project_id)
        
        query = query.order_by(ProjectAnalytics.analysis_date.desc())
        
        result = await db.execute(query)
        analytics_list = result.scalars().all()
        
        workflow_insights = []
        
        for analytics in analytics_list:
            workflow_patterns = {}
            communication_patterns = {}
            
            if analytics.workflow_patterns_json:
                try:
                    workflow_patterns = json.loads(analytics.workflow_patterns_json)
                except:
                    pass
            
            if analytics.communication_patterns_json:
                try:
                    communication_patterns = json.loads(analytics.communication_patterns_json)
                except:
                    pass
            
            workflow_insights.append({
                "project_id": analytics.project_id,
                "analysis_date": analytics.analysis_date,
                "workflow_patterns": workflow_patterns,
                "communication_patterns": communication_patterns,
                "team_metrics": {
                    "active_members": analytics.active_team_members,
                    "avg_completion_time_days": analytics.avg_completion_time_days,
                    "velocity_story_points": analytics.velocity_story_points
                }
            })
        
        return {
            "total_projects_analyzed": len(workflow_insights),
            "insights": workflow_insights
        }
        
    except Exception as e:
        logger.error(f"Failed to get workflow analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get workflow analysis"
        )