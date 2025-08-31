"""
Jira MCP client implementation.
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional
from urllib.parse import urljoin
import base64

import httpx

from .mcp_client import BaseMCPClient, MCPClientError, MCPAuthenticationError
from ..models.mcp import (
    MCPConfig, MCPHealthCheck, MCPConnectionStatus,
    RepositoryData, ProjectData
)


logger = logging.getLogger(__name__)


class JiraMCPClient(BaseMCPClient):
    """Jira MCP client implementation."""
    
    def __init__(self, config: MCPConfig):
        super().__init__(config)
        self.api_base = config.endpoint.rstrip('/') + '/rest/api/3' if not config.endpoint.endswith('/rest/api/3') else config.endpoint
        self.username = config.credentials.get('username')
        self.api_token = config.credentials.get('api_token')
        
        if not self.username or not self.api_token:
            raise MCPClientError("Jira username and API token are required")
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get Jira authentication headers."""
        # Jira uses Basic Auth with username:api_token
        auth_string = f"{self.username}:{self.api_token}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        return {
            'Authorization': f'Basic {auth_b64}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    
    async def health_check(self) -> MCPHealthCheck:
        """Perform health check on Jira API."""
        start_time = datetime.utcnow()
        
        try:
            response = await self._make_request('GET', f'{self.api_base}/myself')
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
            logger.error(f"Jira health check failed: {e}")
            
            return MCPHealthCheck(
                service_id=self.config.name,
                service_type=self.service_type,
                status=MCPConnectionStatus.ERROR,
                error_message=str(e),
                checked_at=end_time
            )
    
    async def validate_credentials(self) -> bool:
        """Validate Jira credentials."""
        try:
            response = await self._make_request('GET', f'{self.api_base}/myself')
            user_data = response.json()
            
            if 'accountId' in user_data and 'emailAddress' in user_data:
                logger.info(f"Jira credentials validated for user: {user_data['emailAddress']}")
                return True
            
            return False
            
        except MCPAuthenticationError:
            logger.error("Jira credentials validation failed: Invalid credentials")
            return False
        except Exception as e:
            logger.error(f"Jira credentials validation failed: {e}")
            return False
    
    async def fetch_repository_data(self, repo_identifier: str) -> RepositoryData:
        """Fetch repository data from Jira (not applicable, raises error)."""
        raise MCPClientError("Jira does not support repository data - use fetch_project_data instead")
    
    async def fetch_project_data(self, project_identifier: str) -> ProjectData:
        """Fetch project data from Jira."""
        try:
            # project_identifier should be project key or ID
            response = await self._make_request('GET', f'{self.api_base}/project/{project_identifier}')
            project_data = response.json()
            
            # Get project workflows
            workflows = []
            try:
                workflow_response = await self._make_request(
                    'GET', 
                    f'{self.api_base}/project/{project_identifier}/statuses'
                )
                workflow_data = workflow_response.json()
                workflows = [
                    {
                        'name': status.get('name'),
                        'id': status.get('id'),
                        'category': status.get('statusCategory', {}).get('name')
                    }
                    for issue_type in workflow_data
                    for status in issue_type.get('statuses', [])
                ]
            except Exception as e:
                logger.warning(f"Failed to fetch workflows for project {project_identifier}: {e}")
            
            # Get project members (roles)
            members = []
            try:
                roles_response = await self._make_request(
                    'GET',
                    f'{self.api_base}/project/{project_identifier}/role'
                )
                roles_data = roles_response.json()
                
                for role_url in roles_data.values():
                    try:
                        role_response = await self._make_request('GET', role_url)
                        role_data = role_response.json()
                        
                        for actor in role_data.get('actors', []):
                            if actor.get('type') == 'atlassian-user-role-actor':
                                members.append({
                                    'name': actor.get('displayName'),
                                    'accountId': actor.get('actorUser', {}).get('accountId'),
                                    'role': role_data.get('name')
                                })
                    except Exception as e:
                        logger.warning(f"Failed to fetch role details: {e}")
                        
            except Exception as e:
                logger.warning(f"Failed to fetch members for project {project_identifier}: {e}")
            
            return ProjectData(
                id=str(project_data['id']),
                name=project_data['name'],
                key=project_data['key'],
                description=project_data.get('description'),
                url=project_data.get('self'),
                project_type="jira",
                status=project_data.get('projectCategory', {}).get('name', 'active'),
                created_at=datetime.utcnow(),  # Jira doesn't provide creation date in basic info
                updated_at=datetime.utcnow(),
                members=members,
                workflows=workflows
            )
            
        except Exception as e:
            logger.error(f"Failed to fetch Jira project {project_identifier}: {e}")
            raise MCPClientError(f"Failed to fetch project: {e}")
    
    async def list_repositories(self, limit: int = 100) -> List[RepositoryData]:
        """List repositories (not applicable for Jira)."""
        return []  # Jira doesn't have repositories
    
    async def list_projects(self, limit: int = 100) -> List[ProjectData]:
        """List projects accessible to the authenticated user."""
        try:
            projects = []
            start_at = 0
            max_results = min(limit, 50)  # Jira API max per request
            
            while len(projects) < limit:
                response = await self._make_request(
                    'GET',
                    f'{self.api_base}/project/search',
                    params={
                        'startAt': start_at,
                        'maxResults': max_results,
                        'orderBy': 'name'
                    }
                )
                
                data = response.json()
                project_list = data.get('values', [])
                
                if not project_list:
                    break
                
                for project_data in project_list:
                    if len(projects) >= limit:
                        break
                    
                    project = ProjectData(
                        id=str(project_data['id']),
                        name=project_data['name'],
                        key=project_data['key'],
                        description=project_data.get('description'),
                        url=project_data.get('self'),
                        project_type="jira",
                        status=project_data.get('projectCategory', {}).get('name', 'active'),
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                        members=[],
                        workflows=[]
                    )
                    projects.append(project)
                
                start_at += max_results
                
                # Check if we've reached the end
                if start_at >= data.get('total', 0):
                    break
            
            return projects
            
        except Exception as e:
            logger.error(f"Failed to list Jira projects: {e}")
            raise MCPClientError(f"Failed to list projects: {e}")
    
    async def fetch_work_items(self, project_identifier: str, limit: int = 100) -> List[Dict]:
        """Fetch work items (issues) for a Jira project."""
        try:
            work_items = []
            start_at = 0
            max_results = min(limit, 50)  # Jira API max per request
            
            while len(work_items) < limit:
                # JQL query to get issues for the project
                jql = f"project = {project_identifier} ORDER BY updated DESC"
                
                response = await self._make_request(
                    'GET',
                    f'{self.api_base}/search',
                    params={
                        'jql': jql,
                        'startAt': start_at,
                        'maxResults': max_results,
                        'fields': 'id,key,summary,description,issuetype,status,priority,assignee,reporter,created,updated,resolutiondate,customfield_10016'  # customfield_10016 is story points
                    }
                )
                
                data = response.json()
                issues = data.get('issues', [])
                
                if not issues:
                    break
                
                for issue in issues:
                    if len(work_items) >= limit:
                        break
                    
                    fields = issue.get('fields', {})
                    
                    # Parse story points (may be in different custom fields)
                    story_points = fields.get('customfield_10016')  # Common story points field
                    if story_points is None:
                        # Try other common story points fields
                        for field_name in ['customfield_10002', 'customfield_10004', 'customfield_10008']:
                            story_points = fields.get(field_name)
                            if story_points is not None:
                                break
                    
                    # Parse resolution date
                    resolved_at = None
                    if fields.get('resolutiondate'):
                        try:
                            resolved_at = datetime.fromisoformat(fields['resolutiondate'].replace('Z', '+00:00'))
                        except:
                            pass
                    
                    work_item = {
                        'id': issue['key'],
                        'title': fields.get('summary', ''),
                        'description': fields.get('description'),
                        'type': fields.get('issuetype', {}).get('name', 'Task'),
                        'status': fields.get('status', {}).get('name', ''),
                        'priority': fields.get('priority', {}).get('name'),
                        'assignee': fields.get('assignee', {}).get('displayName') if fields.get('assignee') else None,
                        'reporter': fields.get('reporter', {}).get('displayName') if fields.get('reporter') else None,
                        'story_points': story_points,
                        'labels': fields.get('labels', []),
                        'url': f"{self.config.endpoint.rstrip('/rest/api/3')}/browse/{issue['key']}",
                        'resolved_at': resolved_at
                    }
                    work_items.append(work_item)
                
                start_at += max_results
                
                # Check if we've reached the end
                if start_at >= data.get('total', 0):
                    break
            
            return work_items
            
        except Exception as e:
            logger.error(f"Failed to fetch work items for project {project_identifier}: {e}")
            raise MCPClientError(f"Failed to fetch work items: {e}")


