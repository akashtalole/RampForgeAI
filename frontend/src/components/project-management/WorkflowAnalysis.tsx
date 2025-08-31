'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp,
  RefreshCw,
  AlertCircle,
  PieChart,
  Activity,
  MessageSquare
} from 'lucide-react';

interface WorkflowInsight {
  project_id: string;
  analysis_date: string;
  workflow_patterns: {
    status_distribution: Record<string, number>;
    type_distribution: Record<string, number>;
    priority_distribution: Record<string, number>;
    completion_trends: Record<string, number>;
  };
  communication_patterns: {
    most_active_assignees: Record<string, number>;
    most_active_reporters: Record<string, number>;
    team_distribution: Record<string, number>;
    role_distribution: Record<string, number>;
  };
  team_metrics: {
    active_members: number;
    avg_completion_time_days: number | null;
    velocity_story_points: number | null;
  };
}

interface WorkflowAnalysisData {
  total_projects_analyzed: number;
  insights: WorkflowInsight[];
}

export default function WorkflowAnalysis() {
  const [analysisData, setAnalysisData] = useState<WorkflowAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const fetchAnalysisData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/project-management/insights/workflow-analysis', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workflow analysis');
      }

      const data = await response.json();
      setAnalysisData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
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
        <Button onClick={fetchAnalysisData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!analysisData || analysisData.insights.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">No workflow analysis data available</p>
        <p className="text-sm text-gray-500">
          Sync your project management tools to generate workflow insights
        </p>
      </div>
    );
  }

  const selectedInsight = selectedProject 
    ? analysisData.insights.find(i => i.project_id === selectedProject)
    : analysisData.insights[0];

  const renderDistributionChart = (data: Record<string, number>, title: string, colorClass: string) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    const sortedEntries = Object.entries(data).sort(([,a], [,b]) => b - a);

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="space-y-2">
          {sortedEntries.slice(0, 5).map(([key, value]) => {
            const percentage = total > 0 ? (value / total) * 100 : 0;
            return (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Badge variant="outline" className="text-xs">
                    {key}
                  </Badge>
                  <Progress value={percentage} className="flex-1 h-2" />
                </div>
                <div className="text-sm font-medium ml-2">
                  {value} ({Math.round(percentage)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTeamMetrics = (metrics: WorkflowInsight['team_metrics']) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-blue-900">{metrics.active_members}</div>
        <div className="text-sm text-blue-600">Active Members</div>
      </div>
      
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-green-900">
          {metrics.avg_completion_time_days ? Math.round(metrics.avg_completion_time_days) : 'N/A'}
        </div>
        <div className="text-sm text-green-600">Avg Days to Complete</div>
      </div>
      
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-purple-900">
          {metrics.velocity_story_points ? Math.round(metrics.velocity_story_points) : 'N/A'}
        </div>
        <div className="text-sm text-purple-600">Story Points/Month</div>
      </div>
    </div>
  );

  const renderCompletionTrends = (trends: Record<string, number>) => {
    const sortedTrends = Object.entries(trends).sort(([a], [b]) => a.localeCompare(b));
    const maxValue = Math.max(...Object.values(trends));

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Completion Trends (Last 6 Months)</h4>
        <div className="space-y-2">
          {sortedTrends.map(([month, count]) => {
            const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
            return (
              <div key={month} className="flex items-center justify-between">
                <div className="text-sm font-medium w-20">{month}</div>
                <div className="flex items-center space-x-2 flex-1">
                  <Progress value={percentage} className="flex-1 h-2" />
                  <div className="text-sm font-medium w-8">{count}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Analysis</h1>
          <p className="text-gray-600 mt-1">
            Team processes and communication pattern insights
          </p>
        </div>
        <Button onClick={fetchAnalysisData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Project Selector */}
      {analysisData.insights.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysisData.insights.map((insight) => (
                <Button
                  key={insight.project_id}
                  variant={selectedProject === insight.project_id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedProject(insight.project_id)}
                >
                  Project {insight.project_id.slice(-8)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedInsight && (
        <>
          {/* Team Metrics Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Team Performance Metrics</span>
              </CardTitle>
              <CardDescription>
                Key performance indicators for the selected project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTeamMetrics(selectedInsight.team_metrics)}
            </CardContent>
          </Card>

          {/* Workflow Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Work Item Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderDistributionChart(
                  selectedInsight.workflow_patterns.status_distribution,
                  "Status Distribution",
                  "bg-blue-100"
                )}
                {renderDistributionChart(
                  selectedInsight.workflow_patterns.type_distribution,
                  "Type Distribution",
                  "bg-green-100"
                )}
                {selectedInsight.workflow_patterns.priority_distribution && 
                  Object.keys(selectedInsight.workflow_patterns.priority_distribution).length > 0 && (
                  renderDistributionChart(
                    selectedInsight.workflow_patterns.priority_distribution,
                    "Priority Distribution",
                    "bg-orange-100"
                  )
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Team Communication</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderDistributionChart(
                  selectedInsight.communication_patterns.most_active_assignees,
                  "Most Active Assignees",
                  "bg-purple-100"
                )}
                {renderDistributionChart(
                  selectedInsight.communication_patterns.most_active_reporters,
                  "Most Active Reporters",
                  "bg-indigo-100"
                )}
                {selectedInsight.communication_patterns.team_distribution && 
                  Object.keys(selectedInsight.communication_patterns.team_distribution).length > 0 && (
                  renderDistributionChart(
                    selectedInsight.communication_patterns.team_distribution,
                    "Team Distribution",
                    "bg-teal-100"
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* Completion Trends */}
          {selectedInsight.workflow_patterns.completion_trends && 
            Object.keys(selectedInsight.workflow_patterns.completion_trends).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Completion Trends</span>
                </CardTitle>
                <CardDescription>
                  Work item completion patterns over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderCompletionTrends(selectedInsight.workflow_patterns.completion_trends)}
              </CardContent>
            </Card>
          )}

          {/* Analysis Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
              <CardDescription>
                Last analyzed: {new Date(selectedInsight.analysis_date).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Key Insights</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>
                        Team has {selectedInsight.team_metrics.active_members} active members
                        {selectedInsight.communication_patterns.team_distribution && 
                          Object.keys(selectedInsight.communication_patterns.team_distribution).length > 1 && 
                          ` across ${Object.keys(selectedInsight.communication_patterns.team_distribution).length} teams`
                        }
                      </span>
                    </li>
                    {selectedInsight.team_metrics.avg_completion_time_days && (
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>
                          Average completion time is {Math.round(selectedInsight.team_metrics.avg_completion_time_days)} days
                        </span>
                      </li>
                    )}
                    {selectedInsight.team_metrics.velocity_story_points && (
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>
                          Team velocity is {Math.round(selectedInsight.team_metrics.velocity_story_points)} story points per month
                        </span>
                      </li>
                    )}
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>
                        {Object.keys(selectedInsight.workflow_patterns.status_distribution).length} different work item statuses in use
                      </span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Recommendations</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {selectedInsight.team_metrics.avg_completion_time_days && 
                      selectedInsight.team_metrics.avg_completion_time_days > 14 && (
                      <li>• Consider breaking down large work items to reduce completion time</li>
                    )}
                    {Object.keys(selectedInsight.workflow_patterns.status_distribution).length > 8 && (
                      <li>• Simplify workflow by consolidating similar statuses</li>
                    )}
                    {selectedInsight.team_metrics.velocity_story_points && 
                      selectedInsight.team_metrics.velocity_story_points < 10 && (
                      <li>• Review story point estimation and team capacity</li>
                    )}
                    <li>• Regular retrospectives can help improve team processes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}