import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  EnhancedRoleService,
  CreateRoleDto,
  UpdateRoleDto
} from './enhanced-role.service';
import { RoleFiltersDto } from './dto/role-filters.dto';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { SimplePermissionsGuard } from '../../common/guards/simple-permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { User } from '../../database/entities/user.entity';
import { RoleScope } from '../../database/entities/role.entity';

@ApiTags('Enhanced Roles')
@Controller('enhanced-roles')
@UseGuards(SecureAuthGuard, SimplePermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class EnhancedRoleController {
  constructor(private readonly enhancedRoleService: EnhancedRoleService) {}

  @Post()
  @RequirePermission('users.create') // Organization admins can create roles
  @ApiOperation({ summary: 'Create a new role with permissions' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or permission' })
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: User,
  ) {
    const role = await this.enhancedRoleService.create(createRoleDto, organizationId, user.id);
    return {
      success: true,
      data: role,
      message: 'Role created successfully',
    };
  }

  @Get('test')
  @RequirePermission('users.read')
  @ApiOperation({ summary: 'Test endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async test() {
    return {
      success: true,
      message: 'Test endpoint working',
    };
  }

  @Get()
  @RequirePermission('users.read')
  @ApiOperation({ summary: 'Get all roles for organization' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  @ApiQuery({ name: 'search', type: 'string', required: false })
  @ApiQuery({ name: 'scope', enum: RoleScope, required: false })
  @ApiQuery({ name: 'isActive', type: 'boolean', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  async findAll(
    @Query() filters: RoleFiltersDto,
    @CurrentOrganization() organizationId: string,
  ) {
    const result = await this.enhancedRoleService.findAll(organizationId, filters);
    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('available-permissions')
  @RequirePermission('users.read')
  @ApiOperation({ summary: 'Get available permissions for organization' })
  @ApiResponse({ status: 200, description: 'Available permissions retrieved successfully' })
  async getAvailablePermissions(@CurrentOrganization() organizationId: string) {
    const permissions = await this.enhancedRoleService.getAvailablePermissions(organizationId);
    
    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return {
      success: true,
      data: {
        permissions,
        groupedPermissions,
        totalCount: permissions.length,
        categories: Object.keys(groupedPermissions),
      },
    };
  }

  @Get('user/:userId')
  @RequirePermission('users.read')
  @ApiOperation({ summary: 'Get roles assigned to a specific user' })
  @ApiResponse({ status: 200, description: 'User roles retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserRoles(
    @Param('userId') userId: string,
    @CurrentOrganization() organizationId: string,
  ) {
    const roles = await this.enhancedRoleService.getRolesByUser(userId, organizationId);
    const permissions = await this.enhancedRoleService.getUserRolePermissions(userId, organizationId);
    
    return {
      success: true,
      data: {
        roles,
        permissions,
        totalRoles: roles.length,
        totalPermissions: permissions.length,
      },
    };
  }

  @Get(':id')
  @RequirePermission('users.read')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
  ) {
    const role = await this.enhancedRoleService.findOne(id, organizationId);
    return {
      success: true,
      data: role,
    };
  }

  @Patch(':id')
  @RequirePermission('users.update')
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data or permission' })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: User,
  ) {
    const role = await this.enhancedRoleService.update(id, updateRoleDto, organizationId, user.id);
    return {
      success: true,
      data: role,
      message: 'Role updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('users.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete role assigned to users' })
  async remove(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
  ) {
    await this.enhancedRoleService.delete(id, organizationId);
  }

  @Get(':id/permissions')
  @RequirePermission('users.read')
  @ApiOperation({ summary: 'Get permissions for a specific role' })
  @ApiResponse({ status: 200, description: 'Role permissions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRolePermissions(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
  ) {
    const role = await this.enhancedRoleService.findOne(id, organizationId);
    
    // Group permissions by category
    const groupedPermissions = role.rolePermissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, typeof role.rolePermissions>);

    return {
      success: true,
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
        },
        permissions: role.rolePermissions,
        permissionKeys: role.permissionKeys,
        groupedPermissions,
        totalPermissions: role.rolePermissions.length,
        categories: Object.keys(groupedPermissions),
      },
    };
  }

  @Patch(':id/permissions')
  @RequirePermission('users.update')
  @ApiOperation({ summary: 'Update role permissions' })
  @ApiResponse({ status: 200, description: 'Role permissions updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() updatePermissionsDto: { permissions: string[] },
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: User,
  ) {
    const role = await this.enhancedRoleService.updateRolePermissions(
      id,
      updatePermissionsDto.permissions,
      organizationId,
      user.id
    );

    return {
      success: true,
      data: role,
      message: 'Role permissions updated successfully',
    };
  }

  @Patch(':id/permissions/:permissionKey')
  @RequirePermission('users.update')
  @ApiOperation({ summary: 'Toggle a specific role permission' })
  @ApiResponse({ status: 200, description: 'Permission toggled successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async toggleRolePermission(
    @Param('id') id: string,
    @Param('permissionKey') permissionKey: string,
    @Body() toggleDto: { enabled: boolean },
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: User,
  ) {
    const role = await this.enhancedRoleService.toggleRolePermission(
      id,
      permissionKey,
      toggleDto.enabled,
      organizationId,
      user.id
    );

    return {
      success: true,
      data: role,
      message: `Permission ${toggleDto.enabled ? 'enabled' : 'disabled'} successfully`,
    };
  }
}
