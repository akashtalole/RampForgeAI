'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

function LearningContent() {
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

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Coming Soon</CardTitle>
            <CardDescription className="text-muted-foreground">
              Personalized learning paths are currently under development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This feature will provide customized learning experiences including:
            </p>
            <ul className="mt-4 space-y-2 text-muted-foreground">
              <li>• Skill-based learning recommendations</li>
              <li>• Interactive tutorials and exercises</li>
              <li>• Progress tracking and achievements</li>
              <li>• Project-specific onboarding paths</li>
            </ul>
          </CardContent>
        </Card>
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