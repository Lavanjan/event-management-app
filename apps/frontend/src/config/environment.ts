/**
 * Environment Configuration Service
 * Centralizes all environment variable access with type safety and validation
 */
export function logEnvVars() {
  if (typeof window !== 'undefined') {
    console.log('🔍 Environment Variables:');
    console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('VITE_API_TIMEOUT:', import.meta.env.VITE_API_TIMEOUT);
    console.log('VITE_ENABLE_REQUEST_LOGGING:', import.meta.env.VITE_ENABLE_REQUEST_LOGGING);
    console.log('VITE_APP_ENVIRONMENT:', import.meta.env.VITE_APP_ENVIRONMENT);
  }
}
export interface EnvironmentConfig {
  // API Configuration
  apiBaseUrl: string;
  apiTimeout: number;

  // Application Configuration
  appName: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';

  // Security Configuration
  enableCsrf: boolean;
  enableRequestLogging: boolean;

  // Feature Flags
  enablePaymentModule: boolean;
  enableRoleManagement: boolean;
  enableAdvancedPermissions: boolean;

  // External Services
  stripePublishableKey?: string;
  paypalClientId?: string;

  // Analytics
  googleAnalyticsId?: string;
  sentryDsn?: string;

  // Development Settings
  enableMockData: boolean;
  enableDebugMode: boolean;
}

/**
 * Get environment variable with type conversion and validation
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
}

function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = import.meta.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
}

/**
 * Environment configuration instance
 */
export const config: EnvironmentConfig = {
  // API Configuration
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', '/api'),
  apiTimeout: getEnvNumber('VITE_API_TIMEOUT', 30000),

  // Application Configuration
  appName: getEnvVar('VITE_APP_NAME', 'Event Management System'),
  appVersion: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  environment: getEnvVar('VITE_APP_ENVIRONMENT', 'development') as
    | 'development'
    | 'staging'
    | 'production',

  // Security Configuration
  enableCsrf: getEnvBoolean('VITE_ENABLE_CSRF', true),
  enableRequestLogging: getEnvBoolean('VITE_ENABLE_REQUEST_LOGGING', true),

  // Feature Flags
  enablePaymentModule: getEnvBoolean('VITE_ENABLE_PAYMENT_MODULE', true),
  enableRoleManagement: getEnvBoolean('VITE_ENABLE_ROLE_MANAGEMENT', true),
  enableAdvancedPermissions: getEnvBoolean('VITE_ENABLE_ADVANCED_PERMISSIONS', true),

  // External Services
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  paypalClientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,

  // Analytics
  googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,

  // Development Settings
  enableMockData: getEnvBoolean('VITE_ENABLE_MOCK_DATA', false),
  enableDebugMode: getEnvBoolean('VITE_ENABLE_DEBUG_MODE', false),
};

/**
 * Validate configuration on startup
 */
export function validateConfig(): void {
  // Validate required configuration
  if (!config.apiBaseUrl) {
    throw new Error('API base URL is required');
  }

  if (config.environment === 'production') {
    // Additional production validations
    if (config.enableDebugMode) {
      console.warn('Debug mode is enabled in production');
    }
    if (config.enableMockData) {
      throw new Error('Mock data should not be enabled in production');
    }
  }

  console.log(`🚀 Application configured for ${config.environment} environment`);
  console.log(`📡 API Base URL: ${config.apiBaseUrl}`);
  console.log('Proxy target:', import.meta.env.VITE_API_PROXY_TARGET);

  if (config.enableDebugMode) {
    console.log('🐛 Debug mode enabled');
    console.log('⚙️ Configuration:', config);
  }
}

// Validate configuration on module load
validateConfig();

export default config;
