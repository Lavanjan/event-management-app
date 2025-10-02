import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { RolesService } from './roles.service';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireUserType } from '../auth/decorators/user-type.decorator';
import { UserType } from '../../database/entities';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(SecureAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role found' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  create(@Body() createRoleDto: any) {
    return this.rolesService.create(createRoleDto);
  }

  @Put(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateRoleDto: any) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id);
  }
}
