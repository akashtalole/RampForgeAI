'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface MCPService {
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

interface MCPServiceFormProps {
  service?: MCPService;
  onSubmit: (service: MCPService) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const serviceTypeOptions = [
  { value: 'github', label: 'GitHub', icon: '🐙' },
  { value: 'gitlab', label: 'GitLab', icon: '🦊' },
  { value: 'jira', label: 'Jira', icon: '📋' },
  { value: 'azure_devops', label: 'Azure DevOps', icon: '🔷' },
  { value: 'confluence', label: 'Confluence', icon: '📚' }
];

const getCredentialFields = (serviceType: string) => {
  switch (serviceType) {
    case 'github':
      return [
        { key: 'token', label: 'Personal Access Token', type: 'password', required: true }
      ];
    case 'gitlab':
      return [
        { key: 'token', label: 'Personal Access Token', type: 'password', required: true }
      ];
    case 'jira':
      return [
        { key: 'username', label: 'Username/Email', type: 'text', required: true },
        { key: 'api_token', label: 'API Token', type: 'password', required: true }
      ];
    case 'azure_devops':
      return [
        { key: 'organization', label: 'Organization', type: 'text', required: true },
        { key: 'personal_access_token', label: 'Personal Access Token', type: 'password', required: true }
      ];
    case 'confluence':
      return [
        { key: 'username', label: 'Username/Email', type: 'text', required: true },
        { key: 'api_token', label: 'API Token', type: 'password', required: true }
      ];
    default:
      return [];
  }
};

const getDefaultEndpoint = (serviceType: string) => {
  switch (serviceType) {
    case 'github':
      return 'https://api.github.com';
    case 'gitlab':
      return 'https://gitlab.com/api/v4';
    case 'jira':
      return 'https://your-domain.atlassian.net';
    case 'azure_devops':
      return 'https://dev.azure.com';
    case 'confluence':
      return 'https://your-domain.atlassian.net';
    default:
      return '';
  }
};

export const MCPServiceForm: React.FC<MCPServiceFormProps> = ({
  service,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<MCPService>({
    service_type: service?.service_type || 'github',
    name: service?.name || '',
    endpoint: service?.endpoint || '',
    enabled: service?.enabled ?? true,
    credentials: service?.credentials || {},
    rate_limits: service?.rate_limits || { requests_per_minute: 60, requests_per_hour: 1000 },
    timeout: service?.timeout || 30,
    retry_attempts: service?.retry_attempts || 3
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!service) {
      setFormData(prev => ({
        ...prev,
        endpoint: getDefaultEndpoint(prev.service_type),
        credentials: {}
      }));
    }
  }, [formData.service_type, service]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (!formData.endpoint.trim()) {
      newErrors.endpoint = 'Endpoint URL is required';
    } else {
      try {
        new URL(formData.endpoint);
      } catch {
        newErrors.endpoint = 'Please enter a valid URL';
      }
    }

    const credentialFields = getCredentialFields(formData.service_type);
    credentialFields.forEach(field => {
      if (field.required && !formData.credentials[field.key]?.trim()) {
        newErrors[`credentials.${field.key}`] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleCredentialChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [key]: value
      }
    }));
  };

  const credentialFields = getCredentialFields(formData.service_type);

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          {service ? 'Edit Service' : 'Add New Service'}
        </h2>
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          ✕
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Service Type
          </label>
          <select
            value={formData.service_type}
            onChange={(e) => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={!!service} // Don't allow changing type for existing services
          >
            {serviceTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Service Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Service Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
              errors.name ? 'border-destructive' : 'border-input'
            }`}
            placeholder="My GitHub Integration"
          />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
        </div>

        {/* Endpoint */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Endpoint URL
          </label>
          <input
            type="url"
            value={formData.endpoint}
            onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
              errors.endpoint ? 'border-destructive' : 'border-input'
            }`}
            placeholder={getDefaultEndpoint(formData.service_type)}
          />
          {errors.endpoint && <p className="mt-1 text-sm text-destructive">{errors.endpoint}</p>}
        </div>

        {/* Credentials */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">Credentials</h3>
          <div className="space-y-4">
            {credentialFields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </label>
                <input
                  type={field.type}
                  value={formData.credentials[field.key] || ''}
                  onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors[`credentials.${field.key}`] ? 'border-destructive' : 'border-input'
                  }`}
                />
                {errors[`credentials.${field.key}`] && (
                  <p className="mt-1 text-sm text-destructive">{errors[`credentials.${field.key}`]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enabled Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enabled"
            checked={formData.enabled}
            onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
            className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
          />
          <label htmlFor="enabled" className="ml-2 block text-sm text-foreground">
            Enable this service
          </label>
        </div>

        {/* Advanced Settings */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 p-4 bg-muted rounded-md">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={formData.timeout}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Retry Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.retry_attempts}
                    onChange={(e) => setFormData(prev => ({ ...prev, retry_attempts: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Requests per Minute
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rate_limits?.requests_per_minute || 60}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rate_limits: {
                        ...prev.rate_limits,
                        requests_per_minute: parseInt(e.target.value)
                      }
                    }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Requests per Hour
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rate_limits?.requests_per_hour || 1000}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rate_limits: {
                        ...prev.rate_limits,
                        requests_per_hour: parseInt(e.target.value)
                      }
                    }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : service ? 'Update Service' : 'Add Service'}
          </Button>
        </div>
      </form>
    </Card>
  );
};