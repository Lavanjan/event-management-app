import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPermission, MasterPermission, User } from '../../database/entities';
import { CreateUserPermissionDto, UpdateUserPermissionDto } from './dto';

@Injectable()
export class UserPermissionsService {
  private readonly logger = new Logger(UserPermissionsService.name);

  constructor(
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(MasterPermission)
    private readonly masterPermissionRepository: Repository<MasterPermission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Grant permission to user
   */
  async grantPermissionToUser(createDto: CreateUserPermissionDto): Promise<UserPermission> {
    // Validate that the permission exists in master permissions
    const masterPermission = await this.masterPermissionRepository.findOne({
      where: { key: createDto.permissionKey }
    });

    if (!masterPermission) {
      throw new BadRequestException(`Permission "${createDto.permissionKey}" does not exist`);
    }

    // Validate that the user exists
    const user = await this.userRepository.findOne({
      where: { id: createDto.userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${createDto.userId}" not found`);
    }

    // Check if permission already exists for this user
    const existingPermission = await this.userPermissionRepository.findOne({
      where: {
        userId: createDto.userId,
        permissionKey: createDto.permissionKey
      }
    });

    if (existingPermission) {
      // Update existing permission
      existingPermission.enabled = createDto.enabled ?? true;
      existingPermission.type = createDto.type || 'grant';
      existingPermission.grantedBy = createDto.grantedBy;
      existingPermission.grantedAt = new Date();
      existingPermission.reason = createDto.reason;
      existingPermission.notes = createDto.notes;

      const updated = await this.userPermissionRepository.save(existingPermission);
      this.logger.log(`Updated user permission: ${createDto.permissionKey} for user ${createDto.userId}`);
      return updated;
    }

    // Create new user permission
    const userPermission = this.userPermissionRepository.create({
      userId: createDto.userId,
      organizationId: createDto.organizationId,
      permissionKey: createDto.permissionKey,
      name: masterPermission.name,
      description: masterPermission.description,
      category: masterPermission.category,
      module: masterPermission.module,
      action: masterPermission.action,
      enabled: createDto.enabled ?? true,
      type: createDto.type || 'grant',
      grantedBy: createDto.grantedBy,
      grantedAt: new Date(),
      reason: createDto.reason,
      notes: createDto.notes,
    });

    const saved = await this.userPermissionRepository.save(userPermission);
    this.logger.log(`Granted permission: ${createDto.permissionKey} to user ${createDto.userId}`);
    return saved;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string, organizationId: string): Promise<UserPermission[]> {
    return this.userPermissionRepository.find({
      where: { userId, organizationId },
      order: { module: 'ASC', action: 'ASC' }
    });
  }

  /**
   * Get user permission by ID
   */
  async getUserPermissionById(id: string): Promise<UserPermission> {
    const permission = await this.userPermissionRepository.findOne({
      where: { id }
    });

    if (!permission) {
      throw new NotFoundException(`User permission not found: ${id}`);
    }

    return permission;
  }

  /**
   * Update user permission
   */
  async updateUserPermission(id: string, updateDto: UpdateUserPermissionDto): Promise<UserPermission> {
    const permission = await this.getUserPermissionById(id);

    Object.assign(permission, updateDto);
    if (updateDto.enabled !== undefined || updateDto.type !== undefined) {
      permission.grantedAt = new Date();
    }

    const updated = await this.userPermissionRepository.save(permission);
    this.logger.log(`Updated user permission: ${permission.permissionKey} for user ${permission.userId}`);
    return updated;
  }

  /**
   * Remove user permission
   */
  async removeUserPermission(id: string): Promise<void> {
    const permission = await this.getUserPermissionById(id);
    await this.userPermissionRepository.remove(permission);
    this.logger.log(`Removed user permission: ${permission.permissionKey} for user ${permission.userId}`);
  }

  /**
   * Get all user permissions for organization (for admin view)
   */
  async getOrganizationUserPermissions(organizationId: string): Promise<UserPermission[]> {
    return this.userPermissionRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Bulk grant permissions to user
   */
  async bulkGrantPermissions(
    userId: string,
    organizationId: string,
    permissionKeys: string[],
    grantedBy: string,
    reason?: string
  ): Promise<UserPermission[]> {
    const results: UserPermission[] = [];

    for (const permissionKey of permissionKeys) {
      try {
        const permission = await this.grantPermissionToUser({
          userId,
          organizationId,
          permissionKey,
          enabled: true,
          type: 'grant',
          grantedBy,
          reason,
        });
        results.push(permission);
      } catch (error) {
        this.logger.warn(`Failed to grant permission ${permissionKey} to user ${userId}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Bulk revoke permissions from user
   */
  async bulkRevokePermissions(
    userId: string,
    organizationId: string,
    permissionKeys: string[],
    revokedBy: string,
    reason?: string
  ): Promise<void> {
    for (const permissionKey of permissionKeys) {
      try {
        const existingPermission = await this.userPermissionRepository.findOne({
          where: { userId, permissionKey }
        });

        if (existingPermission) {
          existingPermission.enabled = false;
          existingPermission.type = 'deny';
          existingPermission.grantedBy = revokedBy;
          existingPermission.grantedAt = new Date();
          existingPermission.reason = reason || 'Permission revoked';
          await this.userPermissionRepository.save(existingPermission);
        }
      } catch (error) {
        this.logger.warn(`Failed to revoke permission ${permissionKey} from user ${userId}: ${error.message}`);
      }
    }
  }
}
