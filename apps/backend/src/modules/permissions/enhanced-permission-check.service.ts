import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { OrganizationPermission } from '../../database/entities/organization-permission.entity';
import { OrganizationPackage } from '../../database/entities/organization-package.entity';
import { RolePermission } from '../../database/entities/role-permission.entity';

export interface UserPermissions {
  directPermissions: string[];
  rolePermissions: string[];
  allPermissions: string[];
  organizationPermissions: string[];
}

@Injectable()
export class EnhancedPermissionCheckService {
  private readonly logger = new Logger(EnhancedPermissionCheckService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganizationPermission)
    private organizationPermissionRepository: Repository<OrganizationPermission>,
    @InjectRepository(OrganizationPackage)
    private organizationPackageRepository: Repository<OrganizationPackage>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  /**
   * Get all permissions for a user (direct + role-based)
   */
  async getUserPermissions(userId: string, organizationId: string): Promise<UserPermissions> {
    try {
      // Check if user is organization admin
      const user = await this.userRepository.findOne({
        where: { id: userId, organizationId },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const isOrganizationAdmin = user.userType === 'organization_admin';

      // For organization admins, get permissions directly from feature packages
      if (isOrganizationAdmin) {
        const packagePermissions = await this.getOrganizationPackagePermissions(organizationId);
        return {
          directPermissions: packagePermissions,
          rolePermissions: packagePermissions,
          allPermissions: packagePermissions,
          organizationPermissions: packagePermissions,
        };
      }

      // For regular users, use the existing logic with organization permission filtering
      // Get organization's enabled permissions
      const organizationPermissions = await this.getOrganizationPermissions(organizationId);
      const enabledPermissionKeys = organizationPermissions.map(p => p.permissionKey);

      // Get user's direct permissions (if any - from existing system)
      const directPermissions = await this.getUserDirectPermissions(userId, organizationId);

      // Get user's role-based permissions
      const rolePermissions = await this.getUserRolePermissions(userId, organizationId);

      // Combine all permissions and filter by organization's enabled permissions
      const allPermissions = [...new Set([...directPermissions, ...rolePermissions])]
        .filter(permission => enabledPermissionKeys.includes(permission));

      return {
        directPermissions: directPermissions.filter(p => enabledPermissionKeys.includes(p)),
        rolePermissions: rolePermissions.filter(p => enabledPermissionKeys.includes(p)),
        allPermissions,
        organizationPermissions: enabledPermissionKeys,
      };
    } catch (error) {
      this.logger.error(`Error getting user permissions for user ${userId}:`, error);
      return {
        directPermissions: [],
        rolePermissions: [],
        allPermissions: [],
        organizationPermissions: [],
      };
    }
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(userId: string, organizationId: string, permissionKey: string): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId, organizationId);
      return userPermissions.allPermissions.includes(permissionKey);
    } catch (error) {
      this.logger.error(`Error checking permission ${permissionKey} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(userId: string, organizationId: string, permissionKeys: string[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId, organizationId);
      return permissionKeys.some(permission => userPermissions.allPermissions.includes(permission));
    } catch (error) {
      this.logger.error(`Error checking any permissions for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(userId: string, organizationId: string, permissionKeys: string[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId, organizationId);
      return permissionKeys.every(permission => userPermissions.allPermissions.includes(permission));
    } catch (error) {
      this.logger.error(`Error checking all permissions for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get permissions from organization's allocated feature packages
   */
  private async getOrganizationPackagePermissions(organizationId: string): Promise<string[]> {
    const organizationPackages = await this.organizationPackageRepository.find({
      where: { organizationId, isActive: true },
      relations: ['featurePackage'],
    });

    const permissions: string[] = [];
    for (const orgPackage of organizationPackages) {
      if (orgPackage.featurePackage && orgPackage.featurePackage.features) {
        for (const feature of orgPackage.featurePackage.features) {
          if (!permissions.includes(feature)) {
            permissions.push(feature);
          }
        }
      }
    }

    return permissions;
  }

  /**
   * Get permissions enabled for an organization
   */
  async getOrganizationPermissions(organizationId: string): Promise<OrganizationPermission[]> {
    return await this.organizationPermissionRepository.find({
      where: { organizationId, enabled: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get user's direct permissions (from existing permission system)
   */
  private async getUserDirectPermissions(userId: string, organizationId: string): Promise<string[]> {
    try {
      // This would integrate with the existing permission system
      // For now, we'll return empty array as we're moving to role-based permissions
      return [];
    } catch (error) {
      this.logger.error(`Error getting direct permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get user's role-based permissions
   */
  private async getUserRolePermissions(userId: string, organizationId: string): Promise<string[]> {
    try {
      const result = await this.rolePermissionRepository
        .createQueryBuilder('rp')
        .innerJoin('user_roles', 'ur', 'ur.role_id = rp.role_id')
        .innerJoin('roles', 'r', 'r.id = rp.role_id')
        .innerJoin('users', 'u', 'u.id = ur.user_id')
        .where('u.id = :userId', { userId })
        .andWhere('u.organization_id = :organizationId', { organizationId })
        .andWhere('rp.organization_id = :organizationId', { organizationId })
        .andWhere('rp.enabled = true')
        .andWhere('rp.deleted_at IS NULL')
        .andWhere('r.is_active = true')
        .select('rp.permission_key')
        .getRawMany();

      return result.map(r => r.permission_key);
    } catch (error) {
      this.logger.error(`Error getting role permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check if user is organization admin (has user management permissions)
   */
  async isOrganizationAdmin(userId: string, organizationId: string): Promise<boolean> {
    return await this.hasAnyPermission(userId, organizationId, [
      'users.create',
      'users.update',
      'users.delete',
    ]);
  }

  /**
   * Check if user can manage roles
   */
  async canManageRoles(userId: string, organizationId: string): Promise<boolean> {
    return await this.hasAnyPermission(userId, organizationId, [
      'users.create', // Organization admins can manage roles
      'users.update',
    ]);
  }

  /**
   * Get permission summary for user
   */
  async getPermissionSummary(userId: string, organizationId: string) {
    const userPermissions = await this.getUserPermissions(userId, organizationId);
    
    // Group permissions by category
    const organizationPermissions = await this.getOrganizationPermissions(organizationId);
    const permissionsByCategory = organizationPermissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = {
          total: 0,
          granted: 0,
          permissions: [],
        };
      }
      acc[perm.category].total++;
      acc[perm.category].permissions.push({
        key: perm.permissionKey,
        name: perm.name,
        granted: userPermissions.allPermissions.includes(perm.permissionKey),
      });
      if (userPermissions.allPermissions.includes(perm.permissionKey)) {
        acc[perm.category].granted++;
      }
      return acc;
    }, {} as Record<string, any>);

    return {
      totalPermissions: organizationPermissions.length,
      grantedPermissions: userPermissions.allPermissions.length,
      directPermissions: userPermissions.directPermissions.length,
      rolePermissions: userPermissions.rolePermissions.length,
      permissionsByCategory,
      isOrganizationAdmin: await this.isOrganizationAdmin(userId, organizationId),
      canManageRoles: await this.canManageRoles(userId, organizationId),
    };
  }

  /**
   * Validate permission key format
   */
  validatePermissionKey(permissionKey: string): boolean {
    // Permission keys should be in format: module.action
    const regex = /^[a-z_]+\.[a-z_]+$/;
    return regex.test(permissionKey);
  }

  /**
   * Parse permission key into module and action
   */
  parsePermissionKey(permissionKey: string): { module: string; action: string } | null {
    if (!this.validatePermissionKey(permissionKey)) {
      return null;
    }

    const [module, action] = permissionKey.split('.');
    return { module, action };
  }
}
