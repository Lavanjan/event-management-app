import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Role } from '../../database/entities/role.entity';
import { Permission } from '../../database/entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async create(createRoleDto: any): Promise<Role> {
    const { permissions: permissionIds, ...roleData } = createRoleDto;

    // Find permissions by IDs if provided
    const permissions =
      permissionIds && permissionIds.length > 0
        ? await this.permissionRepository.find({
            where: { id: In(permissionIds) },
          })
        : [];

    // Create role with permissions
    const role = this.roleRepository.create({
      ...roleData,
      permissions,
    });

    const savedRoles = await this.roleRepository.save(role);
    const savedRole = Array.isArray(savedRoles) ? savedRoles[0] : savedRoles;

    // Return the role with relations loaded
    return this.findById(savedRole.id);
  }

  async update(id: string, updateRoleDto: any): Promise<Role> {
    const role = await this.findById(id);
    const { permissions: permissionIds, ...roleData } = updateRoleDto;

    // Update basic role data
    Object.assign(role, roleData);

    // Update permissions if provided
    if (permissionIds) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) },
      });
      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findById(id);
    await this.roleRepository.remove(role);
  }
}
