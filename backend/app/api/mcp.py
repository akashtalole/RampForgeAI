"""
MCP service management API endpoints.
"""
import json
import logging
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from ..models.database import get_db
from ..models.mcp import (
    MCPService, MCPConfig, MCPServiceType, MCPConnectionStatus,
    RepositoryData, ProjectData, SyncResult, MCPHealthCheck
)
from ..services.mcp_client import mcp_manager, MCPClientError
from ..services.mcp_github import GitHubMCPClient, GitLabMCPClient
from ..services.mcp_jira import JiraMCPClient, AzureDevOpsMCPClient
from ..services.auth import get_current_active_user
from ..models.user import User


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/mcp", tags=["MCP Services"])

# Register MCP client classes
mcp_manager.register_client_class(MCPServiceType.GITHUB, GitHubMCPClient)
mcp_manager.register_client_class(MCPServiceType.GITLAB, GitLabMCPClient)
mcp_manager.register_client_class(MCPServiceType.JIRA, JiraMCPClient)
mcp_manager.register_client_class(MCPServiceType.AZURE_DEVOPS, AzureDevOpsMCPClient)


@router.get("/services", response_model=List[dict])
async def list_mcp_services(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all configured MCP services."""
    try:
        result = await db.execute(select(MCPService))
        services = result.scalars().all()
        
        service_list = []
        for service in services:
            service_dict = {
                "id": service.id,
                "service_type": service.service_type,
                "name": service.name,
                "endpoint": service.endpoint,
                "enabled": service.enabled,
                "status": service.status,
                "last_connected": service.last_connected,
                "last_error": service.last_error,
                "created_at": service.created_at,
                "updated_at": service.updated_at
            }
            service_list.append(service_dict)
        
        return service_list
        
    except Exception as e:
        logger.error(f"Failed to list MCP services: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list MCP services"
        )


@router.post("/services", response_model=dict)
async def create_mcp_service(
    config: MCPConfig,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new MCP service configuration."""
    try:
        # Validate credentials before saving
        client = await mcp_manager.create_client(config)
        
        try:
            await client.connect()
            is_valid = await client.validate_credentials()
            await client.disconnect()
            
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid service credentials"
                )
        except MCPClientError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to validate service: {e}"
            )
        
        # Create service record
        service_id = str(uuid4())
        service = MCPService(
            id=service_id,
            service_type=config.service_type.value,
            name=config.name,
            endpoint=config.endpoint,
            credentials_json=json.dumps(config.credentials),
            enabled=config.enabled,
            rate_limits_json=json.dumps(config.rate_limits),
            timeout=config.timeout,
            retry_attempts=config.retry_attempts,
            status=MCPConnectionStatus.DISCONNECTED.value
        )
        
        db.add(service)
        await db.commit()
        await db.refresh(service)
        
        logger.info(f"Created MCP service: {service.name} ({service.service_type})")
        
        return {
            "id": service.id,
            "message": "MCP service created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create MCP service: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create MCP service"
        )


@router.get("/services/{service_id}", response_model=dict)
async def get_mcp_service(
    service_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get details of a specific MCP service."""
    try:
        result = await db.execute(
            select(MCPService).where(MCPService.id == service_id)
        )
        service = result.scalar_one_or_none()
        
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MCP service not found"
            )
        
        return {
            "id": service.id,
            "service_type": service.service_type,
            "name": service.name,
            "endpoint": service.endpoint,
            "enabled": service.enabled,
            "status": service.status,
            "last_connected": service.last_connected,
            "last_error": service.last_error,
            "created_at": service.created_at,
            "updated_at": service.updated_at,
            "rate_limits": json.loads(service.rate_limits_json or "{}"),
            "timeout": service.timeout,
            "retry_attempts": service.retry_attempts
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get MCP service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get MCP service"
        )


@router.put("/services/{service_id}", response_model=dict)
async def update_mcp_service(
    service_id: str,
    config: MCPConfig,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing MCP service configuration."""
    try:
        # Check if service exists
        result = await db.execute(
            select(MCPService).where(MCPService.id == service_id)
        )
        service = result.scalar_one_or_none()
        
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MCP service not found"
            )
        
        # Validate new credentials
        client = await mcp_manager.create_client(config)
        
        try:
            await client.connect()
            is_valid = await client.validate_credentials()
            await client.disconnect()
            
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid service credentials"
                )
        except MCPClientError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to validate service: {e}"
            )
        
        # Disconnect existing client if connected
        await mcp_manager.disconnect_service(service_id)
        
        # Update service record
        await db.execute(
            update(MCPService)
            .where(MCPService.id == service_id)
            .values(
                service_type=config.service_type.value,
                name=config.name,
                endpoint=config.endpoint,
                credentials_json=json.dumps(config.credentials),
                enabled=config.enabled,
                rate_limits_json=json.dumps(config.rate_limits),
                timeout=config.timeout,
                retry_attempts=config.retry_attempts,
                status=MCPConnectionStatus.DISCONNECTED.value,
                updated_at=datetime.utcnow()
            )
        )
        await db.commit()
        
        logger.info(f"Updated MCP service: {service_id}")
        
        return {"message": "MCP service updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update MCP service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update MCP service"
        )


