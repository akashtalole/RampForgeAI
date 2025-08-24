'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HealthCheck from '@/components/HealthCheck';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-headline font-bold text-primary mb-4">
            RampForgeAI
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            AI-powered developer onboarding platform that transforms weeks of traditional 
            onboarding into hours of focused learning.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link
              href="/login"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-md font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-background hover:bg-muted text-primary border border-input px-6 py-3 rounded-md font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-headline font-semibold text-foreground mb-4">
              System Status
            </h2>
            <HealthCheck />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg shadow-md p-6 border border-border">
              <h3 className="text-xl font-headline font-semibold text-primary mb-3">
                Authentication System
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>✅ JWT-based authentication</li>
                <li>✅ User registration & login</li>
                <li>✅ Protected routes</li>
                <li>✅ Session management</li>
              </ul>
            </div>

            <div className="bg-card rounded-lg shadow-md p-6 border border-border">
              <h3 className="text-xl font-headline font-semibold text-accent mb-3">
                Backend Services
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>✅ FastAPI server</li>
                <li>✅ SQLite database</li>
                <li>✅ Password hashing</li>
                <li>✅ API documentation</li>
              </ul>
            </div>

            <div className="bg-card rounded-lg shadow-md p-6 border border-border">
              <h3 className="text-xl font-headline font-semibold text-primary mb-3">
                Frontend Features
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>✅ NextJS with TypeScript</li>
                <li>✅ Authentication context</li>
                <li>✅ Protected components</li>
                <li>✅ Route middleware</li>
              </ul>
            </div>

            <div className="bg-card rounded-lg shadow-md p-6 border border-border">
              <h3 className="text-xl font-headline font-semibold text-accent mb-3">
                Next Steps
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>🔄 MCP integration</li>
                <li>🔄 AI services</li>
                <li>🔄 Code analysis</li>
                <li>🔄 Learning paths</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
