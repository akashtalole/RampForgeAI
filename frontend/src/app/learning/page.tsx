'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

function LearningContent() {
  const learningPaths = [
    {
      id: 'frontend-fundamentals',
      title: 'Frontend Development Fundamentals',
      description: 'Master the basics of modern frontend development with React, TypeScript, and Tailwind CSS.',
      duration: '4-6 weeks',
      difficulty: 'Beginner',
      modules: [
        'React Components & JSX',
        'TypeScript Basics',
        'State Management',
        'Styling with Tailwind CSS',
        'API Integration',
        'Testing Fundamentals'
      ],
      progress: 0,
      color: 'bg-blue-500'
    },
    {
      id: 'backend-apis',
      title: 'Backend API Development',
      description: 'Learn to build robust APIs with FastAPI, database integration, and authentication.',
      duration: '6-8 weeks',
      difficulty: 'Intermediate',
      modules: [
        'FastAPI Fundamentals',
        'Database Design & SQLAlchemy',
        'Authentication & Authorization',
        'API Documentation',
        'Testing & Validation',
        'Deployment Strategies'
      ],
      progress: 0,
      color: 'bg-green-500'
    },
    {
      id: 'devops-essentials',
      title: 'DevOps & Deployment',
      description: 'Master containerization, CI/CD pipelines, and cloud deployment strategies.',
      duration: '5-7 weeks',
      difficulty: 'Intermediate',
      modules: [
        'Docker & Containerization',
        'CI/CD with GitHub Actions',
        'Cloud Deployment',
        'Monitoring & Logging',
        'Security Best Practices',
        'Infrastructure as Code'
      ],
      progress: 0,
      color: 'bg-purple-500'
    },
    {
      id: 'ai-integration',
      title: 'AI Integration for Developers',
      description: 'Integrate AI capabilities into your applications with modern tools and frameworks.',
      duration: '3-4 weeks',
      difficulty: 'Advanced',
      modules: [
        'AI API Integration',
        'Model Context Protocol (MCP)',
        'Prompt Engineering',
        'AI-Powered Features',
        'Performance Optimization',
        'Ethical AI Considerations'
      ],
      progress: 0,
      color: 'bg-orange-500'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground font-headline">
            Learning Paths
          </h1>
          <p className="text-muted-foreground font-body">
            Follow personalized learning curricula based on your skills and project needs.
          </p>
        </div>

        {/* Learning Path Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {learningPaths.map((path) => (
            <Card key={path.id} className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-foreground mb-2">{path.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {path.description}
                    </CardDescription>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${path.color} flex-shrink-0 ml-3 mt-1`}></div>
                </div>
                <div className="flex items-center space-x-4 mt-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(path.difficulty)}`}>
                    {path.difficulty}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {path.duration}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-foreground">Learning Modules</h4>
                    <ul className="space-y-1">
                      {path.modules.slice(0, 4).map((module, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center">
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mr-2 flex-shrink-0"></span>
                          {module}
                        </li>
                      ))}
                      {path.modules.length > 4 && (
                        <li className="text-sm text-muted-foreground">
                          +{path.modules.length - 4} more modules
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Progress</span>
                      <span className="text-sm text-muted-foreground">{path.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${path.color}`}
                        style={{ width: `${path.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <button className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                      Start Learning
                    </button>
                    <button className="px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors">
                      Preview
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground">Available Paths</CardDescription>
              <CardTitle className="text-2xl text-foreground">{learningPaths.length}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground">Total Modules</CardDescription>
              <CardTitle className="text-2xl text-foreground">
                {learningPaths.reduce((total, path) => total + path.modules.length, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground">Your Progress</CardDescription>
              <CardTitle className="text-2xl text-foreground">0%</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default function LearningPage() {
  return (
    <ProtectedRoute>
      <LearningContent />
    </ProtectedRoute>
  );
}