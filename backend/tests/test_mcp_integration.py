"""
Integration tests for MCP service connectivity and data fetching.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

from app.services.mcp_client import MCPClientManager, BaseMCPClient, MCPClientError
from app.services.mcp_github import GitHubMCPClient, GitLabMCPClient
from app.services.mcp_jira import JiraMCPClient, AzureDevOpsMCPClient
from app.models.mcp import (
    MCPConfig, MCPServiceType, MCPConnectionStatus,
    RepositoryData, ProjectData, MCPHealthCheck
)


class TestMCPClientManager:
    """Test MCP client manager functionality."""
    
    @pytest.fixture
    def manager(self):
        """Create a fresh MCP client manager."""
        return MCPClientManager()
    
    @pytest.fixture
    def github_config(self):
        """Create a GitHub MCP configuration."""
        return MCPConfig(
            service_type=MCPServiceType.GITHUB,
            name="Test GitHub",
            endpoint="https://api.github.com",
            credentials={"token": "test_token"},
            enabled=True
        )
    
    def test_register_client_class(self, manager):
        """Test registering MCP client classes."""
        manager.register_client_class(MCPServiceType.GITHUB, GitHubMCPClient)
        
        assert MCPServiceType.GITHUB in manager._client_classes
        assert manager._client_classes[MCPServiceType.GITHUB] == GitHubMCPClient
    
    @pytest.mark.asyncio
    async def test_create_client_success(self, manager, github_config):
        """Test successful client creation."""
        manager.register_client_class(MCPServiceType.GITHUB, GitHubMCPClient)
        
        client = await manager.create_client(github_config)
        
        assert isinstance(client, GitHubMCPClient)
        assert client.config == github_config
    
    @pytest.mark.asyncio
    async def test_create_client_unregistered_type(self, manager, github_config):
        """Test client creation with unregistered service type."""
        with pytest.raises(MCPClientError, match="No client registered"):
            await manager.create_client(github_config)


class TestGitHubMCPClient:
    """Test GitHub MCP client functionality."""
    
    @pytest.fixture
    def github_config(self):
        """Create a GitHub MCP configuration."""
        return MCPConfig(
            service_type=MCPServiceType.GITHUB,
            name="Test GitHub",
            endpoint="https://api.github.com",
            credentials={"token": "test_token"},
            enabled=True
        )
    
    @pytest.fixture
    def github_client(self, github_config):
        """Create a GitHub MCP client."""
        return GitHubMCPClient(github_config)
    
    def test_client_initialization(self, github_client):
        """Test GitHub client initialization."""
        assert github_client.service_type == MCPServiceType.GITHUB
        assert github_client.token == "test_token"
        assert github_client.api_base == "https://api.github.com/api/v1"
    
    def test_auth_headers(self, github_client):
        """Test GitHub authentication headers."""
        headers = github_client._get_auth_headers()
        
        assert "Authorization" in headers
        assert headers["Authorization"] == "token test_token"
        assert headers["Accept"] == "application/vnd.github.v3+json"
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, github_client):
        """Test successful GitHub health check."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"login": "testuser", "id": 12345}
        
        with patch.object(github_client, '_make_request', return_value=mock_response):
            health_check = await github_client.health_check()
            
            assert health_check.service_type == MCPServiceType.GITHUB
            assert health_check.status == MCPConnectionStatus.CONNECTED
            assert health_check.response_time_ms is not None
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self, github_client):
        """Test failed GitHub health check."""
        with patch.object(github_client, '_make_request', side_effect=Exception("Connection failed")):
            health_check = await github_client.health_check()
            
            assert health_check.status == MCPConnectionStatus.ERROR
            assert "Connection failed" in health_check.error_message
    
    @pytest.mark.asyncio
    async def test_validate_credentials_success(self, github_client):
        """Test successful GitHub credentials validation."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"login": "testuser", "id": 12345}
        
        with patch.object(github_client, '_make_request', return_value=mock_response):
            is_valid = await github_client.validate_credentials()
            
            assert is_valid is True
    
    @pytest.mark.asyncio
    async def test_validate_credentials_failure(self, github_client):
        """Test failed GitHub credentials validation."""
        with patch.object(github_client, '_make_request', side_effect=Exception("Invalid token")):
            is_valid = await github_client.validate_credentials()
            
            assert is_valid is False
    
    @pytest.mark.asyncio
    async def test_fetch_repository_data(self, github_client):
        """Test fetching GitHub repository data."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "id": 12345,
            "name": "test-repo",
            "full_name": "testuser/test-repo",
            "html_url": "https://github.com/testuser/test-repo",
            "description": "Test repository",
            "language": "Python",
            "default_branch": "main",
            "private": False,
            "created_at": "2023-01-01T00:00:00Z",
            "updated_at": "2023-01-02T00:00:00Z",
            "size": 1024,
            "stargazers_count": 10,
            "forks_count": 5,
            "topics": ["python", "test"]
        }
        
        with patch.object(github_client, '_make_request', return_value=mock_response):
            repo_data = await github_client.fetch_repository_data("testuser/test-repo")
            
            assert isinstance(repo_data, RepositoryData)
            assert repo_data.name == "test-repo"
            assert repo_data.full_name == "testuser/test-repo"
            assert repo_data.language == "Python"
            assert repo_data.stars == 10
    
    @pytest.mark.asyncio
    async def test_list_repositories(self, github_client):
        """Test listing GitHub repositories."""
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {
                "id": 12345,
                "name": "repo1",
                "full_name": "testuser/repo1",
                "html_url": "https://github.com/testuser/repo1",
                "description": "First repo",
                "language": "Python",
                "default_branch": "main",
                "private": False,
                "created_at": "2023-01-01T00:00:00Z",
                "updated_at": "2023-01-02T00:00:00Z",
                "size": 1024,
                "stargazers_count": 10,
                "forks_count": 5,
                "topics": []
            },
            {
                "id": 67890,
                "name": "repo2",
                "full_name": "testuser/repo2",
                "html_url": "https://github.com/testuser/repo2",
                "description": "Second repo",
                "language": "JavaScript",
                "default_branch": "main",
                "private": True,
                "created_at": "2023-01-01T00:00:00Z",
                "updated_at": "2023-01-02T00:00:00Z",
                "size": 2048,
                "stargazers_count": 20,
                "forks_count": 10,
                "topics": ["javascript"]
            }
        ]
        
        with patch.object(github_client, '_make_request', return_value=mock_response):
            repositories = await github_client.list_repositories(limit=10)
            
            assert len(repositories) == 2
            assert all(isinstance(repo, RepositoryData) for repo in repositories)
            assert repositories[0].name == "repo1"
            assert repositories[1].name == "repo2"


