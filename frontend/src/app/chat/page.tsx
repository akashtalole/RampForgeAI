'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

function ChatContent() {
  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground font-headline">
            Knowledge Assistant
          </h1>
          <p className="text-muted-foreground font-body">
            Ask questions about your codebase and get instant AI-powered answers.
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Coming Soon</CardTitle>
            <CardDescription className="text-muted-foreground">
              AI-powered knowledge assistant is currently under development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This feature will provide an intelligent chat interface where you can:
            </p>
            <ul className="mt-4 space-y-2 text-muted-foreground">
              <li>• Ask questions about your codebase</li>
              <li>• Get explanations of complex code patterns</li>
              <li>• Receive suggestions for improvements</li>
              <li>• Learn about best practices</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}