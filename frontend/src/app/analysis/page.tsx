'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

function AnalysisContent() {
  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground font-headline">
            Code Analysis
          </h1>
          <p className="text-muted-foreground font-body">
            Analyze your codebase to understand architecture, complexity, and feature mapping.
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Coming Soon</CardTitle>
            <CardDescription className="text-muted-foreground">
              Code analysis features are currently under development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This feature will allow you to upload and analyze your codebase to get insights about:
            </p>
            <ul className="mt-4 space-y-2 text-muted-foreground">
              <li>• Architecture patterns and dependencies</li>
              <li>• Code complexity metrics</li>
              <li>• Feature mapping and documentation</li>
              <li>• Best practices recommendations</li>
            </ul>
          </CardContent>
        </Card>
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