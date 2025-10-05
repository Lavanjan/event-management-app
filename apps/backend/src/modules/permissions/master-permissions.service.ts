import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterPermission } from '../../database/entities';

export interface CreateMasterPermissionDto {
  key: string;
  name: string;
  description?: string;
  category: string;
  module: string;
  action: string;
  defaultEnabled?: boolean;
  sortOrder?: number;
  metadata?: Record<string, any>;
}

export interface MasterPermissionResponse {
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

@Injectable()
export class MasterPermissionsService {
  private readonly logger = new Logger(MasterPermissionsService.name);

  constructor(
    @InjectRepository(MasterPermission)
    private masterPermissionRepository: Repository<MasterPermission>
  ) {}

  /**
   * Get all master permissions
   */
  async findAll(): Promise<MasterPermissionResponse[]> {
    const permissions = await this.masterPermissionRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', sortOrder: 'ASC', name: 'ASC' },
    });

    return permissions.map(this.mapToResponse);
  }

  /**
   * Get permissions by category
   */
  async findByCategory(category: string): Promise<MasterPermissionResponse[]> {
    const permissions = await this.masterPermissionRepository.find({
      where: { category, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return permissions.map(this.mapToResponse);
  }

  /**
   * Get permissions by module
   */
  async findByModule(module: string): Promise<MasterPermissionResponse[]> {
    const permissions = await this.masterPermissionRepository.find({
      where: { module, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return permissions.map(this.mapToResponse);
  }

  /**
   * Get all permission categories
   */
  async getCategories(): Promise<string[]> {
    const result = await this.masterPermissionRepository
      .createQueryBuilder('permission')
      .select('DISTINCT permission.category', 'category')
      .where('permission.isActive = :isActive', { isActive: true })
      .orderBy('permission.category', 'ASC')
      .getRawMany();

    return result.map(row => row.category);
  }

  /**
   * Get all permission modules
   */
  async getModules(): Promise<string[]> {
    const result = await this.masterPermissionRepository
      .createQueryBuilder('permission')
      .select('DISTINCT permission.module', 'module')
      .where('permission.isActive = :isActive', { isActive: true })
      .orderBy('permission.module', 'ASC')
      .getRawMany();

    return result.map(row => row.module);
  }

  /**
   * Create or update master permissions (for seeding)
   */
  async upsertPermissions(permissions: CreateMasterPermissionDto[]): Promise<void> {
    for (const permissionData of permissions) {
      await this.masterPermissionRepository.upsert(
        {
          ...permissionData,
          isActive: true,
        },
        ['key']
      );
    }

    this.logger.log(`Upserted ${permissions.length} master permissions`);
  }

  /**
   * Get permission by key
   */
  async findByKey(key: string): Promise<MasterPermissionResponse | null> {
    const permission = await this.masterPermissionRepository.findOne({
      where: { key, isActive: true },
    });

    return permission ? this.mapToResponse(permission) : null;
  }

  /**
   * Get all permission keys
   */
  async getAllKeys(): Promise<string[]> {
    const permissions = await this.masterPermissionRepository.find({
      where: { isActive: true },
      select: ['key'],
    });

    return permissions.map(p => p.key);
  }

  /**
   * Map entity to response
   */
  private mapToResponse(permission: MasterPermission): MasterPermissionResponse {
    return {
      id: permission.id,
      key: permission.key,
      name: permission.name,
      description: permission.description || '',
      category: permission.category,
      module: permission.module,
      action: permission.action,
      isActive: permission.isActive,
      defaultEnabled: permission.defaultEnabled,
      sortOrder: permission.sortOrder,
      metadata: permission.metadata || {},
    };
  }
}
