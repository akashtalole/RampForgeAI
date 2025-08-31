/**
 * API utility functions for making HTTP requests to the backend
 */

// Use Next.js API proxy to avoid CORS issues
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private static getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    
    const token = localStorage.getItem('rampforge_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const status = response.status;
    
    // Handle 401 Unauthorized - clear tokens
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('rampforge_token');
      localStorage.removeItem('rampforge_user');
      document.cookie = 'rampforge_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      // Optionally redirect to login or trigger a re-render
      window.dispatchEvent(new CustomEvent('auth-expired'));
    }
    
    try {
      const data = await response.json();
      
      if (!response.ok) {
        return {
          error: data.detail || data.message || `HTTP ${status}`,
          status,
        };
      }
      
      return {
        data,
        status,
      };
    } catch (error) {
      return {
        error: `Failed to parse response: ${error}`,
        status,
      };
    }
  }

  static async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: `Network error: ${error}`,
        status: 0,
      };
    }
  }

  static async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: `Network error: ${error}`,
        status: 0,
      };
    }
  }

  static async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: `Network error: ${error}`,
        status: 0,
      };
    }
  }

  static async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: `Network error: ${error}`,
        status: 0,
      };
    }
  }

  // Health check to test connectivity
  static async healthCheck(): Promise<ApiResponse> {
    return this.get('/api/health');
  }

  // Test if the API is reachable
  static async testConnection(): Promise<boolean> {
    try {
      const response = await this.healthCheck();
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export default ApiClient;