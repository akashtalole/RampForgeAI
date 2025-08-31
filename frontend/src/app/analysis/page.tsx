'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Code, 
  GitBranch, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Upload,
  Search,
  BarChart3,
  Layers,
  Target,
  Zap
} from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  url: string;
  type: string;
  last_analyzed?: string;
  analysis_status?: string;
}

interface AnalysisResult {
  id: string;
  repository_id: string;
  complexity_score: number;
  feature_count: number;
  architecture: {
    components: Array<{
      name: string;
      type: string;
      complexity: number;
      files: number;
      dependencies: string[];
    }>;
    dependencies: Array<{
      from: string;
      to: string;
      type: string;
    }>;
  };
  features: Array<{
    name: string;
    description: string;
    files: string[];
    complexity: number;
    test_coverage: number;
  }>;
  patterns: Array<{
    name: string;
    occurrences: number;
    confidence: number;
  }>;
  recommendations: Array<{
    type: string;
    priority: string;
    description: string;
    affected_files: string[];
  }>;
  created_at: string;
}

function AnalysisContent() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/repositories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Mock data for demonstration
        const mockRepos: Repository[] = [
          {
            id: 'repo_1',
            name: 'RampForgeAI',
            url: 'https://github.com/company/rampforge',
            type: 'github',
            last_analyzed: '2024-01-15T12:00:00Z',
            analysis_status: 'completed'
          },
          {
            id: 'repo_2',
            name: 'Frontend Components',
            url: 'https://github.com/company/ui-components',
            type: 'github',
            analysis_status: 'pending'
          }
        ];
        setRepositories(mockRepos);
        return;
      }

      const data = await response.json();
      setRepositories(data);
    } catch (err) {
      // Fallback to mock data
      const mockRepos: Repository[] = [
        {
          id: 'repo_1',
          name: 'RampForgeAI',
          url: 'https://github.com/company/rampforge',
          type: 'github',
          last_analyzed: '2024-01-15T12:00:00Z',
          analysis_status: 'completed'
        }
      ];
      setRepositories(mockRepos);
    }
  };

  const fetchAnalysisResult = async (repoId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/repositories/${repoId}/analysis`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Mock analysis result
        const mockResult: AnalysisResult = {
          id: 'analysis_1',
          repository_id: repoId,
          complexity_score: 7.5,
          feature_count: 23,
          architecture: {
            components: [
              {
                name: 'Frontend',
                type: 'nextjs',
                complexity: 6.2,
                files: 45,
                dependencies: ['Backend API', 'Authentication']
              },
              {
                name: 'Backend API',
                type: 'fastapi',
                complexity: 8.1,
                files: 32,
                dependencies: ['Database', 'External Services']
              },
              {
                name: 'Database',
                type: 'sqlite',
                complexity: 4.5,
                files: 12,
                dependencies: []
              }
            ],
            dependencies: [
              { from: 'Frontend', to: 'Backend API', type: 'http_api' },
              { from: 'Backend API', to: 'Database', type: 'orm' }
            ]
          },
          features: [
            {
              name: 'User Authentication',
              description: 'JWT-based authentication system with role management',
              files: ['auth.py', 'AuthProvider.tsx', 'ProtectedRoute.tsx'],
              complexity: 5,
              test_coverage: 0.9
            },
            {
              name: 'MCP Integration',
              description: 'Model Context Protocol service management',
              files: ['mcp_service.py', 'MCPServiceList.tsx', 'MCPServiceForm.tsx'],
              complexity: 8,
              test_coverage: 0.75
            },
            {
              name: 'Project Management',
              description: 'Integration with Jira and Azure DevOps',
              files: ['pm_service.py', 'ProjectDashboard.tsx'],
              complexity: 7,
              test_coverage: 0.65
            }
          ],
          patterns: [
            { name: 'Repository Pattern', occurrences: 8, confidence: 0.95 },
            { name: 'Factory Pattern', occurrences: 5, confidence: 0.88 },
            { name: 'Observer Pattern', occurrences: 3, confidence: 0.92 }
          ],
          recommendations: [
            {
              type: 'refactoring',
              priority: 'medium',
              description: 'Consider extracting common validation logic into shared utilities',
              affected_files: ['validation.py', 'forms.py']
            },
            {
              type: 'testing',
              priority: 'high',
              description: 'Increase test coverage for MCP integration components',
              affected_files: ['mcp_service.py', 'test_mcp.py']
            }
          ],
          created_at: '2024-01-15T12:00:00Z'
        };
        setAnalysisResult(mockResult);
        return;
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      setError('Failed to fetch analysis result');
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async (repoId: string) => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/repositories/${repoId}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Simulate analysis completion
        setTimeout(() => {
          fetchAnalysisResult(repoId);
          setAnalyzing(false);
        }, 3000);
        return;
      }

      // Poll for completion
      const pollAnalysis = setInterval(async () => {
        const statusResponse = await fetch(`/api/v1/repositories/${repoId}/analysis`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (statusResponse.ok) {
          const result = await statusResponse.json();
          if (result.status === 'completed') {
            setAnalysisResult(result);
            setAnalyzing(false);
            clearInterval(pollAnalysis);
          }
        }
      }, 2000);

    } catch (err) {
      setError('Failed to trigger analysis');
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchAnalysisResult(selectedRepo);
    }
  }, [selectedRepo]);

  const getComplexityColor = (score: number) => {
    if (score < 4) return 'text-green-600';
    if (score < 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Code Analysis</h1>
            <p className="text-gray-600">
              Analyze your codebase to understand architecture, complexity, and feature mapping
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search Code
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Repository
            </Button>
          </div>
        </div>

        {/* Repository Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Repository</CardTitle>
            <CardDescription>
              Choose a repository to analyze or view existing analysis results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedRepo === repo.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRepo(repo.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{repo.name}</h3>
                    <Badge variant="outline">{repo.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 truncate">{repo.url}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {repo.analysis_status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {repo.analysis_status === 'pending' && (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-xs text-gray-500">
                        {repo.analysis_status || 'Not analyzed'}
                      </span>
                    </div>
                    {repo.last_analyzed && (
                      <span className="text-xs text-gray-500">
                        {new Date(repo.last_analyzed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {selectedRepo && (
          <div className="space-y-6">
            {/* Analysis Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Analysis Status</h3>
                    <p className="text-sm text-gray-600">
                      {analysisResult ? 'Analysis completed' : 'No analysis available'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => triggerAnalysis(selectedRepo)}
                    disabled={analyzing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
                    {analyzing ? 'Analyzing...' : 'Run Analysis'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-700">{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisResult && (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="architecture">Architecture</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Complexity Score</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getComplexityColor(analysisResult.complexity_score)}`}>
                          {analysisResult.complexity_score}/10
                        </div>
                        <Progress value={analysisResult.complexity_score * 10} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Features</CardTitle>
                        <Layers className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analysisResult.feature_count}</div>
                        <p className="text-xs text-muted-foreground">
                          Identified features
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Components</CardTitle>
                        <Code className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analysisResult.architecture.components.length}</div>
                        <p className="text-xs text-muted-foreground">
                          Architecture components
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Patterns</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analysisResult.patterns.length}</div>
                        <p className="text-xs text-muted-foreground">
                          Design patterns found
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Design Patterns */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Design Patterns</CardTitle>
                      <CardDescription>
                        Identified design patterns in your codebase
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysisResult.patterns.map((pattern, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{pattern.name}</h4>
                              <p className="text-sm text-gray-600">
                                {pattern.occurrences} occurrences found
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {Math.round(pattern.confidence * 100)}% confidence
                              </div>
                              <Progress value={pattern.confidence * 100} className="w-20 mt-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="architecture" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Architecture Components</CardTitle>
                      <CardDescription>
                        High-level components and their relationships
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisResult.architecture.components.map((component, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{component.name}</h3>
                                <Badge variant="outline">{component.type}</Badge>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-semibold ${getComplexityColor(component.complexity)}`}>
                                  {component.complexity}/10
                                </div>
                                <div className="text-sm text-gray-500">Complexity</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Files: </span>
                                <span>{component.files}</span>
                              </div>
                              <div>
                                <span className="font-medium">Dependencies: </span>
                                <span>{component.dependencies.join(', ')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="features" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Feature Analysis</CardTitle>
                      <CardDescription>
                        Identified features and their implementation details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisResult.features.map((feature, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">{feature.name}</h3>
                                <p className="text-gray-600 text-sm mb-2">{feature.description}</p>
                                <div className="flex flex-wrap gap-1">
                                  {feature.files.map((file, fileIndex) => (
                                    <Badge key={fileIndex} variant="secondary" className="text-xs">
                                      {file}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className={`text-lg font-semibold ${getComplexityColor(feature.complexity)}`}>
                                  {feature.complexity}/10
                                </div>
                                <div className="text-sm text-gray-500 mb-2">Complexity</div>
                                <div className="text-sm">
                                  <span className="font-medium">Coverage: </span>
                                  <span className={feature.test_coverage > 0.8 ? 'text-green-600' : feature.test_coverage > 0.6 ? 'text-yellow-600' : 'text-red-600'}>
                                    {Math.round(feature.test_coverage * 100)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                      <CardDescription>
                        AI-powered suggestions for improving your codebase
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisResult.recommendations.map((rec, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge className={getPriorityColor(rec.priority)}>
                                    {rec.priority} priority
                                  </Badge>
                                  <Badge variant="outline">{rec.type}</Badge>
                                </div>
                                <p className="text-gray-800 mb-2">{rec.description}</p>
                                <div className="flex flex-wrap gap-1">
                                  {rec.affected_files.map((file, fileIndex) => (
                                    <Badge key={fileIndex} variant="secondary" className="text-xs">
                                      {file}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                <Zap className="h-4 w-4 mr-1" />
                                Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function AnalysisPage() {
  return (
    <ProtectedRoute>
      <AnalysisContent />
    </ProtectedRoute>
  );
}