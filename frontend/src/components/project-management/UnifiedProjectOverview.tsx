'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { 
  GitBranch, 
  Users, 
  CheckCircle, 
  Clock, 
  Code,
  Database,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FileText,
  Activity,
  Zap
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

interface CodebaseInsight {
  repository_id: string;
  repository_name: string;
  complexity_score: number;
  total_files: number;
  lines_of_code: number;
  languages: Record<string, number>;
  last_analyzed?: string;
  architecture_components: Array<{
    name: string;
    type: string;
    complexity: number;
  }>;
}

interface UnifiedOverviewData {
  project: ProjectOverview;
  codebase_insights: CodebaseInsight[];
  integration_health: {
    pm_connection_status: string;
    code_analysis_status: string;
    last_sync: string;
    sync_errors: string[];
  };
}

interface UnifiedProjectOverviewProps {
  projectId: string;
}

export default function UnifiedProjectOverview({ projectId }: UnifiedProjectOverviewProps) {
  const [overviewData, setOverviewData] = useState<UnifiedOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch project management data
      const pmResponse = await fetch(`/api/v1/project-management/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!pmResponse.ok) {
        throw new Error('Failed to fetch project data');
      }

      const projectData = await pmResponse.json();

      // TODO: Fetch codebase insights when codebase analysis is implemented
      // For now, we'll use mock data structure
      const mockCodebaseInsights: CodebaseInsight[] = [];

      const unifiedData: UnifiedOverviewData = {
        project: projectData,
        codebase_insights: mockCodebaseInsights,
        integration_health: {
          pm_connection_status: 'connected',
          code_analysis_status: 'pending', // Will be 'connected' when implemented
          last_sync: projectData.last_synced || new Date().toISOString(),
          sync_errors: []
        }
      };

      setOverviewData(unifiedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const syncProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/project-management/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'current', // This would need to be determined from the project
          project_identifier: overviewData?.project.key || projectId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync project');
      }

      // Refresh data after sync
      await fetchOverviewData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, [projectId]);

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
        <Button onClick={fetchOverviewData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!overviewData) {
    return null;
  }

  const { project, codebase_insights, integration_health } = overviewData;
  const completionRate = project.total_work_items > 0 
    ? (project.completed_work_items / project.total_work_items) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <Badge variant="secondary">{project.key}</Badge>
            <Badge variant={project.project_type === 'jira' ? 'default' : 'outline'}>
              {project.project_type}
            </Badge>
          </div>
          {project.description && (
            <p className="text-gray-600 max-w-2xl">{project.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button onClick={syncProject} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          {project.url && (
            <Button variant="outline" asChild>
              <a href={project.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in {project.project_type}
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Integration Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Integration Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                integration_health.pm_connection_status === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div>
                <div className="font-medium">Project Management</div>
                <div className="text-sm text-gray-500 capitalize">
                  {integration_health.pm_connection_status}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                integration_health.code_analysis_status === 'connected' ? 'bg-green-500' : 
                integration_health.code_analysis_status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <div>
                <div className="font-medium">Code Analysis</div>
                <div className="text-sm text-gray-500 capitalize">
                  {integration_health.code_analysis_status}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <div className="font-medium">Last Sync</div>
                <div className="text-sm text-gray-500">
                  {new Date(integration_health.last_sync).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Items</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.total_work_items}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
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
            <div className="text-2xl font-bold">{project.in_progress_work_items}</div>
            <p className="text-xs text-muted-foreground">
              {project.backlog_work_items} in backlog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.active_team_members}</div>
            <p className="text-xs text-muted-foreground">
              {project.team_members.filter(m => m.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.workflows.length}</div>
            <p className="text-xs text-muted-foreground">
              Status configurations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Codebase Insights (when available) */}
      {codebase_insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Codebase Insights</span>
            </CardTitle>
            <CardDescription>
              Analysis of connected repositories and code complexity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {codebase_insights.map((insight) => (
                <div key={insight.repository_id} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Database className="h-4 w-4 text-gray-500" />
                    <h3 className="font-medium">{insight.repository_name}</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Complexity Score:</span>
                      <Badge variant={insight.complexity_score > 7 ? 'destructive' : 
                                   insight.complexity_score > 4 ? 'default' : 'secondary'}>
                        {insight.complexity_score}/10
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Files:</span>
                      <span>{insight.total_files.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lines of Code:</span>
                      <span>{insight.lines_of_code.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {Object.keys(insight.languages).length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium mb-2">Languages:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(insight.languages).slice(0, 3).map(([lang, percentage]) => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang} {Math.round(percentage)}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team and Workflow Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Members</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.team_members.slice(0, 8).map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      member.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <div>
                      <div className="font-medium text-sm">{member.name}</div>
                      {member.email && (
                        <div className="text-xs text-gray-500">{member.email}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {member.role && (
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    )}
                    {member.team && (
                      <div className="text-xs text-gray-500 mt-1">{member.team}</div>
                    )}
                  </div>
                </div>
              ))}
              
              {project.team_members.length > 8 && (
                <div className="text-center text-sm text-gray-500 pt-2">
                  +{project.team_members.length - 8} more members
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.recent_work_items.map((item) => (
                <div key={item.id} className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {item.item_type}
                      </Badge>
                      <span className="text-xs text-gray-500">{item.status}</span>
                    </div>
                    <div className="font-medium text-sm truncate">{item.title}</div>
                    <div className="text-xs text-gray-500">
                      {item.assignee && `Assigned to ${item.assignee} • `}
                      Updated {new Date(item.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  {item.url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
              
              {project.recent_work_items.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Configuration */}
      {project.workflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Workflow Configuration</span>
            </CardTitle>
            <CardDescription>
              Current workflow statuses and transitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.workflows
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                .map((workflow, index) => (
                <div key={workflow.id} className="flex items-center space-x-2">
                  <Badge 
                    variant={workflow.is_initial ? 'default' : 
                            workflow.is_final ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {workflow.name}
                  </Badge>
                  {index < project.workflows.length - 1 && (
                    <span className="text-gray-400">→</span>
                  )}
                </div>
              ))}
            </div>
            
            {project.workflows.some(w => w.category) && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Categories:</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(project.workflows.map(w => w.category).filter(Boolean))).map((category) => (
                    <Badge key={category} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}