@router.delete("/services/{service_id}")
async def delete_mcp_service(
    service_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an MCP service configuration."""
    try:
        # Disconnect service if connected
        await mcp_manager.disconnect_service(service_id)
        
        # Delete service record
        result = await db.execute(
            delete(MCPService).where(MCPService.id == service_id)
        )
        
        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MCP service not found"
            )
        
        await db.commit()
        
        logger.info(f"Deleted MCP service: {service_id}")
        
        return {"message": "MCP service deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete MCP service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete MCP service"
        )


@router.post("/services/{service_id}/connect")
async def connect_mcp_service(
    service_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Connect to an MCP service."""
    try:
        success = await mcp_manager.connect_service(service_id)
        
        if success:
            return {"message": "Successfully connected to MCP service"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to connect to MCP service"
            )
            
    except MCPClientError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to connect MCP service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to MCP service"
        )


@router.post("/services/{service_id}/disconnect")
async def disconnect_mcp_service(
    service_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Disconnect from an MCP service."""
    try:
        await mcp_manager.disconnect_service(service_id)
        return {"message": "Successfully disconnected from MCP service"}
        
    except Exception as e:
        logger.error(f"Failed to disconnect MCP service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect from MCP service"
        )


@router.get("/services/{service_id}/health")
async def health_check_mcp_service(
    service_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Perform health check on an MCP service."""
    try:
        client = await mcp_manager.get_client(service_id)
        
        if not client:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Service not connected"
            )
        
        health_check = await client.health_check()
        
        return {
            "service_id": health_check.service_id,
            "service_type": health_check.service_type.value,
            "status": health_check.status.value,
            "response_time_ms": health_check.response_time_ms,
            "error_message": health_check.error_message,
            "checked_at": health_check.checked_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Health check failed for MCP service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Health check failed"
        )


@router.get("/services/{service_id}/repositories")
async def list_service_repositories(
    service_id: str,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
):
    """List repositories from an MCP service."""
    try:
        client = await mcp_manager.get_client(service_id)
        
        if not client:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Service not connected"
            )
        
        repositories = await client.list_repositories(limit)
        
        return {
            "repositories": [repo.dict() for repo in repositories],
            "total": len(repositories)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list repositories for service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list repositories"
        )


@router.get("/services/{service_id}/projects")
async def list_service_projects(
    service_id: str,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
):
    """List projects from an MCP service."""
    try:
        client = await mcp_manager.get_client(service_id)
        
        if not client:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Service not connected"
            )
        
        projects = await client.list_projects(limit)
        
        return {
            "projects": [project.dict() for project in projects],
            "total": len(projects)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list projects for service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list projects"
        )


@router.post("/sync")
async def sync_all_services(
    current_user: User = Depends(get_current_active_user)
):
    """Synchronize data from all connected MCP services."""
    try:
        results = await mcp_manager.sync_all_services()
        
        return {
            "sync_results": [result.dict() for result in results],
            "total_services": len(results)
        }
        
    except Exception as e:
        logger.error(f"Failed to sync MCP services: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync MCP services"
        )


@router.get("/health")
async def health_check_all_services(
    current_user: User = Depends(get_current_active_user)
):
    """Perform health check on all MCP services."""
    try:
        health_checks = await mcp_manager.health_check_all()
        
        return {
            "health_checks": [
                {
                    "service_id": check.service_id,
                    "service_type": check.service_type.value,
                    "status": check.status.value,
                    "response_time_ms": check.response_time_ms,
                    "error_message": check.error_message,
                    "checked_at": check.checked_at
                }
                for check in health_checks
            ],
            "total_services": len(health_checks)
        }
        
    except Exception as e:
        logger.error(f"Failed to perform health checks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform health checks"
        )
