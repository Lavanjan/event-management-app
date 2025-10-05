import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface UserPermissions {
  userId: string;
  userType: string;
  organizationId?: string;
  permissions: string[];
  isProductAdmin: boolean;
}

export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
}

export const usePermissions = () => {
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/auth/permissions');
        const permissions = response.data;
        setUserPermissions(permissions);
      } catch (error: any) {
        if (error.response?.status === 401) {
          // User not authenticated
          setUserPermissions(null);
          return;
        }
        throw error;
      }
      setUserPermissions(permissions);
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      setUserPermissions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!userPermissions) {
      return false;
    }

    // Product admins have all permissions
    if (userPermissions.isProductAdmin) {
      return true;
    }

    // Check if user has the specific permission
    return userPermissions.permissions.includes(permission);
  }, [userPermissions]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  const checkPermission = useCallback((permission: string): PermissionCheckResult => {
    if (!userPermissions) {
      return {
        hasPermission: false,
        reason: 'User not authenticated',
      };
    }

    if (userPermissions.isProductAdmin) {
      return {
        hasPermission: true,
        reason: 'Product admin has all permissions',
      };
    }

    const hasAccess = userPermissions.permissions.includes(permission);
    return {
      hasPermission: hasAccess,
      reason: hasAccess ? 'Permission granted' : 'Permission not granted',
    };
  }, [userPermissions]);

  const refreshPermissions = useCallback(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  return {
    userPermissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    refreshPermissions,
  };
};

// Permission constants for easy reference
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_ANALYTICS: 'dashboard.analytics',
  DASHBOARD_REPORTS: 'dashboard.reports',

  // Events
  EVENTS_READ: 'events.read',
  EVENTS_CREATE: 'events.create',
  EVENTS_UPDATE: 'events.update',
  EVENTS_DELETE: 'events.delete',
  EVENTS_PUBLISH: 'events.publish',

  // Bookings
  BOOKINGS_READ: 'bookings.read',
  BOOKINGS_CREATE: 'bookings.create',
  BOOKINGS_UPDATE: 'bookings.update',
  BOOKINGS_CANCEL: 'bookings.cancel',
  BOOKINGS_REFUND: 'bookings.refund',

  // Inventory
  INVENTORY_READ: 'inventory.read',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_DELETE: 'inventory.delete',

  // Documents
  DOCUMENTS_READ: 'documents.read',
  DOCUMENTS_CREATE: 'documents.create',
  DOCUMENTS_UPDATE: 'documents.update',
  DOCUMENTS_DELETE: 'documents.delete',

  // Financial
  FINANCIAL_READ: 'financial.read',
  FINANCIAL_TRANSACTIONS: 'financial.transactions',
  FINANCIAL_PAYOUTS: 'financial.payouts',

  // Users
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Settings
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_INTEGRATIONS: 'settings.integrations',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];
