import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { User, UserType } from '../../database/entities';
import { MasterPermissionsService } from '../permissions/master-permissions.service';
import { OrganizationPermissionsService } from '../organizations/organization-permissions.service';
import { EnhancedPermissionCheckService } from '../permissions/enhanced-permission-check.service';

export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
}

export interface UserPermissions {
  userId: string;
  userType: UserType;
  organizationId?: string;
  permissions: string[];
  isProductAdmin: boolean;
}

@Injectable()
export class PermissionCheckService {
  private readonly logger = new Logger(PermissionCheckService.name);

  constructor(
    private masterPermissionsService: MasterPermissionsService,
    @Inject(forwardRef(() => OrganizationPermissionsService))
    private organizationPermissionsService: OrganizationPermissionsService,
    private enhancedPermissionService: EnhancedPermissionCheckService
  ) {}

  /**
   * Check if a user has a specific permission
   */
  async checkPermission(user: User, permission: string): Promise<PermissionCheckResult> {
    try {
      // Product admins have all permissions
      if (user.userType === UserType.PRODUCT_ADMIN) {
        return {
          hasPermission: true,
          reason: 'Product admin has all permissions',
        };
      }

      // Organization users need to check organization permissions (including role-based)
      if (
        user.userType === UserType.ORGANIZATION_ADMIN ||
        user.userType === UserType.ORGANIZATION_USER
      ) {
        if (!user.organizationId) {
          return {
            hasPermission: false,
            reason: 'User does not belong to an organization',
          };
        }

        // Use enhanced permission service that includes role-based permissions
        const hasPermission = await this.enhancedPermissionService.hasPermission(
          user.id,
          user.organizationId,
          permission
        );

        return {
          hasPermission,
          reason: hasPermission
            ? 'Permission granted (direct or role-based)'
            : 'Permission not granted',
        };
      }

      return {
        hasPermission: false,
        reason: 'Invalid user type',
      };
    } catch (error) {
      this.logger.error(`Error checking permission ${permission} for user ${user.email}:`, error);
      return {
        hasPermission: false,
        reason: 'Error checking permission',
      };
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(user: User): Promise<UserPermissions> {
    try {
      const isProductAdmin = user.userType === UserType.PRODUCT_ADMIN;

      let permissions: string[] = [];

      if (isProductAdmin) {
        // Product admins have all permissions
        permissions = await this.getAllAvailablePermissions();
      } else if (
        user.organizationId &&
        (user.userType === UserType.ORGANIZATION_ADMIN ||
          user.userType === UserType.ORGANIZATION_USER)
      ) {
        // Get user's actual permissions (including role-based)
        const userPermissions = await this.enhancedPermissionService.getUserPermissions(
          user.id,
          user.organizationId
        );
        permissions = userPermissions.allPermissions;
      }

      return {
        userId: user.id,
        userType: user.userType,
        organizationId: user.organizationId,
        permissions,
        isProductAdmin,
      };
    } catch (error) {
      this.logger.error(`Error getting user permissions for user ${user.email}:`, error);
      return {
        userId: user.id,
        userType: user.userType,
        organizationId: user.organizationId,
        permissions: [],
        isProductAdmin: false,
      };
    }
  }

  /**
   * Check multiple permissions at once
   */
  async checkMultiplePermissions(
    user: User,
    permissions: string[]
  ): Promise<Record<string, PermissionCheckResult>> {
    const results: Record<string, PermissionCheckResult> = {};

    for (const permission of permissions) {
      results[permission] = await this.checkPermission(user, permission);
    }

    return results;
  }

  /**
   * Get all available permissions in the system
   */
  private async getAllAvailablePermissions(): Promise<string[]> {
    try {
      return await this.masterPermissionsService.getAllKeys();
    } catch (error) {
      this.logger.error('Failed to get permissions from database, using fallback', error);
      // Fallback to basic permissions if database is not available
      return [
        'dashboard.view',
        'events.read',
        'bookings.read',
        'inventory.read',
        'documents.read',
        'users.read',
        'settings.read',
      ];
    }
  }
}
