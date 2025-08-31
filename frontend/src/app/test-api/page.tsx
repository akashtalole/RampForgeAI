'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TestApiPage() {
  const [status, setStatus] = useState<string>('Testing...');
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testBackendConnection = async () => {
    setStatus('Testing backend connection...');
    setError(null);
    setDetails(null);

    try {
      // Test basic connectivity using proxied URL
      const healthResponse = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

      const healthData = await healthResponse.json();
      setDetails(healthData);
      setStatus('✅ Backend is reachable and healthy!');

      // Test CORS
      try {
        const corsResponse = await fetch('/api/v1/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (corsResponse.ok) {
          const corsData = await corsResponse.json();
          setDetails((prev: any) => ({ ...prev, cors: corsData }));
          setStatus('✅ Backend is reachable and CORS is working!');
        }
      } catch (corsError) {
        setStatus('⚠️ Backend is reachable but CORS might have issues');
        setError(`CORS test failed: ${corsError}`);
      }

    } catch (err) {
      setStatus('❌ Cannot connect to backend');
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Additional debugging info
      console.error('Backend connection test failed:', err);
    }
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Connection Test</h1>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Backend Connection Status</h2>
          <p className="text-lg mb-4">{status}</p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <h3 className="font-medium text-red-800">Error Details:</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}
          
          {details && (
            <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
              <h3 className="font-medium text-green-800">Response Details:</h3>
              <pre className="text-green-700 text-sm mt-1 overflow-auto">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}
          
          <Button onClick={testBackendConnection} variant="primary">
            Test Again
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong>1. Check if backend is running:</strong>
              <p className="text-gray-600 ml-4">
                Run <code className="bg-gray-100 px-1 rounded">cd backend && python app/main.py</code>
              </p>
            </div>
            
            <div>
              <strong>2. Verify backend URL:</strong>
              <p className="text-gray-600 ml-4">
                Backend should be accessible at <code className="bg-gray-100 px-1 rounded">/api</code> (proxied to http://localhost:8000)
              </p>
            </div>
            
            <div>
              <strong>3. Check browser console:</strong>
              <p className="text-gray-600 ml-4">
                Open browser developer tools (F12) and check for CORS or network errors
              </p>
            </div>
            
            <div>
              <strong>4. Test direct API access:</strong>
              <p className="text-gray-600 ml-4">
                Visit <a 
                  href="/api/health" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  /api/health
                </a> in your browser
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}