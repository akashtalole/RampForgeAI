'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { 
  CodeAnalysisIcon, 
  KnowledgeAssistantIcon, 
  LearningPathIcon, 
  DocumentationIcon, 
  SettingsIcon 
} from '@/components/dashboard/DashboardCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';


function DashboardContent() {
  const { user } = useAuth();

  const dashboardCards = [
    {
      title: 'Code Analysis',
      description: 'Analyze your codebase to understand architecture, complexity, and feature mapping.',
      action: 'Start Analysis',
      icon: <CodeAnalysisIcon />,
      status: 'available' as const,
      onClick: () => console.log('Navigate to code analysis'),
    },
    {
      title: 'Knowledge Assistant',
      description: 'Ask questions about your codebase and get instant AI-powered answers.',
      action: 'Open Chat',
      icon: <KnowledgeAssistantIcon />,
      status: 'available' as const,
      onClick: () => console.log('Navigate to chat'),
    },
    {
      title: 'Learning Paths',
      description: 'Follow personalized learning curricula based on your skills and project needs.',
      action: 'View Paths',
      icon: <LearningPathIcon />,
      status: 'available' as const,
      onClick: () => console.log('Navigate to learning'),
    },
    {
      title: 'Documentation',
      description: 'Generate and manage project documentation automatically from your codebase.',
      action: 'Generate Docs',
      icon: <DocumentationIcon />,
      status: 'available' as const,
      onClick: () => console.log('Navigate to documentation'),
    },
    {
      title: 'MCP Settings',
      description: 'Configure connections to GitHub, Jira, and other development tools.',
      action: 'Configure',
      icon: <SettingsIcon />,
      status: 'available' as const,
      onClick: () => console.log('Navigate to settings'),
    },
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground font-headline">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground font-body">
            Ready to accelerate your development journey? Choose an action below to get started.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground">Projects Analyzed</CardDescription>
              <CardTitle className="text-2xl text-foreground">0</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground">Learning Progress</CardDescription>
              <CardTitle className="text-2xl text-foreground">0%</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground">Knowledge Items</CardDescription>
              <CardTitle className="text-2xl text-foreground">0</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground font-headline">
            Get Started
          </h2>
          <DashboardGrid cards={dashboardCards} />
        </div>

      </div>
    </MainLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}