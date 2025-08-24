'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AuthService, { User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const authResponse = await AuthService.login({ email, password });
      setUser(authResponse.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const token = AuthService.getToken();
        if (!token) {
          setUser(null);
          return;
        }

        // Try to get cached user first
        let currentUser = AuthService.getUser();
        
        if (currentUser) {
          // We have a cached user, just verify the token is still valid
          const isValid = await AuthService.verifyToken();
          if (isValid) {
            setUser(currentUser);
          } else {
            // Token is invalid, clear everything
            AuthService.removeToken();
            setUser(null);
          }
        } else {
          // No cached user, fetch from server
          currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid tokens on error
        AuthService.removeToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth expiration events from API calls
    const handleAuthExpired = () => {
      console.log('Auth expired event received');
      setUser(null);
    };

    window.addEventListener('auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  // Separate useEffect for token validation interval to avoid stale closures
  useEffect(() => {
    if (!user || !AuthService.getToken()) {
      return; // Don't set up interval if no user or token
    }

    // Set up periodic token validation (less frequent to avoid spam)
    const interval = setInterval(async () => {
      const currentToken = AuthService.getToken();
      if (currentToken) {
        const isValid = await AuthService.verifyToken();
        if (!isValid) {
          console.log('Token expired during periodic check, logging out user');
          setUser(null);
        }
      }
    }, 10 * 60 * 1000); // Check every 10 minutes

    return () => {
      clearInterval(interval);
    };
  }, [user]); // Depend on user to restart interval when user changes

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !!AuthService.getToken(),
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}