class AzureDevOpsMCPClient(BaseMCPClient):
    """Azure DevOps MCP client implementation."""
    
    def __init__(self, config: MCPConfig):
        super().__init__(config)
        # Azure DevOps API endpoint format: https://dev.azure.com/{organization}
        self.organization = config.credentials.get('organization')
        self.personal_access_token = config.credentials.get('personal_access_token')
        
        if not self.organization or not self.personal_access_token:
            raise MCPClientError("Azure DevOps organization and personal access token are required")
        
        self.api_base = f"https://dev.azure.com/{self.organization}/_apis"
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get Azure DevOps authentication headers."""
        # Azure DevOps uses Basic Auth with empty username and PAT as password
        auth_string = f":{self.personal_access_token}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        return {
            'Authorization': f'Basic {auth_b64}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    
    async def health_check(self) -> MCPHealthCheck:
        """Perform health check on Azure DevOps API."""
        start_time = datetime.utcnow()
        
        try:
            response = await self._make_request(
                'GET', 
                f'{self.api_base}/projects',
                params={'api-version': '7.0'}
            )
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
            logger.error(f"Azure DevOps health check failed: {e}")
            
            return MCPHealthCheck(
                service_id=self.config.name,
                service_type=self.service_type,
                status=MCPConnectionStatus.ERROR,
                error_message=str(e),
                checked_at=end_time
            )
    
    async def validate_credentials(self) -> bool:
        """Validate Azure DevOps credentials."""
        try:
            response = await self._make_request(
                'GET',
                f'{self.api_base}/projects',
                params={'api-version': '7.0'}
            )
            
            data = response.json()
            if 'value' in data:
                logger.info(f"Azure DevOps credentials validated for organization: {self.organization}")
                return True
            
            return False
            
        except MCPAuthenticationError:
            logger.error("Azure DevOps credentials validation failed: Invalid PAT")
            return False
        except Exception as e:
            logger.error(f"Azure DevOps credentials validation failed: {e}")
            return False
    
    async def fetch_repository_data(self, repo_identifier: str) -> RepositoryData:
        """Fetch repository data from Azure DevOps."""
        try:
            # repo_identifier should be in format "project/repository"
            project_name, repo_name = repo_identifier.split('/', 1)
            
            response = await self._make_request(
                'GET',
                f'{self.api_base}/git/repositories/{repo_name}',
                params={
                    'project': project_name,
                    'api-version': '7.0'
                }
            )
            
            repo_data = response.json()
            
            return RepositoryData(
                id=repo_data['id'],
                name=repo_data['name'],
                full_name=f"{project_name}/{repo_data['name']}",
                url=repo_data['webUrl'],
                description=None,  # Azure DevOps repos don't have descriptions in basic info
                language=None,
                default_branch=repo_data.get('defaultBranch', 'refs/heads/main').replace('refs/heads/', ''),
                is_private=True,  # Azure DevOps repos are typically private
                created_at=datetime.utcnow(),  # Not provided in basic repo info
                updated_at=datetime.utcnow(),
                size=repo_data.get('size', 0),
                stars=0,  # Azure DevOps doesn't have stars
                forks=0,  # Azure DevOps doesn't have forks in the same way
                topics=[]
            )
            
        except Exception as e:
            logger.error(f"Failed to fetch Azure DevOps repository {repo_identifier}: {e}")
            raise MCPClientError(f"Failed to fetch repository: {e}")
    
    async def fetch_project_data(self, project_identifier: str) -> ProjectData:
        """Fetch project data from Azure DevOps."""
        try:
            response = await self._make_request(
                'GET',
                f'{self.api_base}/projects/{project_identifier}',
                params={'api-version': '7.0'}
            )
            
            project_data = response.json()
            
            # Get team members
            members = []
            try:
                teams_response = await self._make_request(
                    'GET',
                    f'{self.api_base}/projects/{project_identifier}/teams',
                    params={'api-version': '7.0'}
                )
                
                teams_data = teams_response.json()
                for team in teams_data.get('value', []):
                    try:
                        members_response = await self._make_request(
                            'GET',
                            f'{self.api_base}/projects/{project_identifier}/teams/{team["id"]}/members',
                            params={'api-version': '7.0'}
                        )
                        
                        team_members = members_response.json()
                        for member in team_members.get('value', []):
                            members.append({
                                'name': member.get('displayName'),
                                'uniqueName': member.get('uniqueName'),
                                'team': team.get('name')
                            })
                    except Exception as e:
                        logger.warning(f"Failed to fetch team members: {e}")
                        
            except Exception as e:
                logger.warning(f"Failed to fetch teams for project {project_identifier}: {e}")
            
            return ProjectData(
                id=project_data['id'],
                name=project_data['name'],
                key=project_data['name'],  # Azure DevOps doesn't have separate keys
                description=project_data.get('description'),
                url=project_data['url'],
                project_type="azure_devops",
                status=project_data.get('state', 'wellFormed'),
                created_at=datetime.utcnow(),  # Not provided in basic project info
                updated_at=datetime.fromisoformat(project_data['lastUpdateTime'].replace('Z', '+00:00')),
                members=members,
                workflows=[]  # Would need additional API calls for work item types/states
            )
            
        except Exception as e:
            logger.error(f"Failed to fetch Azure DevOps project {project_identifier}: {e}")
            raise MCPClientError(f"Failed to fetch project: {e}")
    
    async def list_repositories(self, limit: int = 100) -> List[RepositoryData]:
        """List repositories across all accessible projects."""
        try:
            repositories = []
            
            # First get all projects
            projects_response = await self._make_request(
                'GET',
                f'{self.api_base}/projects',
                params={'api-version': '7.0'}
            )
            
            projects_data = projects_response.json()
            
            for project in projects_data.get('value', []):
                if len(repositories) >= limit:
                    break
                
                try:
                    # Get repositories for this project
                    repos_response = await self._make_request(
                        'GET',
                        f'{self.api_base}/git/repositories',
                        params={
                            'project': project['id'],
                            'api-version': '7.0'
                        }
                    )
                    
                    repos_data = repos_response.json()
                    
                    for repo_data in repos_data.get('value', []):
                        if len(repositories) >= limit:
                            break
                        
                        repo = RepositoryData(
                            id=repo_data['id'],
                            name=repo_data['name'],
                            full_name=f"{project['name']}/{repo_data['name']}",
                            url=repo_data['webUrl'],
                            description=None,
                            language=None,
                            default_branch=repo_data.get('defaultBranch', 'refs/heads/main').replace('refs/heads/', ''),
                            is_private=True,
                            created_at=datetime.utcnow(),
                            updated_at=datetime.utcnow(),
                            size=repo_data.get('size', 0),
                            stars=0,
                            forks=0,
                            topics=[]
                        )
                        repositories.append(repo)
                        
                except Exception as e:
                    logger.warning(f"Failed to fetch repositories for project {project['name']}: {e}")
            
            return repositories
            
        except Exception as e:
            logger.error(f"Failed to list Azure DevOps repositories: {e}")
            raise MCPClientError(f"Failed to list repositories: {e}")
    
    async def list_projects(self, limit: int = 100) -> List[ProjectData]:
        """List projects accessible to the authenticated user."""
        try:
            response = await self._make_request(
                'GET',
                f'{self.api_base}/projects',
                params={
                    'api-version': '7.0',
                    '$top': min(limit, 100)
                }
            )
            
            data = response.json()
            projects = []
            
            for project_data in data.get('value', []):
                if len(projects) >= limit:
                    break
                
                project = ProjectData(
                    id=project_data['id'],
                    name=project_data['name'],
                    key=project_data['name'],
                    description=project_data.get('description'),
                    url=project_data['url'],
                    project_type="azure_devops",
                    status=project_data.get('state', 'wellFormed'),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.fromisoformat(project_data['lastUpdateTime'].replace('Z', '+00:00')),
                    members=[],
                    workflows=[]
                )
                projects.append(project)
            
            return projects
            
        except Exception as e:
            logger.error(f"Failed to list Azure DevOps projects: {e}")
            raise MCPClientError(f"Failed to list projects: {e}")
    
    async def fetch_work_items(self, project_identifier: str, limit: int = 100) -> List[Dict]:
        """Fetch work items for an Azure DevOps project."""
        try:
            work_items = []
            
            # First, get work item IDs using WIQL (Work Item Query Language)
            wiql_query = {
                "query": f"SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] FROM WorkItems WHERE [System.TeamProject] = '{project_identifier}' ORDER BY [System.ChangedDate] DESC"
            }
            
            response = await self._make_request(
                'POST',
                f'{self.api_base}/wit/wiql',
                params={'api-version': '7.0'},
                json=wiql_query
            )
            
            data = response.json()
            work_item_refs = data.get('workItems', [])
            
            if not work_item_refs:
                return work_items
            
            # Get detailed work item information in batches
            work_item_ids = [str(ref['id']) for ref in work_item_refs[:limit]]
            
            if work_item_ids:
                ids_param = ','.join(work_item_ids)
                response = await self._make_request(
                    'GET',
                    f'{self.api_base}/wit/workitems',
                    params={
                        'ids': ids_param,
                        'api-version': '7.0',
                        '$expand': 'fields'
                    }
                )
                
                data = response.json()
                
                for item in data.get('value', []):
                    fields = item.get('fields', {})
                    
                    # Parse resolved date
                    resolved_at = None
                    if fields.get('Microsoft.VSTS.Common.ResolvedDate'):
                        try:
                            resolved_at = datetime.fromisoformat(fields['Microsoft.VSTS.Common.ResolvedDate'].replace('Z', '+00:00'))
                        except:
                            pass
                    elif fields.get('Microsoft.VSTS.Common.ClosedDate'):
                        try:
                            resolved_at = datetime.fromisoformat(fields['Microsoft.VSTS.Common.ClosedDate'].replace('Z', '+00:00'))
                        except:
                            pass
                    
                    # Get story points (effort)
                    story_points = fields.get('Microsoft.VSTS.Scheduling.Effort')
                    if story_points is None:
                        story_points = fields.get('Microsoft.VSTS.Scheduling.StoryPoints')
                    
                    # Get tags as labels
                    tags = fields.get('System.Tags', '')
                    labels = [tag.strip() for tag in tags.split(';') if tag.strip()] if tags else []
                    
                    work_item = {
                        'id': str(item['id']),
                        'title': fields.get('System.Title', ''),
                        'description': fields.get('System.Description'),
                        'type': fields.get('System.WorkItemType', 'Task'),
                        'status': fields.get('System.State', ''),
                        'priority': fields.get('Microsoft.VSTS.Common.Priority'),
                        'assignee': fields.get('System.AssignedTo', {}).get('displayName') if fields.get('System.AssignedTo') else None,
                        'reporter': fields.get('System.CreatedBy', {}).get('displayName') if fields.get('System.CreatedBy') else None,
                        'story_points': story_points,
                        'labels': labels,
                        'url': f"https://dev.azure.com/{self.organization}/{project_identifier}/_workitems/edit/{item['id']}",
                        'resolved_at': resolved_at
                    }
                    work_items.append(work_item)
            
            return work_items
            
        except Exception as e:
            logger.error(f"Failed to fetch work items for project {project_identifier}: {e}")
            raise MCPClientError(f"Failed to fetch work items: {e}")