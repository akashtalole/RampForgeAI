'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface RouteGuardProps {
  children: React.ReactNode;
}

const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/analysis',
  '/chat',
  '/learning',
  '/settings'
];

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/about',
  '/test-api'
];

export function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return; // Wait for auth to initialize

    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    );

    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith(route)
    );

    // If accessing a protected route without authentication
    if (isProtectedRoute && !isAuthenticated) {
      console.log('Redirecting to login - protected route without auth');
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // If accessing login/register while authenticated, redirect to dashboard
    if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || '/dashboard';
      console.log('Redirecting authenticated user to:', redirectTo);
      router.push(redirectTo);
      return;
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}