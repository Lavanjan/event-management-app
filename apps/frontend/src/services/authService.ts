import api from './api';
import { User, AuthTokens } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    console.log('AuthService: Attempting login with:', { email: credentials.email });
    const response = await api.post('/auth/login', credentials);
    console.log('AuthService: Login response:', response.data);
    return response.data.data;
  }

  async register(userData: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  }

  async logout(): Promise<void> {
    // Optional: Call logout endpoint to invalidate tokens on server
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors on logout
      console.warn('Logout request failed:', error);
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.patch('/auth/change-password', data);
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await api.post('/auth/forgot-password', data);
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await api.post('/auth/reset-password', data);
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data;
  }
}

export const authService = new AuthService();
