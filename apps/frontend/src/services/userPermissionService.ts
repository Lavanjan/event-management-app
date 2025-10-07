import { api } from './api';

export interface UserPermission {
  id: string;
  userId: string;
  organizationId: string;
  permissionKey: string;
  type: 'grant' | 'deny';
  grantedBy: string;
  reason?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPermissionDto {
  userId: string;
  organizationId: string;
  permissionKey: string;
  type: 'grant' | 'deny';
  reason?: string;
  expiresAt?: string;
}

export interface UpdateUserPermissionDto {
  type?: 'grant' | 'deny';
  reason?: string;
  expiresAt?: string;
}

export interface BulkGrantPermissionsDto {
  userId: string;
  organizationId: string;
  permissionKeys: string[];
  grantedBy: string;
  reason?: string;
}

export interface BulkRevokePermissionsDto {
  userId: string;
  organizationId: string;
  permissionKeys: string[];
  revokedBy: string;
  reason?: string;
}

export interface UserPermissionSummary {
  userId: string;
  organizationId: string;
  permissions: UserPermission[];
  effectivePermissions: string[];
  packageFeatures: string[];
  rolePermissions: string[];
  userOverrides: {
    grants: string[];
    denies: string[];
  };
}

class UserPermissionService {
  // Individual User Permission Management
  async grantPermissionToUser(data: CreateUserPermissionDto): Promise<UserPermission> {
    const response = await api.post('/user-permissions', data);
    return response.data;
  }

  async getUserPermissions(userId: string): Promise<UserPermissionSummary> {
    const response = await api.get(`/user-permissions/user/${userId}`);
    return response.data;
  }

  async getOrganizationUserPermissions(): Promise<UserPermission[]> {
    const response = await api.get('/user-permissions/organization');
    return response.data;
  }

  async getUserPermissionById(id: string): Promise<UserPermission> {
    const response = await api.get(`/user-permissions/${id}`);
    return response.data;
  }

  async updateUserPermission(id: string, data: UpdateUserPermissionDto): Promise<UserPermission> {
    const response = await api.patch(`/user-permissions/${id}`, data);
    return response.data;
  }

  async removeUserPermission(id: string): Promise<void> {
    await api.delete(`/user-permissions/${id}`);
  }

  // Bulk Operations
  async bulkGrantPermissions(data: BulkGrantPermissionsDto): Promise<UserPermission[]> {
    const response = await api.post('/user-permissions/bulk/grant', data);
    return response.data;
  }

  async bulkRevokePermissions(data: BulkRevokePermissionsDto): Promise<void> {
    await api.post('/user-permissions/bulk/revoke', data);
  }

  // Helper methods
  async grantPermission(userId: string, permissionKey: string, reason?: string): Promise<UserPermission> {
    const response = await api.get('/auth/me');
    const organizationId = response.data.organizationId;

    return this.grantPermissionToUser({
      userId,
      organizationId,
      permissionKey,
      type: 'grant',
      reason,
    });
  }

  async denyPermission(userId: string, permissionKey: string, reason?: string): Promise<UserPermission> {
    const response = await api.get('/auth/me');
    const organizationId = response.data.organizationId;

    return this.grantPermissionToUser({
      userId,
      organizationId,
      permissionKey,
      type: 'deny',
      reason,
    });
  }

  async removePermissionOverride(userId: string, permissionKey: string): Promise<void> {
    const permissions = await this.getUserPermissions(userId);
    const override = permissions.permissions.find(p => p.permissionKey === permissionKey);

    if (override) {
      await this.removeUserPermission(override.id);
    }
  }
}

export const userPermissionService = new UserPermissionService();
