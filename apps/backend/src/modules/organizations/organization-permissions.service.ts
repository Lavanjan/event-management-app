import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Organization, OrganizationPermission, MasterPermission } from '../../database/entities';
import { MasterPermissionsService } from '../permissions/master-permissions.service';

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
    private dataSource: DataSource,
    private masterPermissionsService: MasterPermissionsService
  ) {}

  /**
   * Sync organization permissions with master permissions
   */
  async syncWithMasterPermissions(organizationId: string): Promise<void> {
    try {
      // Get all master permissions
      const masterPermissions = await this.masterPermissionsService.findAll();

      // Get existing organization permissions
      const existingPermissions = await this.organizationPermissionRepository.find({
        where: { organizationId },
      });

      // Create a map of existing permissions by key
      const existingMap = new Map(existingPermissions.map(p => [p.permissionKey, p]));

      // Prepare permissions to upsert
      const permissionsToUpsert = masterPermissions.map(masterPerm => {
        const existing = existingMap.get(masterPerm.key);

        const orgPermission = new OrganizationPermission();
        orgPermission.organizationId = organizationId;
        orgPermission.permissionKey = masterPerm.key;
        orgPermission.name = masterPerm.name;
        orgPermission.description = masterPerm.description;
        orgPermission.category = masterPerm.category;
        // Keep existing enabled state, or use master default
        orgPermission.enabled = existing ? existing.enabled : masterPerm.defaultEnabled;

        return orgPermission;
      });

      // Use transaction to ensure consistency
      await this.dataSource.transaction(async manager => {
        const permissionRepo = manager.getRepository(OrganizationPermission);

        // Delete existing permissions
        await permissionRepo.delete({ organizationId });

        // Insert updated permissions
        await permissionRepo.save(permissionsToUpsert);
      });

      this.logger.log(`Synced ${permissionsToUpsert.length} permissions for organization ${organizationId}`);
    } catch (error) {
      this.logger.error(`Failed to sync permissions for organization ${organizationId}:`, error);
      throw error;
    }
  }

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

    // Sync with master permissions first
    await this.syncWithMasterPermissions(organizationId);

    // Get updated permissions from database
    const permissions = await this.organizationPermissionRepository.find({
      where: { organizationId },
      order: { category: 'ASC', name: 'ASC' },
    });

    const permissionDefinitions: PermissionDefinition[] = permissions.map(permission => ({
      id: permission.permissionKey,
      name: permission.name,
      description: permission.description,
      category: permission.category,
      enabled: permission.enabled,
    }));

    this.logger.log(
      `Retrieved ${permissionDefinitions.length} permissions for organization ${organizationId}`
    );

    return {
      organizationId,
      permissions: permissionDefinitions,
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
    await this.validatePermissions(permissions);

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
   * Initialize default permissions for a new organization
   */
  async initializeDefaultPermissions(organizationId: string): Promise<void> {
    const defaultPermissions = await this.getDefaultPermissions();

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
   * Get default permission definitions from master permissions
   */
  private async getDefaultPermissions(): Promise<PermissionDefinition[]> {
    try {
      const masterPermissions = await this.masterPermissionsService.findAll();

      return masterPermissions.map(permission => ({
        id: permission.key,
        name: permission.name,
        description: permission.description,
        category: permission.category,
        enabled: permission.defaultEnabled,
      }));
    } catch (error) {
      this.logger.error('Failed to get master permissions, using fallback', error);
      // Fallback to basic permissions if master permissions are not available
      return this.getFallbackPermissions();
    }
  }

  /**
   * Fallback permissions if master permissions are not available
   */
  private getFallbackPermissions(): PermissionDefinition[] {
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
        enabled: true,
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
        enabled: true,
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
        enabled: true,
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
        enabled: true,
      },

      // Documents permissions
      {
        id: 'documents.read',
        name: 'View Documents',
        description: 'View and download documents',
        category: 'Documents',
        enabled: true,
      },
      {
        id: 'documents.create',
        name: 'Upload Documents',
        description: 'Upload new documents',
        category: 'Documents',
        enabled: true,
      },
      {
        id: 'documents.update',
        name: 'Edit Documents',
        description: 'Edit document metadata',
        category: 'Documents',
        enabled: true,
      },
      {
        id: 'documents.delete',
        name: 'Delete Documents',
        description: 'Remove documents',
        category: 'Documents',
        enabled: true,
      },

      // Financial permissions
      {
        id: 'financial.read',
        name: 'View Financial Data',
        description: 'View revenue and financial reports',
        category: 'Financial',
        enabled: true,
      },
      {
        id: 'financial.transactions',
        name: 'View Transactions',
        description: 'View transaction history',
        category: 'Financial',
        enabled: true,
      },
      {
        id: 'financial.payouts',
        name: 'Manage Payouts',
        description: 'Process payouts and settlements',
        category: 'Financial',
        enabled: true,
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
        enabled: true,
      },
      {
        id: 'users.update',
        name: 'Edit Users',
        description: 'Edit user details and roles',
        category: 'Users',
        enabled: true,
      },
      {
        id: 'users.delete',
        name: 'Remove Users',
        description: 'Remove users from organization',
        category: 'Users',
        enabled: true,
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
        enabled: true,
      },
      {
        id: 'settings.integrations',
        name: 'Manage Integrations',
        description: 'Configure third-party integrations',
        category: 'Settings',
        enabled: true,
      },
    ];
  }

  /**
   * Validate permission definitions
   */
  private async validatePermissions(permissions: PermissionDefinition[]): Promise<void> {
    const defaultPermissions = await this.getDefaultPermissions();
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

  /**
   * Check if an organization has a specific permission
   */
  async hasPermission(organizationId: string, permissionKey: string): Promise<boolean> {
    try {
      const permission = await this.organizationPermissionRepository.findOne({
        where: {
          organizationId,
          permissionKey,
          enabled: true
        },
      });

      return !!permission;
    } catch (error) {
      this.logger.error(`Error checking permission ${permissionKey} for organization ${organizationId}:`, error);
      return false;
    }
  }

  /**
   * Get all enabled permissions for an organization
   */
  async getEnabledPermissions(organizationId: string): Promise<string[]> {
    try {
      const permissions = await this.organizationPermissionRepository.find({
        where: {
          organizationId,
          enabled: true
        },
        select: ['permissionKey'],
      });

      return permissions.map(p => p.permissionKey);
    } catch (error) {
      this.logger.error(`Error getting enabled permissions for organization ${organizationId}:`, error);
      return [];
    }
  }

  /**
   * Check if an organization has access to a specific module
   */
  async hasModuleAccess(organizationId: string, module: string): Promise<boolean> {
    try {
      const permission = await this.organizationPermissionRepository.findOne({
        where: {
          organizationId,
          category: module.charAt(0).toUpperCase() + module.slice(1),
          enabled: true
        },
      });

      return !!permission;
    } catch (error) {
      this.logger.error(`Error checking module access ${module} for organization ${organizationId}:`, error);
      return false;
    }
  }

  /**
   * Get enabled modules for an organization
   */
  async getEnabledModules(organizationId: string): Promise<string[]> {
    try {
      const permissions = await this.organizationPermissionRepository
        .createQueryBuilder('permission')
        .select('DISTINCT permission.category', 'category')
        .where('permission.organizationId = :organizationId', { organizationId })
        .andWhere('permission.enabled = :enabled', { enabled: true })
        .getRawMany();

      return permissions.map(p => p.category.toLowerCase());
    } catch (error) {
      this.logger.error(`Error getting enabled modules for organization ${organizationId}:`, error);
      return [];
    }
  }
}
