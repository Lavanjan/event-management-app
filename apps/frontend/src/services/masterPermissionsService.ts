import { api } from './api';

export interface MasterPermission {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  module: string;
  action: string;
  isActive: boolean;
  defaultEnabled: boolean;
  sortOrder: number;
  metadata: Record<string, any>;
}

export interface MasterPermissionsResponse {
  success: boolean;
  data: MasterPermission[];
  timestamp: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: string[];
  timestamp: string;
}

export interface ModulesResponse {
  success: boolean;
  data: string[];
  timestamp: string;
}

class MasterPermissionsService {
  private baseUrl = '/api/permissions';

  /**
   * Get all master permissions
   */
  async getAllPermissions(): Promise<MasterPermission[]> {
    try {
      const response = await api.get<MasterPermissionsResponse>(this.baseUrl);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch master permissions:', error);
      // Return fallback permissions if API fails
      return this.getFallbackPermissions();
    }
  }

  /**
   * Get permissions by category
   */
  async getPermissionsByCategory(category: string): Promise<MasterPermission[]> {
    try {
      const response = await api.get<MasterPermissionsResponse>(
        `${this.baseUrl}?category=${encodeURIComponent(category)}`
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to fetch permissions for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Get permissions by module
   */
  async getPermissionsByModule(module: string): Promise<MasterPermission[]> {
    try {
      const response = await api.get<MasterPermissionsResponse>(
        `${this.baseUrl}?module=${encodeURIComponent(module)}`
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to fetch permissions for module ${module}:`, error);
      return [];
    }
  }

  /**
   * Get all permission categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await api.get<CategoriesResponse>(`${this.baseUrl}/categories`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch permission categories:', error);
      return ['Dashboard', 'Events', 'Bookings', 'Inventory', 'Documents', 'Financial', 'Users', 'Settings'];
    }
  }

  /**
   * Get all permission modules
   */
  async getModules(): Promise<string[]> {
    try {
      const response = await api.get<ModulesResponse>(`${this.baseUrl}/modules`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch permission modules:', error);
      return ['dashboard', 'events', 'bookings', 'inventory', 'documents', 'financial', 'users', 'settings'];
    }
  }

  /**
   * Group permissions by category
   */
  async getPermissionsGroupedByCategory(): Promise<Record<string, MasterPermission[]>> {
    const permissions = await this.getAllPermissions();
    const grouped: Record<string, MasterPermission[]> = {};

    permissions.forEach(permission => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = [];
      }
      grouped[permission.category].push(permission);
    });

    // Sort permissions within each category by sortOrder and name
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }

  /**
   * Fallback permissions if API is not available
   */
  private getFallbackPermissions(): MasterPermission[] {
    return [
      {
        id: '1',
        key: 'dashboard.view',
        name: 'View Dashboard',
        description: 'Access to dashboard overview',
        category: 'Dashboard',
        module: 'dashboard',
        action: 'view',
        isActive: true,
        defaultEnabled: true,
        sortOrder: 1,
        metadata: {},
      },
      {
        id: '2',
        key: 'events.read',
        name: 'View Events',
        description: 'View events and event details',
        category: 'Events',
        module: 'events',
        action: 'read',
        isActive: true,
        defaultEnabled: true,
        sortOrder: 1,
        metadata: {},
      },
      {
        id: '3',
        key: 'bookings.read',
        name: 'View Bookings',
        description: 'View bookings and booking details',
        category: 'Bookings',
        module: 'bookings',
        action: 'read',
        isActive: true,
        defaultEnabled: true,
        sortOrder: 1,
        metadata: {},
      },
      {
        id: '4',
        key: 'inventory.read',
        name: 'View Inventory',
        description: 'View inventory items and details',
        category: 'Inventory',
        module: 'inventory',
        action: 'read',
        isActive: true,
        defaultEnabled: true,
        sortOrder: 1,
        metadata: {},
      },
      {
        id: '5',
        key: 'documents.read',
        name: 'View Documents',
        description: 'View and download documents',
        category: 'Documents',
        module: 'documents',
        action: 'read',
        isActive: true,
        defaultEnabled: true,
        sortOrder: 1,
        metadata: {},
      },
      {
        id: '6',
        key: 'users.read',
        name: 'View Users',
        description: 'View user list and details',
        category: 'Users',
        module: 'users',
        action: 'read',
        isActive: true,
        defaultEnabled: true,
        sortOrder: 1,
        metadata: {},
      },
      {
        id: '7',
        key: 'settings.read',
        name: 'View Settings',
        description: 'View organization settings',
        category: 'Settings',
        module: 'settings',
        action: 'read',
        isActive: true,
        defaultEnabled: true,
        sortOrder: 1,
        metadata: {},
      },
    ];
  }
}

export const masterPermissionsService = new MasterPermissionsService();
