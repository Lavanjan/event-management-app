import api from './api';
import { UserType } from '../types';

export interface SecureLoginRequest {
  email: string;
  password: string;
}

export interface SecureRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SecureAuthResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: UserType;
    roles: string[];
    permissions: string[];
  };
  sessionId?: string;
}

export interface SecureUserResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: UserType;
    organizationId?: string;
    roles: string[];
    permissions: string[];
  };
}

class SecureAuthService {
  async login(credentials: SecureLoginRequest): Promise<SecureAuthResponse> {
    console.log('SecureAuthService: Attempting secure login with:', { email: credentials.email });
    
    const response = await api.post('/auth/login', credentials, {
      withCredentials: true, // Important: Include cookies in requests
    });
    
    console.log('SecureAuthService: Secure login response:', response.data);
    return response.data;
  }

  async register(userData: SecureRegisterRequest): Promise<SecureAuthResponse> {
    console.log('SecureAuthService: Attempting registration with:', { email: userData.email });
    
    const response = await api.post('/auth/register', userData, {
      withCredentials: true,
    });
    
    console.log('SecureAuthService: Registration response:', response.data);
    return response.data;
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    console.log('SecureAuthService: Attempting logout');
    
    try {
      const response = await api.post('/auth/logout', {}, {
        withCredentials: true,
      });
      
      console.log('SecureAuthService: Logout response:', response.data);
      return response.data;
    } catch (error) {
      console.error('SecureAuthService: Logout error:', error);
      // Even if logout fails on server, we should clear local state
      return { success: true, message: 'Logged out locally' };
    }
  }

  async getCurrentUser(): Promise<SecureUserResponse | null> {
    try {
      console.log('SecureAuthService: Getting current user');
      
      const response = await api.get('/auth/me', {
        withCredentials: true,
      });
      
      console.log('SecureAuthService: Current user response:', response.data);
      return response.data;
    } catch (error) {
      console.error('SecureAuthService: Get current user error:', error);
      return null;
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      console.log('SecureAuthService: Refreshing session');
      
      const userResponse = await this.getCurrentUser();
      return userResponse?.success || false;
    } catch (error) {
      console.error('SecureAuthService: Session refresh error:', error);
      return false;
    }
  }

  // Check if user is authenticated by trying to get current user
  async isAuthenticated(): Promise<boolean> {
    try {
      const userResponse = await this.getCurrentUser();
      return userResponse?.success || false;
    } catch (error) {
      return false;
    }
  }

  // Legacy JWT methods for backward compatibility
  async loginJWT(credentials: SecureLoginRequest): Promise<any> {
    console.log('SecureAuthService: Using legacy JWT login');
    
    const response = await api.post('/auth/login-jwt', credentials);
    console.log('SecureAuthService: Legacy JWT login response:', response.data);
    return response.data.data;
  }
}

export default new SecureAuthService();
