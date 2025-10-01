import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { User, UserType } from '../../database/entities';

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
    @Inject(
      forwardRef(() =>
        import('../organizations/organization-permissions.service').then(
          m => m.OrganizationPermissionsService
        )
      )
    )
    private organizationPermissionsService: any
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

      // Organization users need to check organization permissions
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

        const hasPermission = await this.organizationPermissionsService.hasPermission(
          user.organizationId,
          permission
        );

        return {
          hasPermission,
          reason: hasPermission
            ? 'Permission granted by organization'
            : 'Permission not granted by organization',
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
        // Get organization-specific permissions
        permissions = await this.organizationPermissionsService.getEnabledPermissions(
          user.organizationId
        );
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
    // This would typically come from a configuration or database
    // For now, return the default permissions
    return [
      'dashboard.view',
      'dashboard.analytics',
      'dashboard.reports',
      'events.read',
      'events.create',
      'events.update',
      'events.delete',
      'events.publish',
      'bookings.read',
      'bookings.create',
      'bookings.update',
      'bookings.cancel',
      'bookings.refund',
      'financial.read',
      'financial.transactions',
      'financial.payouts',
      'users.read',
      'users.create',
      'users.update',
      'users.delete',
      'settings.read',
      'settings.update',
      'settings.integrations',
    ];
  }
}
