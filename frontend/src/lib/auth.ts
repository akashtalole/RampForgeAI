
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  skills: string[];
  learning_progress: Record<string, any>;
  created_at: string;
  last_active?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'developer' | 'team_lead' | 'observer';
}

class AuthService {
  private static readonly TOKEN_KEY = 'rampforge_token';
  private static readonly USER_KEY = 'rampforge_user';
  // Use Next.js API proxy to avoid CORS issues
  private static readonly API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);

    // Also set as httpOnly cookie for middleware access
    document.cookie = `${this.TOKEN_KEY}=${token}; path=/; secure; samesite=strict`;
  }

  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    // Also remove the cookie
    document.cookie = `${this.TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static setUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const authResponse: AuthResponse = await response.json();
    this.setToken(authResponse.access_token);
    this.setUser(authResponse.user);
    return authResponse;
  }

  static async register(data: RegisterData): Promise<User> {
    const response = await fetch(`${this.API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const user: User = await response.json();
    return user;
  }

  static async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${this.API_BASE}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }
    this.removeToken();
  }

  static async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${this.API_BASE}/api/v1/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // If unauthorized, clear tokens and return null
        if (response.status === 401) {
          this.removeToken();
        }
        return null;
      }

      const user: User = await response.json();
      this.setUser(user);
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      // Don't remove token on network errors, only on auth errors
      return null;
    }
  }

  static async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.API_BASE}/api/v1/auth/verify`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // Only remove token on 401 (unauthorized), not on network errors
        if (response.status === 401) {
          this.removeToken();
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      // Don't remove token on network errors
      return false;
    }
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  static async checkAuthStatus(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    // Simple token validation - let the caller handle user fetching
    return await this.verifyToken();
  }
}

export default AuthService;