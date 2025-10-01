import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Organization, OrganizationPermission } from '../../database/entities';

export interface PermissionDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

export interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  permissions: PermissionDefinition[];
}

@Injectable()
export class OrganizationPermissionsService {
  private readonly logger = new Logger(OrganizationPermissionsService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationPermission)
    private organizationPermissionRepository: Repository<OrganizationPermission>,
    private dataSource: DataSource
  ) {}

  /**
   * Get all permissions for an organization
   */
  async getOrganizationPermissions(organizationId: string): Promise<{
    organizationId: string;
    permissions: PermissionDefinition[];
  }> {
    // Verify organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Get existing permissions from database
    const existingPermissions = await this.organizationPermissionRepository.find({
      where: { organizationId },
      order: { category: 'ASC', name: 'ASC' },
    });

    // If no permissions exist, initialize default permissions
    if (existingPermissions.length === 0) {
      this.logger.log(
        `No permissions found for organization ${organizationId}, initializing defaults`
      );
      await this.initializeDefaultPermissions(organizationId);

      // Fetch the newly created permissions
      const newPermissions = await this.organizationPermissionRepository.find({
        where: { organizationId },
        order: { category: 'ASC', name: 'ASC' },
      });

      const mergedPermissions: PermissionDefinition[] = newPermissions.map(permission => ({
        id: permission.permissionKey,
        name: permission.name,
        description: permission.description,
        category: permission.category,
        enabled: permission.enabled,
      }));

      this.logger.log(
        `Initialized ${mergedPermissions.length} permissions for organization ${organizationId}`
      );

      return {
        organizationId,
        permissions: mergedPermissions,
      };
    }

    // Get default permission definitions
    const defaultPermissions = this.getDefaultPermissions();

    // Create a map of existing permissions by key
    const existingPermissionsMap = new Map(existingPermissions.map(p => [p.permissionKey, p]));

    // Merge default permissions with existing ones
    const mergedPermissions: PermissionDefinition[] = defaultPermissions.map(permission => {
      const existing = existingPermissionsMap.get(permission.id);
      return {
        id: permission.id,
        name: permission.name,
        description: permission.description,
        category: permission.category,
        enabled: existing ? existing.enabled : permission.enabled,
      };
    });

    this.logger.log(
      `Retrieved ${mergedPermissions.length} permissions for organization ${organizationId}`
    );

    return {
      organizationId,
      permissions: mergedPermissions,
    };
  }

  /**
   * Update permissions for an organization
   */
  async updateOrganizationPermissions(
    organizationId: string,
    permissions: PermissionDefinition[]
  ): Promise<{
    organizationId: string;
    permissions: PermissionDefinition[];
  }> {
    // Verify organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Validate permissions
    this.validatePermissions(permissions);

    // Use transaction to ensure data consistency
    return await this.dataSource.transaction(async manager => {
      const permissionRepo = manager.getRepository(OrganizationPermission);

      // Delete existing permissions for this organization
      await permissionRepo.delete({ organizationId });

      // Insert new permissions
      const permissionEntities = permissions.map(permission => {
        const entity = new OrganizationPermission();
        entity.organizationId = organizationId;
        entity.permissionKey = permission.id;
        entity.name = permission.name;
        entity.description = permission.description;
        entity.category = permission.category;
        entity.enabled = permission.enabled;
        return entity;
      });

      await permissionRepo.save(permissionEntities);

      this.logger.log(
        `Updated ${permissions.length} permissions for organization ${organizationId}`
      );

      return {
        organizationId,
        permissions,
      };
    });
  }

  /**
   * Check if an organization has a specific permission
   */
  async hasPermission(organizationId: string, permissionKey: string): Promise<boolean> {
    const permission = await this.organizationPermissionRepository.findOne({
      where: {
        organizationId,
        permissionKey,
        enabled: true,
      },
    });

    return !!permission;
  }

  /**
   * Get enabled permissions for an organization
   */
  async getEnabledPermissions(organizationId: string): Promise<string[]> {
    const permissions = await this.organizationPermissionRepository.find({
      where: {
        organizationId,
        enabled: true,
      },
      select: ['permissionKey'],
    });

    return permissions.map(p => p.permissionKey);
  }

  /**
   * Initialize default permissions for a new organization
   */
  async initializeDefaultPermissions(organizationId: string): Promise<void> {
    const defaultPermissions = this.getDefaultPermissions();

    const permissionEntities = defaultPermissions.map(permission => {
      const entity = new OrganizationPermission();
      entity.organizationId = organizationId;
      entity.permissionKey = permission.id;
      entity.name = permission.name;
      entity.description = permission.description;
      entity.category = permission.category;
      entity.enabled = permission.enabled;
      return entity;
    });

    await this.organizationPermissionRepository.save(permissionEntities);

    this.logger.log(
      `Initialized ${defaultPermissions.length} default permissions for organization ${organizationId}`
    );
  }

  /**
   * Get default permission definitions
   */
  private getDefaultPermissions(): PermissionDefinition[] {
    return [
      // Dashboard permissions
      {
        id: 'dashboard.view',
        name: 'View Dashboard',
        description: 'Access to dashboard overview',
        category: 'Dashboard',
        enabled: true,
      },
      {
        id: 'dashboard.analytics',
        name: 'View Analytics',
        description: 'Access to analytics and reports',
        category: 'Dashboard',
        enabled: true,
      },
      {
        id: 'dashboard.reports',
        name: 'Generate Reports',
        description: 'Generate and export reports',
        category: 'Dashboard',
        enabled: false,
      },

      // Events permissions
      {
        id: 'events.read',
        name: 'View Events',
        description: 'View events and event details',
        category: 'Events',
        enabled: true,
      },
      {
        id: 'events.create',
        name: 'Create Events',
        description: 'Create new events',
        category: 'Events',
        enabled: true,
      },
      {
        id: 'events.update',
        name: 'Edit Events',
        description: 'Edit existing events',
        category: 'Events',
        enabled: true,
      },
      {
        id: 'events.delete',
        name: 'Delete Events',
        description: 'Delete events',
        category: 'Events',
        enabled: false,
      },
      {
        id: 'events.publish',
        name: 'Publish Events',
        description: 'Publish events to make them public',
        category: 'Events',
        enabled: true,
      },

      // Bookings permissions
      {
        id: 'bookings.read',
        name: 'View Bookings',
        description: 'View bookings and booking details',
        category: 'Bookings',
        enabled: true,
      },
      {
        id: 'bookings.create',
        name: 'Create Bookings',
        description: 'Create new bookings',
        category: 'Bookings',
        enabled: true,
      },
      {
        id: 'bookings.update',
        name: 'Edit Bookings',
        description: 'Edit existing bookings',
        category: 'Bookings',
        enabled: true,
      },
      {
        id: 'bookings.cancel',
        name: 'Cancel Bookings',
        description: 'Cancel bookings',
        category: 'Bookings',
        enabled: true,
      },
      {
        id: 'bookings.refund',
        name: 'Process Refunds',
        description: 'Process booking refunds',
        category: 'Bookings',
        enabled: false,
      },

      // Inventory permissions
      {
        id: 'inventory.read',
        name: 'View Inventory',
        description: 'View inventory items and stock levels',
        category: 'Inventory',
        enabled: true,
      },
      {
        id: 'inventory.create',
        name: 'Create Inventory',
        description: 'Add new inventory items',
        category: 'Inventory',
        enabled: true,
      },
      {
        id: 'inventory.update',
        name: 'Update Inventory',
        description: 'Edit inventory items and stock levels',
        category: 'Inventory',
        enabled: true,
      },
      {
        id: 'inventory.delete',
        name: 'Delete Inventory',
        description: 'Remove inventory items',
        category: 'Inventory',
        enabled: false,
      },

      // Financial permissions
      {
        id: 'financial.read',
        name: 'View Financial Data',
        description: 'View revenue and financial reports',
        category: 'Financial',
        enabled: false,
      },
      {
        id: 'financial.transactions',
        name: 'View Transactions',
        description: 'View transaction history',
        category: 'Financial',
        enabled: false,
      },
      {
        id: 'financial.payouts',
        name: 'Manage Payouts',
        description: 'Process payouts and settlements',
        category: 'Financial',
        enabled: false,
      },

      // Users permissions
      {
        id: 'users.read',
        name: 'View Users',
        description: 'View organization users',
        category: 'Users',
        enabled: true,
      },
      {
        id: 'users.create',
        name: 'Create Users',
        description: 'Add new users to organization',
        category: 'Users',
        enabled: false,
      },
      {
        id: 'users.update',
        name: 'Edit Users',
        description: 'Edit user details and roles',
        category: 'Users',
        enabled: false,
      },
      {
        id: 'users.delete',
        name: 'Remove Users',
        description: 'Remove users from organization',
        category: 'Users',
        enabled: false,
      },

      // Settings permissions
      {
        id: 'settings.read',
        name: 'View Settings',
        description: 'View organization settings',
        category: 'Settings',
        enabled: true,
      },
      {
        id: 'settings.update',
        name: 'Update Settings',
        description: 'Update organization settings',
        category: 'Settings',
        enabled: false,
      },
      {
        id: 'settings.integrations',
        name: 'Manage Integrations',
        description: 'Configure third-party integrations',
        category: 'Settings',
        enabled: false,
      },
    ];
  }

  /**
   * Validate permission definitions
   */
  private validatePermissions(permissions: PermissionDefinition[]): void {
    const defaultPermissions = this.getDefaultPermissions();
    const validPermissionIds = new Set(defaultPermissions.map(p => p.id));

    for (const permission of permissions) {
      if (!validPermissionIds.has(permission.id)) {
        throw new BadRequestException(`Invalid permission ID: ${permission.id}`);
      }

      if (!permission.name || !permission.category) {
        throw new BadRequestException(`Permission ${permission.id} is missing required fields`);
      }
    }
  }
}
