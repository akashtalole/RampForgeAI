'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Calendar,
  Settings
} from 'lucide-react';

interface ProjectOverview {
  id: string;
  name: string;
  key: string;
  description?: string;
  project_type: string;
  status: string;
  url?: string;
  last_synced?: string;
  total_work_items: number;
  completed_work_items: number;
  in_progress_work_items: number;
  backlog_work_items: number;
  active_team_members: number;
  team_members: Array<{
    id: string;
    name: string;
    email?: string;
    role?: string;
    team?: string;
    is_active: boolean;
  }>;
  workflows: Array<{
    id: string;
    name: string;
    category?: string;
    order_index?: number;
    is_initial: boolean;
    is_final: boolean;
  }>;
  recent_work_items: Array<{
    id: string;
    external_id: string;
    title: string;
    item_type: string;
    status: string;
    assignee?: string;
    updated_at: string;
    url?: string;
  }>;
}

interface ProjectDashboardData {
  total_projects: number;
  active_projects: number;
  total_work_items: number;
  completed_work_items: number;
  in_progress_work_items: number;
  active_team_members: number;
  recent_projects: ProjectOverview[];
}

export default function ProjectDashboard() {
  const [dashboardData, setDashboardData] = useState<ProjectDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/project-management/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If no data exists, show mock data for demonstration
        if (response.status === 500) {
          const mockData: ProjectDashboardData = {
            total_projects: 0,
            active_projects: 0,
            total_work_items: 0,
            completed_work_items: 0,
            in_progress_work_items: 0,
            active_team_members: 0,
            recent_projects: []
          };
          setDashboardData(mockData);
          setError(null);
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      // Fallback to mock data if API fails
      const mockData: ProjectDashboardData = {
        total_projects: 0,
        active_projects: 0,
        total_work_items: 0,
        completed_work_items: 0,
        in_progress_work_items: 0,
        active_team_members: 0,
        recent_projects: []
      };
      setDashboardData(mockData);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const syncAllProjects = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/project-management/sync-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to sync projects');
      }

      // Refresh dashboard data after sync
      await fetchDashboardData();
    } catch (err) {
      // Don't show error for empty state, just log it
      console.warn('Sync warning:', err instanceof Error ? err.message : 'Sync failed');
      // Still refresh dashboard to show current state
      await fetchDashboardData();
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchDashboardData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const completionRate = dashboardData.total_work_items > 0 
    ? (dashboardData.completed_work_items / dashboardData.total_work_items) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600 mt-1">
            Overview of your project management integrations and current work
          </p>
        </div>
        <Button onClick={syncAllProjects} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync All'}
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.total_projects}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.active_projects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Items</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.total_work_items}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Progress value={completionRate} className="flex-1 h-2" />
              <span>{Math.round(completionRate)}% done</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.in_progress_work_items}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.completed_work_items} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.active_team_members}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>
            Latest project activity and status updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recent_projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <Badge variant="secondary">{project.key}</Badge>
                      <Badge 
                        variant={project.project_type === 'jira' ? 'default' : 'outline'}
                      >
                        {project.project_type}
                      </Badge>
                    </div>
                    
                    {project.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">
                          {project.total_work_items}
                        </div>
                        <div className="text-xs text-gray-500">Total Items</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          {project.completed_work_items}
                        </div>
                        <div className="text-xs text-gray-500">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">
                          {project.in_progress_work_items}
                        </div>
                        <div className="text-xs text-gray-500">In Progress</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">
                          {project.active_team_members}
                        </div>
                        <div className="text-xs text-gray-500">Team Members</div>
                      </div>
                    </div>

                    {project.recent_work_items.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Recent Activity</h4>
                        <div className="space-y-1">
                          {project.recent_work_items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <Badge variant="outline" className="text-xs">
                                  {item.item_type}
                                </Badge>
                                <span className="truncate">{item.title}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{item.status}</span>
                                {item.assignee && <span>• {item.assignee}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2 ml-4">
                    {project.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={project.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    
                    {project.last_synced && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          Synced {new Date(project.last_synced).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {dashboardData.recent_projects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="h-16 w-16 mx-auto mb-6 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Projects Connected</h3>
              <p className="mb-6 max-w-md mx-auto">
                Connect your project management tools like Jira or Azure DevOps to start tracking your team's work and progress.
              </p>
              <div className="space-y-3">
                <Button variant="default" className="mr-3">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Services
                </Button>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Learn More
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}