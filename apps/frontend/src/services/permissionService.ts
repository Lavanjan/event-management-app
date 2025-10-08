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

export interface UserPermissions {
  userId: string;
  userType: string;
  organizationId?: string;
  permissions: string[];
  isProductAdmin: boolean;
}

class PermissionService {
  private userPermissions: UserPermissions | null = null;
  private permissionsCache: Map<string, boolean> = new Map();

  async getOrganizationPermissions(organizationId: string): Promise<OrganizationPermissions> {
    const response = await api.get(`/organizations/${organizationId}/permissions`);
    return response.data;
  }

  async updateOrganizationPermissions(organizationId: string, permissions: Permission[]): Promise<void> {
    await api.put(`/organizations/${organizationId}/permissions`, { permissions });
  }

  /**
   * Load user permissions from the backend
   */
  async loadUserPermissions(): Promise<UserPermissions | null> {
    try {
      const response = await api.get<{
        success: boolean;
        data: UserPermissions;
      }>('/auth/permissions');

      if (response.data.success) {
        this.userPermissions = response.data.data;
        this.permissionsCache.clear(); // Clear cache when permissions are reloaded
        return this.userPermissions;
      }
    } catch (error) {
      console.error('Failed to load user permissions:', error);
    }

    return null;
  }

  /**
   * Check if the current user has a specific permission
   */
  // @ts-ignore
  async hasPermission(permission: string, organizationId?: string): Promise<boolean> {
    // Check cache first
    if (this.permissionsCache.has(permission)) {
      return this.permissionsCache.get(permission)!;
    }

    // Load permissions if not already loaded
    if (!this.userPermissions) {
      await this.loadUserPermissions();
    }

    if (!this.userPermissions) {
      this.permissionsCache.set(permission, false);
      return false;
    }

    // Product admins have all permissions
    if (this.userPermissions.isProductAdmin) {
      this.permissionsCache.set(permission, true);
      return true;
    }

    // Check if user has the specific permission
    const hasPermission = this.userPermissions.permissions.includes(permission);
    this.permissionsCache.set(permission, hasPermission);

    return hasPermission;
  }

  /**
   * Check if the current user has access to a module
   */
  async hasModuleAccess(module: string): Promise<boolean> {
    if (!this.userPermissions) {
      await this.loadUserPermissions();
    }

    if (!this.userPermissions) {
      return false;
    }

    // Product admins have access to all modules
    if (this.userPermissions.isProductAdmin) {
      return true;
    }

    // Check if user has any permission for the module
    const modulePermissions = this.userPermissions.permissions.filter(
      permission => permission.startsWith(`${module}.`)
    );

    return modulePermissions.length > 0;
  }

  /**
   * Get all permissions for the current user
   */
  getUserPermissions(): string[] {
    return this.userPermissions?.permissions || [];
  }

  /**
   * Check if the current user is a product admin
   */
  isProductAdmin(): boolean {
    return this.userPermissions?.isProductAdmin || false;
  }

  /**
   * Get the user's organization ID
   */
  getOrganizationId(): string | undefined {
    return this.userPermissions?.organizationId;
  }

  /**
   * Clear permissions cache (useful when user logs out or permissions change)
   */
  clearCache(): void {
    this.userPermissions = null;
    this.permissionsCache.clear();
  }

  /**
   * Get enabled modules for the current user
   */
  async getEnabledModules(): Promise<string[]> {
    if (!this.userPermissions) {
      await this.loadUserPermissions();
    }

    if (!this.userPermissions) {
      return [];
    }

    // Product admins have access to all modules
    if (this.userPermissions.isProductAdmin) {
      return ['dashboard', 'events', 'bookings', 'inventory', 'documents', 'financial', 'users', 'settings'];
    }

    // Extract unique modules from permissions
    const modules = new Set<string>();
    this.userPermissions.permissions.forEach(permission => {
      const [module] = permission.split('.');
      if (module) {
        modules.add(module);
      }
    });

    return Array.from(modules);
  }
}

export const permissionService = new PermissionService();
