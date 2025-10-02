import { api } from './api';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

export interface OrganizationPermissions {
  organizationId: string;
  permissions: Permission[];
}

class PermissionService {
  async getOrganizationPermissions(organizationId: string): Promise<OrganizationPermissions> {
    const response = await api.get(`/organizations/${organizationId}/permissions`);
    return response.data;
  }

  async updateOrganizationPermissions(organizationId: string, permissions: Permission[]): Promise<void> {
    await api.put(`/organizations/${organizationId}/permissions`, { permissions });
  }

  async getUserPermissions(userId: string, organizationId: string): Promise<string[]> {
    const response = await api.get(`/users/${userId}/permissions?organizationId=${organizationId}`);
    return response.data.permissions;
  }

  // Check if user has specific permission in organization
  async hasPermission(permission: string, organizationId?: string): Promise<boolean> {
    try {
      const response = await api.get(`/auth/check-permission`, {
        params: { permission, organizationId }
      });
      return response.data.hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Get all available permissions
  getAvailablePermissions(): Permission[] {
    return [
      // Dashboard permissions
      { id: 'dashboard.view', name: 'View Dashboard', description: 'Access to dashboard overview', category: 'Dashboard', enabled: false },
      { id: 'dashboard.analytics', name: 'View Analytics', description: 'Access to analytics and reports', category: 'Dashboard', enabled: false },
      { id: 'dashboard.reports', name: 'Generate Reports', description: 'Generate and export reports', category: 'Dashboard', enabled: false },

      // Events permissions
      { id: 'events.read', name: 'View Events', description: 'View events and event details', category: 'Events', enabled: false },
      { id: 'events.create', name: 'Create Events', description: 'Create new events', category: 'Events', enabled: false },
      { id: 'events.update', name: 'Edit Events', description: 'Edit existing events', category: 'Events', enabled: false },
      { id: 'events.delete', name: 'Delete Events', description: 'Delete events', category: 'Events', enabled: false },
      { id: 'events.publish', name: 'Publish Events', description: 'Publish events to make them public', category: 'Events', enabled: false },

      // Bookings permissions
      { id: 'bookings.read', name: 'View Bookings', description: 'View bookings and booking details', category: 'Bookings', enabled: false },
      { id: 'bookings.create', name: 'Create Bookings', description: 'Create new bookings', category: 'Bookings', enabled: false },
      { id: 'bookings.update', name: 'Edit Bookings', description: 'Edit existing bookings', category: 'Bookings', enabled: false },
      { id: 'bookings.cancel', name: 'Cancel Bookings', description: 'Cancel bookings', category: 'Bookings', enabled: false },
      { id: 'bookings.refund', name: 'Process Refunds', description: 'Process booking refunds', category: 'Bookings', enabled: false },

      // Financial permissions
      { id: 'financial.read', name: 'View Financial Data', description: 'View financial reports and data', category: 'Financial', enabled: false },
      { id: 'financial.transactions', name: 'View Transactions', description: 'View transaction history', category: 'Financial', enabled: false },
      { id: 'financial.payouts', name: 'Manage Payouts', description: 'Manage payout settings and processing', category: 'Financial', enabled: false },

      // Users permissions
      { id: 'users.read', name: 'View Users', description: 'View organization users', category: 'Users', enabled: false },
      { id: 'users.create', name: 'Create Users', description: 'Add new users to organization', category: 'Users', enabled: false },
      { id: 'users.update', name: 'Edit Users', description: 'Edit user information and roles', category: 'Users', enabled: false },
      { id: 'users.delete', name: 'Delete Users', description: 'Remove users from organization', category: 'Users', enabled: false },

      // Settings permissions
      { id: 'settings.read', name: 'View Settings', description: 'View organization settings', category: 'Settings', enabled: false },
      { id: 'settings.update', name: 'Update Settings', description: 'Update organization settings', category: 'Settings', enabled: false },
      { id: 'settings.integrations', name: 'Manage Integrations', description: 'Manage third-party integrations', category: 'Settings', enabled: false },
    ];
  }
}

export const permissionService = new PermissionService();
