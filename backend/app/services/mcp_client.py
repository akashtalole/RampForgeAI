"""
Base MCP client infrastructure and service management.
"""
import asyncio
import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, List, Optional, Any, Type
from contextlib import asynccontextmanager

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from ..models.mcp import (
    MCPConfig, MCPService, MCPServiceType, MCPConnectionStatus,
    RepositoryData, ProjectData, SyncResult, MCPHealthCheck
)
from ..models.database import AsyncSessionLocal


logger = logging.getLogger(__name__)


class MCPClientError(Exception):
    """Base exception for MCP client errors."""
    pass


class MCPConnectionError(MCPClientError):
    """Exception raised when MCP service connection fails."""
    pass


class MCPAuthenticationError(MCPClientError):
    """Exception raised when MCP service authentication fails."""
    pass


class MCPRateLimitError(MCPClientError):
    """Exception raised when MCP service rate limit is exceeded."""
    pass


class BaseMCPClient(ABC):
    """Abstract base class for MCP service clients."""
    
    def __init__(self, config: MCPConfig):
        self.config = config
        self.service_type = config.service_type
        self.endpoint = config.endpoint
        self.credentials = config.credentials
        self.timeout = config.timeout
        self.retry_attempts = config.retry_attempts
        self._client: Optional[httpx.AsyncClient] = None
        self._rate_limiter = self._create_rate_limiter()
    
    def _create_rate_limiter(self) -> Dict[str, Any]:
        """Create rate limiter based on service configuration."""
        return {
            "requests_per_minute": self.config.rate_limits.get("requests_per_minute", 60),
            "requests_per_hour": self.config.rate_limits.get("requests_per_hour", 1000),
            "last_request_times": []
        }
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.disconnect()
    
    async def connect(self) -> bool:
        """Establish connection to the MCP service."""
        try:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.timeout),
                headers=self._get_auth_headers()
            )
            
            # Test connection
            await self.health_check()
            logger.info(f"Connected to {self.service_type} MCP service")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to {self.service_type}: {e}")
            raise MCPConnectionError(f"Connection failed: {e}")
    
    async def disconnect(self):
        """Close connection to the MCP service."""
        if self._client:
            await self._client.aclose()
            self._client = None
            logger.info(f"Disconnected from {self.service_type} MCP service")
    
    @abstractmethod
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers for the service."""
        pass
    
    @abstractmethod
    async def health_check(self) -> MCPHealthCheck:
        """Perform health check on the service."""
        pass
    
    @abstractmethod
    async def validate_credentials(self) -> bool:
        """Validate service credentials."""
        pass
    
    @abstractmethod
    async def fetch_repository_data(self, repo_identifier: str) -> RepositoryData:
        """Fetch repository data from the service."""
        pass
    
    @abstractmethod
    async def fetch_project_data(self, project_identifier: str) -> ProjectData:
        """Fetch project data from the service."""
        pass
    
    @abstractmethod
    async def list_repositories(self, limit: int = 100) -> List[RepositoryData]:
        """List repositories accessible through the service."""
        pass
    
    @abstractmethod
    async def list_projects(self, limit: int = 100) -> List[ProjectData]:
        """List projects accessible through the service."""
        pass
    
    async def _make_request(
        self, 
        method: str, 
        url: str, 
        **kwargs
    ) -> httpx.Response:
        """Make HTTP request with rate limiting and retry logic."""
        if not self._client:
            raise MCPConnectionError("Client not connected")
        
        await self._check_rate_limit()
        
        for attempt in range(self.retry_attempts):
            try:
                response = await self._client.request(method, url, **kwargs)
                
                if response.status_code == 429:  # Rate limited
                    retry_after = int(response.headers.get("Retry-After", 60))
                    logger.warning(f"Rate limited, waiting {retry_after} seconds")
                    await asyncio.sleep(retry_after)
                    continue
                
                response.raise_for_status()
                return response
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401:
                    raise MCPAuthenticationError("Authentication failed")
                elif e.response.status_code == 429:
                    raise MCPRateLimitError("Rate limit exceeded")
                elif attempt == self.retry_attempts - 1:
                    raise MCPClientError(f"Request failed: {e}")
                
                # Exponential backoff
                wait_time = 2 ** attempt
                logger.warning(f"Request failed, retrying in {wait_time}s: {e}")
                await asyncio.sleep(wait_time)
            
            except Exception as e:
                if attempt == self.retry_attempts - 1:
                    raise MCPClientError(f"Request failed: {e}")
                
                wait_time = 2 ** attempt
                logger.warning(f"Request failed, retrying in {wait_time}s: {e}")
                await asyncio.sleep(wait_time)
        
        raise MCPClientError("Max retry attempts exceeded")
    
    async def _check_rate_limit(self):
        """Check and enforce rate limiting."""
        now = datetime.utcnow()
        rate_limiter = self._rate_limiter
        
        # Clean old request times (older than 1 hour)
        rate_limiter["last_request_times"] = [
            req_time for req_time in rate_limiter["last_request_times"]
            if (now - req_time).total_seconds() < 3600
        ]
        
        # Check hourly limit
        if len(rate_limiter["last_request_times"]) >= rate_limiter["requests_per_hour"]:
            raise MCPRateLimitError("Hourly rate limit exceeded")
        
        # Check per-minute limit
        recent_requests = [
            req_time for req_time in rate_limiter["last_request_times"]
            if (now - req_time).total_seconds() < 60
        ]
        
        if len(recent_requests) >= rate_limiter["requests_per_minute"]:
            wait_time = 60 - (now - min(recent_requests)).total_seconds()
            logger.info(f"Rate limit reached, waiting {wait_time:.1f}s")
            await asyncio.sleep(wait_time)
        
        # Record this request
        rate_limiter["last_request_times"].append(now)


class MCPClientManager:
    """Manager for MCP service clients and configurations."""
    
    def __init__(self):
        self._clients: Dict[str, BaseMCPClient] = {}
        self._client_classes: Dict[MCPServiceType, Type[BaseMCPClient]] = {}
    
    def register_client_class(self, service_type: MCPServiceType, client_class: Type[BaseMCPClient]):
        """Register a client class for a service type."""
        self._client_classes[service_type] = client_class
        logger.info(f"Registered MCP client for {service_type}")
    
    async def create_client(self, config: MCPConfig) -> BaseMCPClient:
        """Create and configure an MCP client."""
        if config.service_type not in self._client_classes:
            raise MCPClientError(f"No client registered for {config.service_type}")
        
        client_class = self._client_classes[config.service_type]
        client = client_class(config)
        
        return client
    
    async def get_client(self, service_id: str) -> Optional[BaseMCPClient]:
        """Get an existing client by service ID."""
        return self._clients.get(service_id)
    
    async def connect_service(self, service_id: str) -> bool:
        """Connect to an MCP service by ID."""
        async with AsyncSessionLocal() as session:
            # Load service configuration from database
            result = await session.execute(
                select(MCPService).where(MCPService.id == service_id)
            )
            service = result.scalar_one_or_none()
            
            if not service:
                raise MCPClientError(f"Service {service_id} not found")
            
            if not service.enabled:
                raise MCPClientError(f"Service {service_id} is disabled")
            
            # Create configuration
            config = MCPConfig(
                service_type=MCPServiceType(service.service_type),
                name=service.name,
                endpoint=service.endpoint,
                credentials=json.loads(service.credentials_json),
                enabled=service.enabled,
                rate_limits=json.loads(service.rate_limits_json or "{}"),
                timeout=service.timeout,
                retry_attempts=service.retry_attempts
            )
            
            # Create and connect client
            client = await self.create_client(config)
            
            try:
                await client.connect()
                self._clients[service_id] = client
                
                # Update service status
                await session.execute(
                    update(MCPService)
                    .where(MCPService.id == service_id)
                    .values(
                        status=MCPConnectionStatus.CONNECTED.value,
                        last_connected=datetime.utcnow(),
                        last_error=None
                    )
                )
                await session.commit()
                
                return True
                
            except Exception as e:
                # Update service status with error
                await session.execute(
                    update(MCPService)
                    .where(MCPService.id == service_id)
                    .values(
                        status=MCPConnectionStatus.ERROR.value,
                        last_error=str(e)
                    )
                )
                await session.commit()
                raise
    
    async def disconnect_service(self, service_id: str):
        """Disconnect from an MCP service."""
        client = self._clients.get(service_id)
        if client:
            await client.disconnect()
            del self._clients[service_id]
            
            async with AsyncSessionLocal() as session:
                await session.execute(
                    update(MCPService)
                    .where(MCPService.id == service_id)
                    .values(status=MCPConnectionStatus.DISCONNECTED.value)
                )
                await session.commit()
    
    async def sync_all_services(self) -> List[SyncResult]:
        """Synchronize data from all connected services."""
        results = []
        
        for service_id, client in self._clients.items():
            try:
                # This would be implemented by specific sync logic
                # For now, return a placeholder result
                result = SyncResult(
                    service_id=service_id,
                    service_type=client.service_type,
                    status="success",
                    synced_at=datetime.utcnow()
                )
                results.append(result)
                
            except Exception as e:
                logger.error(f"Sync failed for service {service_id}: {e}")
                result = SyncResult(
                    service_id=service_id,
                    service_type=client.service_type,
                    status="failed",
                    synced_at=datetime.utcnow(),
                    errors=[str(e)]
                )
                results.append(result)
        
        return results
    
    async def health_check_all(self) -> List[MCPHealthCheck]:
        """Perform health check on all services."""
        results = []
        
        async with AsyncSessionLocal() as session:
            # Get all services
            result = await session.execute(select(MCPService))
            services = result.scalars().all()
            
            for service in services:
                try:
                    client = self._clients.get(service.id)
                    if client:
                        health_check = await client.health_check()
                    else:
                        health_check = MCPHealthCheck(
                            service_id=service.id,
                            service_type=MCPServiceType(service.service_type),
                            status=MCPConnectionStatus.DISCONNECTED,
                            checked_at=datetime.utcnow()
                        )
                    
                    results.append(health_check)
                    
                except Exception as e:
                    logger.error(f"Health check failed for service {service.id}: {e}")
                    health_check = MCPHealthCheck(
                        service_id=service.id,
                        service_type=MCPServiceType(service.service_type),
                        status=MCPConnectionStatus.ERROR,
                        error_message=str(e),
                        checked_at=datetime.utcnow()
                    )
                    results.append(health_check)
        
        return results


# Global MCP client manager instance
mcp_manager = MCPClientManager()