class TestJiraMCPClient:
    """Test Jira MCP client functionality."""
    
    @pytest.fixture
    def jira_config(self):
        """Create a Jira MCP configuration."""
        return MCPConfig(
            service_type=MCPServiceType.JIRA,
            name="Test Jira",
            endpoint="https://test.atlassian.net",
            credentials={
                "username": "test@example.com",
                "api_token": "test_token"
            },
            enabled=True
        )
    
    @pytest.fixture
    def jira_client(self, jira_config):
        """Create a Jira MCP client."""
        return JiraMCPClient(jira_config)
    
    def test_client_initialization(self, jira_client):
        """Test Jira client initialization."""
        assert jira_client.service_type == MCPServiceType.JIRA
        assert jira_client.username == "test@example.com"
        assert jira_client.api_token == "test_token"
    
    def test_auth_headers(self, jira_client):
        """Test Jira authentication headers."""
        headers = jira_client._get_auth_headers()
        
        assert "Authorization" in headers
        assert headers["Authorization"].startswith("Basic ")
        assert headers["Accept"] == "application/json"
    
    @pytest.mark.asyncio
    async def test_fetch_project_data(self, jira_client):
        """Test fetching Jira project data."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "id": "10000",
            "key": "TEST",
            "name": "Test Project",
            "description": "A test project",
            "self": "https://test.atlassian.net/rest/api/3/project/10000"
        }
        
        # Mock workflow and members responses
        workflow_response = MagicMock()
        workflow_response.json.return_value = []
        
        roles_response = MagicMock()
        roles_response.json.return_value = {}
        
        with patch.object(jira_client, '_make_request') as mock_request:
            mock_request.side_effect = [mock_response, workflow_response, roles_response]
            
            project_data = await jira_client.fetch_project_data("TEST")
            
            assert isinstance(project_data, ProjectData)
            assert project_data.name == "Test Project"
            assert project_data.key == "TEST"
            assert project_data.project_type == "jira"
    
    @pytest.mark.asyncio
    async def test_list_projects(self, jira_client):
        """Test listing Jira projects."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "values": [
                {
                    "id": "10000",
                    "key": "TEST1",
                    "name": "Test Project 1",
                    "description": "First test project",
                    "self": "https://test.atlassian.net/rest/api/3/project/10000"
                },
                {
                    "id": "10001",
                    "key": "TEST2",
                    "name": "Test Project 2",
                    "description": "Second test project",
                    "self": "https://test.atlassian.net/rest/api/3/project/10001"
                }
            ],
            "total": 2
        }
        
        with patch.object(jira_client, '_make_request', return_value=mock_response):
            projects = await jira_client.list_projects(limit=10)
            
            assert len(projects) == 2
            assert all(isinstance(project, ProjectData) for project in projects)
            assert projects[0].name == "Test Project 1"
            assert projects[1].name == "Test Project 2"


