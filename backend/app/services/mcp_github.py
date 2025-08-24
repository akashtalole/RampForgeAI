"""
GitHub MCP client implementation.
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional
from urllib.parse import urljoin

import httpx

from .mcp_client import BaseMCPClient, MCPClientError, MCPAuthenticationError
from ..models.mcp import (
    MCPConfig, MCPHealthCheck, MCPConnectionStatus,
    RepositoryData, ProjectData
)


logger = logging.getLogger(__name__)


class GitHubMCPClient(BaseMCPClient):
    """GitHub MCP client implementation."""
    
    def __init__(self, config: MCPConfig):
        super().__init__(config)
        self.api_base = config.endpoint.rstrip('/') + '/api/v1' if not config.endpoint.endswith('/api/v1') else config.endpoint
        self.token = config.credentials.get('token')
        
        if not self.token:
            raise MCPClientError("GitHub token is required")
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get GitHub authentication headers."""
        return {
            'Authorization': f'token {self.token}',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'RampForgeAI-MCP-Client/1.0'
        }
    
    async def health_check(self) -> MCPHealthCheck:
        """Perform health check on GitHub API."""
        start_time = datetime.utcnow()
        
        try:
            response = await self._make_request('GET', f'{self.api_base}/user')
            end_time = datetime.utcnow()
            
            response_time_ms = int((end_time - start_time).total_seconds() * 1000)
            
            return MCPHealthCheck(
                service_id=self.config.name,
                service_type=self.service_type,
                status=MCPConnectionStatus.CONNECTED,
                response_time_ms=response_time_ms,
                checked_at=end_time
            )
            
        except Exception as e:
            end_time = datetime.utcnow()
            logger.error(f"GitHub health check failed: {e}")
            
            return MCPHealthCheck(
                service_id=self.config.name,
                service_type=self.service_type,
                status=MCPConnectionStatus.ERROR,
                error_message=str(e),
                checked_at=end_time
            )
    
    async def validate_credentials(self) -> bool:
        """Validate GitHub credentials."""
        try:
            response = await self._make_request('GET', f'{self.api_base}/user')
            user_data = response.json()
            
            # Check if we have basic user information
            if 'login' in user_data and 'id' in user_data:
                logger.info(f"GitHub credentials validated for user: {user_data['login']}")
                return True
            
            return False
            
        except MCPAuthenticationError:
            logger.error("GitHub credentials validation failed: Invalid token")
            return False
        except Exception as e:
            logger.error(f"GitHub credentials validation failed: {e}")
            return False
    
    async def fetch_repository_data(self, repo_identifier: str) -> RepositoryData:
        """Fetch repository data from GitHub."""
        try:
            # repo_identifier should be in format "owner/repo"
            response = await self._make_request('GET', f'{self.api_base}/repos/{repo_identifier}')
            repo_data = response.json()
            
            return RepositoryData(
                id=str(repo_data['id']),
                name=repo_data['name'],
                full_name=repo_data['full_name'],
                url=repo_data['html_url'],
                description=repo_data.get('description'),
                language=repo_data.get('language'),
                default_branch=repo_data.get('default_branch', 'main'),
                is_private=repo_data.get('private', False),
                created_at=datetime.fromisoformat(repo_data['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(repo_data['updated_at'].replace('Z', '+00:00')),
                size=repo_data.get('size', 0),
                stars=repo_data.get('stargazers_count', 0),
                forks=repo_data.get('forks_count', 0),
                topics=repo_data.get('topics', [])
            )
            
        except Exception as e:
            logger.error(f"Failed to fetch GitHub repository {repo_identifier}: {e}")
            raise MCPClientError(f"Failed to fetch repository: {e}")
    
    async def fetch_project_data(self, project_identifier: str) -> ProjectData:
        """Fetch project data from GitHub (using repository as project)."""
        # For GitHub, we treat repositories as projects
        repo_data = await self.fetch_repository_data(project_identifier)
        
        return ProjectData(
            id=repo_data.id,
            name=repo_data.name,
            key=repo_data.full_name,
            description=repo_data.description,
            url=repo_data.url,
            project_type="github",
            status="active",
            created_at=repo_data.created_at,
            updated_at=repo_data.updated_at,
            members=[],  # Would need additional API calls to fetch collaborators
            workflows=[]  # Would need additional API calls to fetch workflows
        )
    
    async def list_repositories(self, limit: int = 100) -> List[RepositoryData]:
        """List repositories accessible to the authenticated user."""
        try:
            repositories = []
            page = 1
            per_page = min(limit, 100)  # GitHub API max per page is 100
            
            while len(repositories) < limit:
                response = await self._make_request(
                    'GET', 
                    f'{self.api_base}/user/repos',
                    params={
                        'page': page,
                        'per_page': per_page,
                        'sort': 'updated',
                        'direction': 'desc'
                    }
                )
                
                repos_data = response.json()
                
                if not repos_data:  # No more repositories
                    break
                
                for repo_data in repos_data:
                    if len(repositories) >= limit:
                        break
                    
                    repo = RepositoryData(
                        id=str(repo_data['id']),
                        name=repo_data['name'],
                        full_name=repo_data['full_name'],
                        url=repo_data['html_url'],
                        description=repo_data.get('description'),
                        language=repo_data.get('language'),
                        default_branch=repo_data.get('default_branch', 'main'),
                        is_private=repo_data.get('private', False),
                        created_at=datetime.fromisoformat(repo_data['created_at'].replace('Z', '+00:00')),
                        updated_at=datetime.fromisoformat(repo_data['updated_at'].replace('Z', '+00:00')),
                        size=repo_data.get('size', 0),
                        stars=repo_data.get('stargazers_count', 0),
                        forks=repo_data.get('forks_count', 0),
                        topics=repo_data.get('topics', [])
                    )
                    repositories.append(repo)
                
                page += 1
            
            return repositories
            
        except Exception as e:
            logger.error(f"Failed to list GitHub repositories: {e}")
            raise MCPClientError(f"Failed to list repositories: {e}")
    
    async def list_projects(self, limit: int = 100) -> List[ProjectData]:
        """List projects (repositories) accessible to the authenticated user."""
        repositories = await self.list_repositories(limit)
        
        projects = []
        for repo in repositories:
            project = ProjectData(
                id=repo.id,
                name=repo.name,
                key=repo.full_name,
                description=repo.description,
                url=repo.url,
                project_type="github",
                status="active",
                created_at=repo.created_at,
                updated_at=repo.updated_at,
                members=[],
                workflows=[]
            )
            projects.append(project)
        
        return projects


class GitLabMCPClient(BaseMCPClient):
    """GitLab MCP client implementation."""
    
    def __init__(self, config: MCPConfig):
        super().__init__(config)
        self.api_base = config.endpoint.rstrip('/') + '/api/v4' if not config.endpoint.endswith('/api/v4') else config.endpoint
        self.token = config.credentials.get('token')
        
        if not self.token:
            raise MCPClientError("GitLab token is required")
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get GitLab authentication headers."""
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    async def health_check(self) -> MCPHealthCheck:
        """Perform health check on GitLab API."""
        start_time = datetime.utcnow()
        
        try:
            response = await self._make_request('GET', f'{self.api_base}/user')
            end_time = datetime.utcnow()
            
            response_time_ms = int((end_time - start_time).total_seconds() * 1000)
            
            return MCPHealthCheck(
                service_id=self.config.name,
                service_type=self.service_type,
                status=MCPConnectionStatus.CONNECTED,
                response_time_ms=response_time_ms,
                checked_at=end_time
            )
            
        except Exception as e:
            end_time = datetime.utcnow()
            logger.error(f"GitLab health check failed: {e}")
            
            return MCPHealthCheck(
                service_id=self.config.name,
                service_type=self.service_type,
                status=MCPConnectionStatus.ERROR,
                error_message=str(e),
                checked_at=end_time
            )
    
    async def validate_credentials(self) -> bool:
        """Validate GitLab credentials."""
        try:
            response = await self._make_request('GET', f'{self.api_base}/user')
            user_data = response.json()
            
            if 'username' in user_data and 'id' in user_data:
                logger.info(f"GitLab credentials validated for user: {user_data['username']}")
                return True
            
            return False
            
        except MCPAuthenticationError:
            logger.error("GitLab credentials validation failed: Invalid token")
            return False
        except Exception as e:
            logger.error(f"GitLab credentials validation failed: {e}")
            return False
    
    async def fetch_repository_data(self, repo_identifier: str) -> RepositoryData:
        """Fetch repository data from GitLab."""
        try:
            # repo_identifier can be project ID or "namespace/project"
            response = await self._make_request('GET', f'{self.api_base}/projects/{repo_identifier}')
            project_data = response.json()
            
            return RepositoryData(
                id=str(project_data['id']),
                name=project_data['name'],
                full_name=project_data['path_with_namespace'],
                url=project_data['web_url'],
                description=project_data.get('description'),
                language=None,  # GitLab doesn't provide primary language in basic project info
                default_branch=project_data.get('default_branch', 'main'),
                is_private=project_data.get('visibility') == 'private',
                created_at=datetime.fromisoformat(project_data['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(project_data['last_activity_at'].replace('Z', '+00:00')),
                size=0,  # GitLab doesn't provide repository size in basic info
                stars=project_data.get('star_count', 0),
                forks=project_data.get('forks_count', 0),
                topics=project_data.get('topics', [])
            )
            
        except Exception as e:
            logger.error(f"Failed to fetch GitLab project {repo_identifier}: {e}")
            raise MCPClientError(f"Failed to fetch repository: {e}")
    
    async def fetch_project_data(self, project_identifier: str) -> ProjectData:
        """Fetch project data from GitLab."""
        repo_data = await self.fetch_repository_data(project_identifier)
        
        return ProjectData(
            id=repo_data.id,
            name=repo_data.name,
            key=repo_data.full_name,
            description=repo_data.description,
            url=repo_data.url,
            project_type="gitlab",
            status="active",
            created_at=repo_data.created_at,
            updated_at=repo_data.updated_at,
            members=[],
            workflows=[]
        )
    
    async def list_repositories(self, limit: int = 100) -> List[RepositoryData]:
        """List repositories accessible to the authenticated user."""
        try:
            repositories = []
            page = 1
            per_page = min(limit, 100)
            
            while len(repositories) < limit:
                response = await self._make_request(
                    'GET',
                    f'{self.api_base}/projects',
                    params={
                        'page': page,
                        'per_page': per_page,
                        'order_by': 'last_activity_at',
                        'sort': 'desc',
                        'membership': 'true'
                    }
                )
                
                projects_data = response.json()
                
                if not projects_data:
                    break
                
                for project_data in projects_data:
                    if len(repositories) >= limit:
                        break
                    
                    repo = RepositoryData(
                        id=str(project_data['id']),
                        name=project_data['name'],
                        full_name=project_data['path_with_namespace'],
                        url=project_data['web_url'],
                        description=project_data.get('description'),
                        language=None,
                        default_branch=project_data.get('default_branch', 'main'),
                        is_private=project_data.get('visibility') == 'private',
                        created_at=datetime.fromisoformat(project_data['created_at'].replace('Z', '+00:00')),
                        updated_at=datetime.fromisoformat(project_data['last_activity_at'].replace('Z', '+00:00')),
                        size=0,
                        stars=project_data.get('star_count', 0),
                        forks=project_data.get('forks_count', 0),
                        topics=project_data.get('topics', [])
                    )
                    repositories.append(repo)
                
                page += 1
            
            return repositories
            
        except Exception as e:
            logger.error(f"Failed to list GitLab projects: {e}")
            raise MCPClientError(f"Failed to list repositories: {e}")
    
    async def list_projects(self, limit: int = 100) -> List[ProjectData]:
        """List projects accessible to the authenticated user."""
        repositories = await self.list_repositories(limit)
        
        projects = []
        for repo in repositories:
            project = ProjectData(
                id=repo.id,
                name=repo.name,
                key=repo.full_name,
                description=repo.description,
                url=repo.url,
                project_type="gitlab",
                status="active",
                created_at=repo.created_at,
                updated_at=repo.updated_at,
                members=[],
                workflows=[]
            )
            projects.append(project)
        
        return projects