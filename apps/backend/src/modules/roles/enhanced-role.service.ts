import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Role, RoleScope } from '../../database/entities/role.entity';
import { RolePermission } from '../../database/entities/role-permission.entity';
import { MasterPermission } from '../../database/entities/master-permission.entity';
import { OrganizationPermission } from '../../database/entities/organization-permission.entity';
import { User } from '../../database/entities/user.entity';

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: string[]; // Array of permission keys
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[]; // Array of permission keys
  isActive?: boolean;
}

export interface RoleFilters {
  search?: string;
  scope?: RoleScope;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string;
  scope: RoleScope;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  rolePermissions: RolePermission[];
  permissionKeys: string[];
}

@Injectable()
export class EnhancedRoleService {
  private readonly logger = new Logger(EnhancedRoleService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(MasterPermission)
    private masterPermissionRepository: Repository<MasterPermission>,
    @InjectRepository(OrganizationPermission)
    private organizationPermissionRepository: Repository<OrganizationPermission>,
    private dataSource: DataSource,
  ) {}

  async create(createRoleDto: CreateRoleDto, organizationId: string, userId: string): Promise<RoleWithPermissions> {
    // Check if role name already exists in organization
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name, organizationId },
    });

    if (existingRole) {
      throw new BadRequestException('Role with this name already exists in the organization');
    }

    // Validate permissions exist and are available to the organization
    const availablePermissions = await this.getAvailablePermissions(organizationId);
    const availablePermissionKeys = availablePermissions.map(p => p.permissionKey);
    
    const invalidPermissions = createRoleDto.permissions.filter(
      key => !availablePermissionKeys.includes(key)
    );

    if (invalidPermissions.length > 0) {
      throw new BadRequestException(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }

    return await this.dataSource.transaction(async manager => {
      // Create role
      const role = new Role();
      role.name = createRoleDto.name;
      role.description = createRoleDto.description;
      role.scope = RoleScope.ORGANIZATION;
      role.organizationId = organizationId;
      role.isActive = true;

      const savedRole = await manager.save(Role, role);

      // Create role permissions
      const rolePermissions = await this.createRolePermissions(
        savedRole.id,
        createRoleDto.permissions,
        organizationId,
        userId,
        manager
      );

      return {
        id: savedRole.id,
        name: savedRole.name,
        description: savedRole.description,
        scope: savedRole.scope,
        organizationId: savedRole.organizationId,
        isActive: savedRole.isActive,
        createdAt: savedRole.createdAt,
        updatedAt: savedRole.updatedAt,
        rolePermissions,
        permissionKeys: createRoleDto.permissions,
      };
    });
  }

  async findAll(organizationId: string, filters: RoleFilters = {}) {
    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .where('role.organizationId = :organizationId', { organizationId });

    // Apply filters
    if (filters.search) {
      queryBuilder.andWhere(
        '(role.name ILIKE :search OR role.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.scope) {
      queryBuilder.andWhere('role.scope = :scope', { scope: filters.scope });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('role.isActive = :isActive', { isActive: filters.isActive });
    }

    // Filter out system roles for organization admins (they can only manage dynamic roles)
    queryBuilder.andWhere('(role.isSystemRole = false OR role.isSystemRole IS NULL)');

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder.orderBy('role.name', 'ASC');
    queryBuilder.skip(offset).take(limit);

    const [roles, total] = await queryBuilder.getManyAndCount();

    // Load permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async role => {
        const rolePermissions = await this.rolePermissionRepository.find({
          where: { roleId: role.id, enabled: true, deletedAt: null },
          order: { category: 'ASC', name: 'ASC' },
        });

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          scope: role.scope,
          organizationId: role.organizationId,
          isActive: role.isActive,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
          rolePermissions,
          permissionKeys: rolePermissions.map(rp => rp.permissionKey),
        };
      })
    );

    return {
      data: rolesWithPermissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, organizationId: string): Promise<RoleWithPermissions> {
    const role = await this.roleRepository.findOne({
      where: { id, organizationId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: role.id, enabled: true, deletedAt: null },
      order: { category: 'ASC', name: 'ASC' },
    });

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      scope: role.scope,
      organizationId: role.organizationId,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      rolePermissions,
      permissionKeys: rolePermissions.map(rp => rp.permissionKey),
    };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, organizationId: string, userId: string): Promise<RoleWithPermissions> {
    const role = await this.roleRepository.findOne({
      where: { id, organizationId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Prevent editing of system roles
    if (role.isSystemRoleType()) {
      throw new BadRequestException('Cannot edit system roles (Product Admin, Organization Admin)');
    }

    // Check if new name conflicts with existing roles
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name, organizationId },
      });

      if (existingRole) {
        throw new BadRequestException('Role with this name already exists in the organization');
      }
    }

    return await this.dataSource.transaction(async manager => {
      // Update role basic info
      if (updateRoleDto.name) role.name = updateRoleDto.name;
      if (updateRoleDto.description !== undefined) role.description = updateRoleDto.description;
      if (updateRoleDto.isActive !== undefined) role.isActive = updateRoleDto.isActive;

      const savedRole = await manager.save(Role, role);

      // Update permissions if provided
      let rolePermissions: RolePermission[] = [];
      if (updateRoleDto.permissions) {
        // Validate permissions
        const availablePermissions = await this.getAvailablePermissions(organizationId);
        const availablePermissionKeys = availablePermissions.map(p => p.permissionKey);
        
        const invalidPermissions = updateRoleDto.permissions.filter(
          key => !availablePermissionKeys.includes(key)
        );

        if (invalidPermissions.length > 0) {
          throw new BadRequestException(`Invalid permissions: ${invalidPermissions.join(', ')}`);
        }

        // Remove existing permissions
        await manager.delete(RolePermission, { roleId: role.id });

        // Create new permissions
        rolePermissions = await this.createRolePermissions(
          role.id,
          updateRoleDto.permissions,
          organizationId,
          userId,
          manager
        );
      } else {
        // Load existing permissions
        rolePermissions = await manager.find(RolePermission, {
          where: { roleId: role.id, enabled: true, deletedAt: null },
          order: { category: 'ASC', name: 'ASC' },
        });
      }

      return {
        id: savedRole.id,
        name: savedRole.name,
        description: savedRole.description,
        scope: savedRole.scope,
        organizationId: savedRole.organizationId,
        isActive: savedRole.isActive,
        createdAt: savedRole.createdAt,
        updatedAt: savedRole.updatedAt,
        rolePermissions,
        permissionKeys: rolePermissions.map(rp => rp.permissionKey),
      };
    });
  }

  async getAvailablePermissions(organizationId: string): Promise<OrganizationPermission[]> {
    return await this.organizationPermissionRepository.find({
      where: { organizationId, enabled: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async getUserRolePermissions(userId: string, organizationId: string): Promise<string[]> {
    const result = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .innerJoin('user_roles', 'ur', 'ur.role_id = rp.role_id')
      .innerJoin('users', 'u', 'u.id = ur.user_id')
      .where('u.id = :userId', { userId })
      .andWhere('u.organizationId = :organizationId', { organizationId })
      .andWhere('rp.enabled = true')
      .andWhere('rp.deletedAt IS NULL')
      .select('rp.permissionKey')
      .getRawMany();

    return result.map(r => r.permissionKey);
  }

  async getRolesByUser(userId: string, organizationId: string): Promise<RoleWithPermissions[]> {
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .innerJoin('user_roles', 'ur', 'ur.role_id = role.id')
      .where('ur.user_id = :userId', { userId })
      .andWhere('role.organizationId = :organizationId', { organizationId })
      .andWhere('role.isActive = true')
      .getMany();

    return await Promise.all(
      roles.map(async role => {
        const rolePermissions = await this.rolePermissionRepository.find({
          where: { roleId: role.id, enabled: true, deletedAt: null },
          order: { category: 'ASC', name: 'ASC' },
        });

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          scope: role.scope,
          organizationId: role.organizationId,
          isActive: role.isActive,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
          rolePermissions,
          permissionKeys: rolePermissions.map(rp => rp.permissionKey),
        };
      })
    );
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id, organizationId },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Prevent deletion of system roles
    if (role.isSystemRoleType()) {
      throw new BadRequestException('Cannot delete system roles (Product Admin, Organization Admin)');
    }

    if (role.users && role.users.length > 0) {
      throw new BadRequestException('Cannot delete role that is assigned to users');
    }

    await this.dataSource.transaction(async manager => {
      // Delete role permissions
      await manager.delete(RolePermission, { roleId: role.id });
      
      // Delete role
      await manager.delete(Role, { id: role.id });
    });
  }

  private async createRolePermissions(
    roleId: string,
    permissionKeys: string[],
    organizationId: string,
    userId: string,
    manager: any
  ): Promise<RolePermission[]> {
    const masterPermissions = await manager.find(MasterPermission, {
      where: { key: In(permissionKeys) },
    });

    const rolePermissions = permissionKeys.map(key => {
      const masterPerm = masterPermissions.find(mp => mp.key === key);
      if (!masterPerm) {
        throw new BadRequestException(`Permission not found: ${key}`);
      }

      const rolePermission = new RolePermission();
      rolePermission.organizationId = organizationId;
      rolePermission.roleId = roleId;
      rolePermission.permissionKey = key;
      rolePermission.name = masterPerm.name;
      rolePermission.description = masterPerm.description;
      rolePermission.category = masterPerm.category;
      rolePermission.module = masterPerm.module;
      rolePermission.action = masterPerm.action;
      rolePermission.enabled = true;
      rolePermission.grantedBy = userId;
      rolePermission.grantedAt = new Date();

      return rolePermission;
    });

    return await manager.save(RolePermission, rolePermissions);
  }

  async updateRolePermissions(
    roleId: string,
    permissions: string[],
    organizationId: string,
    userId: string
  ): Promise<RoleWithPermissions> {
    return await this.dataSource.transaction(async manager => {
      // Verify role exists and belongs to organization
      const role = await manager.findOne(Role, {
        where: { id: roleId, organizationId },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Remove existing permissions
      await manager.delete(RolePermission, { roleId });

      // Add new permissions
      if (permissions.length > 0) {
        await this.createRolePermissions(roleId, permissions, organizationId, userId, manager);
      }

      // Return updated role with permissions
      return this.findOne(roleId, organizationId);
    });
  }

  async toggleRolePermission(
    roleId: string,
    permissionKey: string,
    enabled: boolean,
    organizationId: string,
    userId: string
  ): Promise<RoleWithPermissions> {
    return await this.dataSource.transaction(async manager => {
      // Verify role exists and belongs to organization
      const role = await manager.findOne(Role, {
        where: { id: roleId, organizationId },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Find existing permission
      const existingPermission = await manager.findOne(RolePermission, {
        where: { roleId, permissionKey },
      });

      if (enabled) {
        if (!existingPermission) {
          // Create new permission
          await this.createRolePermissions(roleId, [permissionKey], organizationId, userId, manager);
        } else {
          // Enable existing permission
          existingPermission.enabled = true;
          await manager.save(RolePermission, existingPermission);
        }
      } else {
        if (existingPermission) {
          // Remove permission
          await manager.delete(RolePermission, { id: existingPermission.id });
        }
      }

      // Return updated role with permissions
      return this.findOne(roleId, organizationId);
    });
  }
}
