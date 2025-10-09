import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '../store';
import { logout, updateTokens } from '../store/slices/authSlice';
import { logEnvVars } from '../config/environment';

const API_BASE_URL = `${import.meta.env.VITE_API_PROXY_TARGET}/api` || 'http://147.93.179.153:3004';
console.log('🔍 API Base URL:', API_BASE_URL);

// Create axios instance with enhanced security configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  withCredentials: true, // Include cookies in all requests
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
});

// Request interceptor to add auth token and security headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    logEnvVars();
    const state = store.getState();
    const token = state.auth.accessToken;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add security headers
    if (config.headers) {
      config.headers['X-Client-Version'] = import.meta.env.VITE_APP_VERSION || '1.0.0';
      // config.headers['X-Request-ID'] = crypto.randomUUID();

      // Add CSRF token if available and enabled
      if (import.meta.env.VITE_ENABLE_CSRF === 'true') {
        const csrfToken = document
          .querySelector('meta[name="csrf-token"]')
          ?.getAttribute('content');
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      }
    }

    // Log request in development
    if (import.meta.env.VITE_ENABLE_REQUEST_LOGGING === 'true') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  error => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (import.meta.env.VITE_ENABLE_REQUEST_LOGGING === 'true') {
      console.log(
        `✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`
      );
    }
    return response;
  },
  async error => {
    const originalRequest = error.config;

    console.error('Axios error.config:', error.config);
    console.error('Axios error.response:', error.response);

    // Log errors in development
    if (import.meta.env.VITE_ENABLE_REQUEST_LOGGING === 'true') {
      console.error(
        `❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - ${error.response?.status}`,
        error.response?.data
      );
    }

    // Handle 401 Unauthorized - Token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const state = store.getState();
      const refreshToken = state.auth.refreshToken;

      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {
              refreshToken,
            },
            {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
              },
            }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          store.dispatch(
            updateTokens({
              accessToken,
              refreshToken: newRefreshToken,
            })
          );

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Refresh failed, logout user
          store.dispatch(logout());
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout user
        store.dispatch(logout());
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden - Insufficient permissions
    if (error.response?.status === 403) {
      console.warn('Access denied - insufficient permissions');
      // Could show a toast notification here
    }

    // Handle 429 Too Many Requests - Rate limiting
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded - please try again later');
      // Could implement exponential backoff here
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error - please check your connection');
    }

    return Promise.reject(error);
  }
);

// Utility functions for common API patterns
export const apiUtils = {
  // Handle API errors consistently
  handleError: (error: any) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  // Create standardized query parameters
  createQueryParams: (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  },

  // Validate response structure
  validateResponse: (response: any, expectedFields: string[] = []) => {
    if (!response.data) {
      throw new Error('Invalid response structure: missing data field');
    }

    expectedFields.forEach(field => {
      if (!(field in response.data)) {
        throw new Error(`Invalid response structure: missing ${field} field`);
      }
    });

    return response.data;
  },
};

// Export the configured axios instance
export { api };
export default api;