class TestMCPIntegrationFlow:
    """Test complete MCP integration workflows."""
    
    @pytest.mark.asyncio
    async def test_complete_github_integration_flow(self):
        """Test complete GitHub integration workflow."""
        # Setup
        config = MCPConfig(
            service_type=MCPServiceType.GITHUB,
            name="Integration Test GitHub",
            endpoint="https://api.github.com",
            credentials={"token": "test_token"},
            enabled=True
        )
        
        manager = MCPClientManager()
        manager.register_client_class(MCPServiceType.GITHUB, GitHubMCPClient)
        
        # Mock responses
        mock_user_response = MagicMock()
        mock_user_response.json.return_value = {"login": "testuser", "id": 12345}
        
        mock_repos_response = MagicMock()
        mock_repos_response.json.return_value = [
            {
                "id": 12345,
                "name": "test-repo",
                "full_name": "testuser/test-repo",
                "html_url": "https://github.com/testuser/test-repo",
                "description": "Test repository",
                "language": "Python",
                "default_branch": "main",
                "private": False,
                "created_at": "2023-01-01T00:00:00Z",
                "updated_at": "2023-01-02T00:00:00Z",
                "size": 1024,
                "stargazers_count": 10,
                "forks_count": 5,
                "topics": ["python"]
            }
        ]
        
        # Test workflow
        client = await manager.create_client(config)
        
        with patch.object(client, '_make_request') as mock_request:
            # Mock connection and validation
            mock_request.return_value = mock_user_response
            
            await client.connect()
            is_valid = await client.validate_credentials()
            assert is_valid is True
            
            # Mock repository listing
            mock_request.return_value = mock_repos_response
            repositories = await client.list_repositories(limit=10)
            
            assert len(repositories) == 1
            assert repositories[0].name == "test-repo"
            
            await client.disconnect()
    
    @pytest.mark.asyncio
    async def test_error_handling_and_retry_logic(self):
        """Test error handling and retry logic."""
        config = MCPConfig(
            service_type=MCPServiceType.GITHUB,
            name="Error Test GitHub",
            endpoint="https://api.github.com",
            credentials={"token": "invalid_token"},
            enabled=True,
            retry_attempts=2
        )
        
        client = GitHubMCPClient(config)
        
        # Test authentication error
        with patch.object(client, '_client') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 401
            mock_response.raise_for_status.side_effect = Exception("Unauthorized")
            
            mock_client.request.return_value = mock_response
            
            with pytest.raises(Exception):
                await client._make_request('GET', '/test')
    
    @pytest.mark.asyncio
    async def test_rate_limiting(self):
        """Test rate limiting functionality."""
        config = MCPConfig(
            service_type=MCPServiceType.GITHUB,
            name="Rate Limit Test",
            endpoint="https://api.github.com",
            credentials={"token": "test_token"},
            enabled=True,
            rate_limits={"requests_per_minute": 1, "requests_per_hour": 10}
        )
        
        client = GitHubMCPClient(config)
        
        # Mock successful response
        with patch.object(client, '_client') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.raise_for_status.return_value = None
            
            mock_client.request.return_value = mock_response
            
            # First request should succeed
            await client._make_request('GET', '/test')
            
            # Second request should be rate limited (would need to wait)
            # This is a simplified test - in reality we'd test the timing
            assert len(client._rate_limiter["last_request_times"]) == 1


@pytest.mark.asyncio
async def test_mcp_service_registration():
    """Test MCP service type registration."""
    manager = MCPClientManager()
    
    # Register all client types
    manager.register_client_class(MCPServiceType.GITHUB, GitHubMCPClient)
    manager.register_client_class(MCPServiceType.GITLAB, GitLabMCPClient)
    manager.register_client_class(MCPServiceType.JIRA, JiraMCPClient)
    manager.register_client_class(MCPServiceType.AZURE_DEVOPS, AzureDevOpsMCPClient)
    
    # Verify all types are registered
    assert len(manager._client_classes) == 4
    assert MCPServiceType.GITHUB in manager._client_classes
    assert MCPServiceType.GITLAB in manager._client_classes
    assert MCPServiceType.JIRA in manager._client_classes
    assert MCPServiceType.AZURE_DEVOPS in manager._client_classes


@pytest.mark.asyncio
async def test_concurrent_mcp_operations():
    """Test concurrent MCP operations."""
    configs = [
        MCPConfig(
            service_type=MCPServiceType.GITHUB,
            name=f"GitHub {i}",
            endpoint="https://api.github.com",
            credentials={"token": f"token_{i}"},
            enabled=True
        )
        for i in range(3)
    ]
    
    manager = MCPClientManager()
    manager.register_client_class(MCPServiceType.GITHUB, GitHubMCPClient)
    
    # Create multiple clients concurrently
    clients = await asyncio.gather(*[
        manager.create_client(config) for config in configs
    ])
    
    assert len(clients) == 3
    assert all(isinstance(client, GitHubMCPClient) for client in clients)