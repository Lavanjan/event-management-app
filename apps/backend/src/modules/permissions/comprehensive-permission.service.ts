import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  User,
  RolePermission,
  OrganizationPermission,
  UserPermission,
  OrganizationPackage,
  FeaturePackage,
} from '../../database/entities';

export interface UserPermissionResult {
  userId: string;
  userType: string;
  organizationId: string;
  permissions: string[];
  isProductAdmin: boolean;
  packageFeatures: string[];
  rolePermissions: string[];
  userOverrides: string[];
  deniedPermissions: string[];
}

@Injectable()
export class ComprehensivePermissionService {
  private readonly logger = new Logger(ComprehensivePermissionService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(OrganizationPermission)
    private readonly organizationPermissionRepository: Repository<OrganizationPermission>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(OrganizationPackage)
    private readonly organizationPackageRepository: Repository<OrganizationPackage>,
    @InjectRepository(FeaturePackage)
    private readonly featurePackageRepository: Repository<FeaturePackage>,
  ) {}

  /**
   * Get comprehensive user permissions using simplified system:
   * - Organization Admin: Gets permissions directly from Feature Packages
   * - Organization Users: Get permissions from Roles + User overrides
   */
  async getUserPermissions(userId: string, organizationId: string): Promise<UserPermissionResult> {
    try {
      // Get user details
      const user = await this.userRepository.findOne({
        where: { id: userId, organizationId },
        relations: ['roles'],
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const isProductAdmin = user.userType === 'product_admin';
      const isOrganizationAdmin = user.userType === 'organization_admin';

      // If product admin, return all permissions
      if (isProductAdmin) {
        const allPermissions = await this.getAllSystemPermissions();
        return {
          userId,
          userType: user.userType,
          organizationId,
          permissions: allPermissions,
          isProductAdmin: true,
          packageFeatures: allPermissions,
          rolePermissions: allPermissions,
          userOverrides: [],
          deniedPermissions: [],
        };
      }

      // If organization admin, get permissions directly from feature packages
      if (isOrganizationAdmin) {
        const packageFeatures = await this.getOrganizationPackageFeatures(organizationId);
        return {
          userId,
          userType: user.userType,
          organizationId,
          permissions: packageFeatures, // Direct access to all package features
          isProductAdmin: false,
          packageFeatures,
          rolePermissions: packageFeatures, // Same as package features for org admin
          userOverrides: [],
          deniedPermissions: [],
        };
      }

      // For organization users, use role-based permissions
      // 1. Get package-level features (what organization has access to)
      const packageFeatures = await this.getOrganizationPackageFeatures(organizationId);

      // 2. Get role-based permissions (what user's role allows)
      const rolePermissions = await this.getUserRolePermissions(userId, organizationId);

      // 3. Get user-specific overrides (individual grants/denies)
      const userOverrides = await this.getUserSpecificPermissions(userId, organizationId);

      // Calculate final permissions
      const finalPermissions = this.calculateFinalPermissions(
        packageFeatures,
        rolePermissions,
        userOverrides
      );

      return {
        userId,
        userType: user.userType,
        organizationId,
        permissions: finalPermissions.granted,
        isProductAdmin: false,
        packageFeatures,
        rolePermissions,
        userOverrides: userOverrides.granted,
        deniedPermissions: finalPermissions.denied,
      };
    } catch (error) {
      this.logger.error(`Error getting user permissions for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all features available to an organization through their packages
   */
  private async getOrganizationPackageFeatures(organizationId: string): Promise<string[]> {
    const orgPackages = await this.organizationPackageRepository
      .createQueryBuilder('op')
      .innerJoin('op.featurePackage', 'fp')
      .where('op.organization_id = :organizationId', { organizationId })
      .andWhere('op.is_active = true')
      .andWhere('fp.is_active = true')
      .andWhere('(op.expires_at IS NULL OR op.expires_at > NOW())')
      .select('fp.features')
      .getRawMany();

    const allFeatures = new Set<string>();
    for (const pkg of orgPackages) {
      if (pkg.features) {
        for (const feature of pkg.features) {
          allFeatures.add(feature);
        }
      }
    }

    return Array.from(allFeatures);
  }

  /**
   * Get permissions from user's roles
   */
  private async getUserRolePermissions(userId: string, organizationId: string): Promise<string[]> {
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
  }

  /**
   * Get user-specific permission overrides
   */
  private async getUserSpecificPermissions(userId: string, organizationId: string): Promise<{
    granted: string[];
    denied: string[];
  }> {
    const userPermissions = await this.userPermissionRepository.find({
      where: {
        userId,
        organizationId,
        enabled: true,
        deletedAt: null,
      },
    });

    const granted = userPermissions
      .filter(up => up.type === 'grant')
      .map(up => up.permissionKey);

    const denied = userPermissions
      .filter(up => up.type === 'deny')
      .map(up => up.permissionKey);

    return { granted, denied };
  }

  /**
   * Calculate final permissions based on three-tier system
   * Priority: User denies > User grants > Role permissions > Package features
   */
  private calculateFinalPermissions(
    packageFeatures: string[],
    rolePermissions: string[],
    userOverrides: { granted: string[]; denied: string[] }
  ): { granted: string[]; denied: string[] } {
    // Start with package features as base
    const basePermissions = new Set(packageFeatures);

    // Intersect with role permissions (user can only have what their role allows)
    const roleAllowed = new Set(rolePermissions);
    const allowedByRole = Array.from(basePermissions).filter(p => roleAllowed.has(p));

    // Apply user-specific grants (can add permissions beyond role)
    const finalGranted = new Set([...allowedByRole, ...userOverrides.granted]);

    // Apply user-specific denies (highest priority - removes permissions)
    for (const denied of userOverrides.denied) {
      finalGranted.delete(denied);
    }

    return {
      granted: Array.from(finalGranted),
      denied: userOverrides.denied,
    };
  }

  /**
   * Get all system permissions (for product admin)
   */
  private async getAllSystemPermissions(): Promise<string[]> {
    const result = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .select('DISTINCT rp.permission_key')
      .getRawMany();

    return result.map(r => r.permission_key);
  }

  /**
   * Grant user-specific permission
   */
  async grantUserPermission(
    userId: string,
    organizationId: string,
    permissionKey: string,
    grantedBy: string,
    reason?: string
  ): Promise<UserPermission> {
    // Remove any existing permission for this user/permission combination
    await this.userPermissionRepository.softDelete({
      userId,
      permissionKey,
    });

    // Get permission details from master permissions
    const masterPermission = await this.getMasterPermissionByKey(permissionKey);
    if (!masterPermission) {
      throw new Error(`Permission not found: ${permissionKey}`);
    }

    const [module, action] = permissionKey.split('.');

    const userPermission = this.userPermissionRepository.create({
      userId,
      organizationId,
      permissionKey,
      name: masterPermission.name,
      description: masterPermission.description,
      category: masterPermission.category,
      module: module || masterPermission.module,
      action: action || masterPermission.action,
      type: 'grant',
      enabled: true,
      grantedBy,
      grantedAt: new Date(),
      reason,
    });

    return this.userPermissionRepository.save(userPermission);
  }

  /**
   * Deny user-specific permission
   */
  async denyUserPermission(
    userId: string,
    organizationId: string,
    permissionKey: string,
    grantedBy: string,
    reason?: string
  ): Promise<UserPermission> {
    // Remove any existing permission for this user/permission combination
    await this.userPermissionRepository.softDelete({
      userId,
      permissionKey,
    });

    // Get permission details from master permissions
    const masterPermission = await this.getMasterPermissionByKey(permissionKey);
    if (!masterPermission) {
      throw new Error(`Permission not found: ${permissionKey}`);
    }

    const [module, action] = permissionKey.split('.');

    const userPermission = this.userPermissionRepository.create({
      userId,
      organizationId,
      permissionKey,
      name: masterPermission.name,
      description: masterPermission.description,
      category: masterPermission.category,
      module: module || masterPermission.module,
      action: action || masterPermission.action,
      type: 'deny',
      enabled: true,
      grantedBy,
      grantedAt: new Date(),
      reason,
    });

    return this.userPermissionRepository.save(userPermission);
  }

  /**
   * Remove user-specific permission override
   */
  async removeUserPermission(userId: string, permissionKey: string): Promise<void> {
    await this.userPermissionRepository.softDelete({
      userId,
      permissionKey,
    });
  }

  /**
   * Get master permission by key
   */
  private async getMasterPermissionByKey(permissionKey: string) {
    // This would need to be implemented based on your MasterPermission repository
    // For now, return a basic structure
    const [module, action] = permissionKey.split('.');
    return {
      key: permissionKey,
      name: `${action} ${module}`,
      description: `Permission to ${action} ${module}`,
      category: module,
      module,
      action,
    };
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, organizationId: string, permissionKey: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, organizationId);
    return userPermissions.permissions.includes(permissionKey);
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(userId: string, organizationId: string, permissionKeys: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, organizationId);
    return permissionKeys.some(key => userPermissions.permissions.includes(key));
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(userId: string, organizationId: string, permissionKeys: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, organizationId);
    return permissionKeys.every(key => userPermissions.permissions.includes(key));
  }

  /**
   * Get organization's available features from assigned packages
   */
  async getOrganizationFeatures(organizationId: string): Promise<string[]> {
    const packages = await this.organizationPackageRepository.find({
      where: { organizationId, isActive: true },
      relations: ['featurePackage'],
    });

    const features = new Set<string>();
    for (const pkg of packages) {
      if (pkg.featurePackage?.isActive && !pkg.isExpired()) {
        pkg.featurePackage.features.forEach(feature => features.add(feature));
      }
    }

    return Array.from(features);
  }
}
