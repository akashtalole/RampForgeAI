'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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

interface MCPServiceCardProps {
  service: MCPService;
  onConnect: (serviceId: string) => void;
  onDisconnect: (serviceId: string) => void;
  onEdit: (service: MCPService) => void;
  onDelete: (serviceId: string) => void;
  onHealthCheck: (serviceId: string) => void;
  isLoading?: boolean;
}

const getServiceIcon = (serviceType: string): string => {
  switch (serviceType.toLowerCase()) {
    case 'github':
      return '🐙';
    case 'gitlab':
      return '🦊';
    case 'jira':
      return '📋';
    case 'azure_devops':
      return '🔷';
    case 'confluence':
      return '📚';
    default:
      return '🔗';
  }
};

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'connected':
      return 'text-green-600 bg-green-100';
    case 'connecting':
      return 'text-yellow-600 bg-yellow-100';
    case 'error':
      return 'text-red-600 bg-red-100';
    case 'disconnected':
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const MCPServiceCard: React.FC<MCPServiceCardProps> = ({
  service,
  onConnect,
  onDisconnect,
  onEdit,
  onDelete,
  onHealthCheck,
  isLoading = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const isConnected = service.status === 'connected';
  const hasError = service.status === 'error';

  return (
    <Card className="p-4 hover:shadow-md transition-shadow bg-card border-border">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-xl">{getServiceIcon(service.service_type)}</div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{service.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{service.service_type.replace('_', ' ')}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
            {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
          </span>
          
          {!service.enabled && (
            <span className="px-2 py-1 rounded-full text-xs font-medium text-muted-foreground bg-muted">
              Disabled
            </span>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm text-muted-foreground truncate">{service.endpoint}</p>
        
        {hasError && service.last_error && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            <strong>Error:</strong> {service.last_error}
          </div>
        )}
        
        {service.last_connected && (
          <p className="text-xs text-muted-foreground mt-2">
            Last connected: {new Date(service.last_connected).toLocaleString()}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex space-x-2">
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDisconnect(service.id)}
              disabled={isLoading}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onConnect(service.id)}
              disabled={isLoading || !service.enabled}
            >
              Connect
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onHealthCheck(service.id)}
            disabled={isLoading || !isConnected}
          >
            Test
          </Button>
        </div>
        
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(service)}
            className="text-muted-foreground hover:text-foreground"
          >
            Edit
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(service.id)}
            className="text-destructive hover:text-destructive/80"
          >
            Delete
          </Button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-foreground">Service ID:</span>
              <p className="text-muted-foreground font-mono text-xs">{service.id}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Created:</span>
              <p className="text-muted-foreground">{new Date(service.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Updated:</span>
              <p className="text-muted-foreground">{new Date(service.updated_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Enabled:</span>
              <p className="text-muted-foreground">{service.enabled ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};