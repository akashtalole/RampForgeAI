'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = [], 
  fallback = <div>Loading...</div> 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth to initialize

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check role requirements
    if (requiredRole.length > 0 && user && !requiredRole.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, isLoading, user, router, requiredRole]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}