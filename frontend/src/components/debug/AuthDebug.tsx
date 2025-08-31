'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import AuthService from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export function AuthDebug() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkToken = async () => {
    setChecking(true);
    try {
      const isValid = await AuthService.verifyToken();
      setTokenValid(isValid);
    } catch (error) {
      setTokenValid(false);
    } finally {
      setChecking(false);
    }
  };

  const token = AuthService.getToken();
  const cachedUser = AuthService.getUser();

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Authentication Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Auth Provider State:</strong>
            <ul className="ml-4 mt-1">
              <li>isLoading: {isLoading ? 'true' : 'false'}</li>
              <li>isAuthenticated: {isAuthenticated ? 'true' : 'false'}</li>
              <li>user: {user ? 'present' : 'null'}</li>
            </ul>
          </div>
          
          <div>
            <strong>Local Storage:</strong>
            <ul className="ml-4 mt-1">
              <li>token: {token ? 'present' : 'null'}</li>
              <li>cached user: {cachedUser ? 'present' : 'null'}</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            onClick={checkToken} 
            disabled={checking}
            variant="outline"
            size="sm"
          >
            {checking ? 'Checking...' : 'Verify Token'}
          </Button>
          
          {tokenValid !== null && (
            <span className={`text-sm ${tokenValid ? 'text-green-600' : 'text-red-600'}`}>
              Token is {tokenValid ? 'valid' : 'invalid'}
            </span>
          )}
        </div>

        {user && (
          <div className="text-xs bg-gray-50 p-3 rounded">
            <strong>User Data:</strong>
            <pre className="mt-1 overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}