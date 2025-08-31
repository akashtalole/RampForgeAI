'use client';

import React, { useState, useEffect } from 'react';
import { MCPServiceCard } from './MCPServiceCard';
import { MCPServiceForm } from './MCPServiceForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface MCPService {
  id: string;
  service_type: string;
  name: string;
  endpoint: string;
  enabled: boolean;
  status: string;
  last_connected?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

interface MCPServiceFormData {
  id?: string;
  service_type: string;
  name: string;
  endpoint: string;
  enabled: boolean;
  credentials: Record<string, string>;
  rate_limits?: Record<string, number>;
  timeout?: number;
  retry_attempts?: number;
}

export const MCPServiceList: React.FC = () => {
  const [services, setServices] = useState<MCPService[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<MCPServiceFormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      // First test if the API is reachable
      const isConnected = await fetch('/api/health')
        .then(res => res.ok)
        .catch(() => false);
      
      if (!isConnected) {
        throw new Error('Cannot connect to backend API. Please ensure the backend server is running.');
      }

      const response = await fetch('/api/v1/mcp/services', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to load services`);
      }

      const data = await response.json();
      setServices(data);
    } catch (err) {
      console.error('Failed to load MCP services:', err);
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (serviceId: string) => {
    try {
      setActionLoading(serviceId);
      const response = await fetch(`/api/v1/mcp/services/${serviceId}/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to connect service');
      }

      await loadServices(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect service');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (serviceId: string) => {
    try {
      setActionLoading(serviceId);
      const response = await fetch(`/api/v1/mcp/services/${serviceId}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect service');
      }

      await loadServices(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect service');
    } finally {
      setActionLoading(null);
    }
  };

  const handleHealthCheck = async (serviceId: string) => {
    try {
      setActionLoading(serviceId);
      const response = await fetch(`/api/v1/mcp/services/${serviceId}/health`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Health check failed');
      }

      const healthData = await response.json();
      
      // Show health check result
      alert(`Health Check Result:\nStatus: ${healthData.status}\nResponse Time: ${healthData.response_time_ms}ms`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (service: MCPService) => {
    // Convert MCPService to MCPServiceFormData format
    const formService = {
      ...service,
      credentials: {}, // Credentials are not returned from API for security
      rate_limits: { requests_per_minute: 60, requests_per_hour: 1000 },
      timeout: 30,
      retry_attempts: 3
    };
    setEditingService(formService as MCPServiceFormData);
    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(serviceId);
      const response = await fetch(`/api/v1/mcp/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      await loadServices(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitForm = async (formData: MCPServiceFormData) => {
    try {
      setActionLoading('form');
      
      const url = editingService 
        ? `/api/v1/mcp/services/${editingService.id}`
        : '/api/v1/mcp/services';
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save service');
      }

      setShowForm(false);
      setEditingService(null);
      await loadServices(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingService(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading MCP services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Connected Services</h2>
          <p className="text-muted-foreground">Manage your development tool integrations</p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          Add Service
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive/20">
          <div className="flex items-center">
            <div className="text-destructive mr-3">⚠️</div>
            <div>
              <h3 className="text-destructive font-medium">Error</h3>
              <p className="text-destructive/80 text-sm">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto text-destructive hover:text-destructive/80"
            >
              ✕
            </Button>
          </div>
        </Card>
      )}

      {/* Service Form */}
      {showForm && (
        <MCPServiceForm
          service={editingService || undefined}
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          isLoading={actionLoading === 'form'}
        />
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <Card className="p-12 text-center bg-card border-border">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Services Connected</h3>
          <p className="text-muted-foreground mb-6">
            Connect your development tools to enhance your onboarding experience.
          </p>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            disabled={showForm}
          >
            Add Your First Service
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <MCPServiceCard
              key={service.id}
              service={service}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onHealthCheck={handleHealthCheck}
              isLoading={actionLoading === service.id}
            />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {services.length > 0 && (
        <Card className="p-4 bg-card border-border">
          <h3 className="text-sm font-medium text-foreground mb-3">Quick Actions</h3>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  setActionLoading('sync');
                  const response = await fetch('/api/v1/mcp/sync', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  });

                  if (!response.ok) {
                    throw new Error('Sync failed');
                  }

                  const result = await response.json();
                  alert(`Sync completed for ${result.total_services} services`);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Sync failed');
                } finally {
                  setActionLoading(null);
                }
              }}
              disabled={actionLoading === 'sync'}
            >
              {actionLoading === 'sync' ? 'Syncing...' : 'Sync All'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  setActionLoading('health');
                  const response = await fetch('/api/v1/mcp/health', {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  });

                  if (!response.ok) {
                    throw new Error('Health check failed');
                  }

                  const result = await response.json();
                  const healthySvcs = result.health_checks.filter((h: { status: string }) => h.status === 'connected').length;
                  alert(`Health check completed: ${healthySvcs}/${result.total_services} services healthy`);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Health check failed');
                } finally {
                  setActionLoading(null);
                }
              }}
              disabled={actionLoading === 'health'}
            >
              {actionLoading === 'health' ? 'Checking...' : 'Test All'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};