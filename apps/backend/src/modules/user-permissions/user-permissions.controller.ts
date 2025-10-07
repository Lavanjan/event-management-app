import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UserPermissionsService } from './user-permissions.service';
import {
  CreateUserPermissionDto,
  UpdateUserPermissionDto,
  BulkGrantPermissionsDto,
  BulkRevokePermissionsDto,
} from './dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';

@ApiTags('User Permissions')
@ApiBearerAuth()
@Controller('user-permissions')
@UseGuards(PermissionsGuard)
export class UserPermissionsController {
  constructor(private readonly userPermissionsService: UserPermissionsService) {}

  @Post()
  @RequirePermission('users.update', 'roles.update')
  @ApiOperation({ summary: 'Grant or deny permission to user' })
  @ApiResponse({ status: 201, description: 'Permission granted/denied successfully' })
  @ApiResponse({ status: 400, description: 'Invalid permission key or user not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async grantPermission(@Body() createUserPermissionDto: CreateUserPermissionDto) {
    return this.userPermissionsService.grantPermissionToUser(createUserPermissionDto);
  }

  @Get('user/:userId')
  @RequirePermission('users.read', 'roles.read')
  @ApiOperation({ summary: 'Get all permissions for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of user permissions' })
  async getUserPermissions(
    @Param('userId') userId: string,
    @CurrentOrganization() organizationId: string,
  ) {
    return this.userPermissionsService.getUserPermissions(userId, organizationId);
  }

  @Get('organization')
  @RequirePermission('users.read', 'roles.read')
  @ApiOperation({ summary: 'Get all user permissions for organization' })
  @ApiResponse({ status: 200, description: 'List of all user permissions in organization' })
  async getOrganizationUserPermissions(@CurrentOrganization() organizationId: string) {
    return this.userPermissionsService.getOrganizationUserPermissions(organizationId);
  }

  @Get(':id')
  @RequirePermission('users.read', 'roles.read')
  @ApiOperation({ summary: 'Get user permission by ID' })
  @ApiParam({ name: 'id', description: 'User permission ID' })
  @ApiResponse({ status: 200, description: 'User permission details' })
  @ApiResponse({ status: 404, description: 'User permission not found' })
  async findOne(@Param('id') id: string) {
    return this.userPermissionsService.getUserPermissionById(id);
  }

  @Patch(':id')
  @RequirePermission('users.update', 'roles.update')
  @ApiOperation({ summary: 'Update user permission' })
  @ApiParam({ name: 'id', description: 'User permission ID' })
  @ApiResponse({ status: 200, description: 'User permission updated successfully' })
  @ApiResponse({ status: 404, description: 'User permission not found' })
  async update(@Param('id') id: string, @Body() updateUserPermissionDto: UpdateUserPermissionDto) {
    return this.userPermissionsService.updateUserPermission(id, updateUserPermissionDto);
  }

  @Delete(':id')
  @RequirePermission('users.update', 'roles.update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove user permission' })
  @ApiParam({ name: 'id', description: 'User permission ID' })
  @ApiResponse({ status: 204, description: 'User permission removed successfully' })
  @ApiResponse({ status: 404, description: 'User permission not found' })
  async remove(@Param('id') id: string) {
    await this.userPermissionsService.removeUserPermission(id);
  }

  // Bulk operations
  @Post('bulk/grant')
  @RequirePermission('users.update', 'roles.update')
  @ApiOperation({ summary: 'Bulk grant permissions to user' })
  @ApiResponse({ status: 201, description: 'Permissions granted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async bulkGrantPermissions(@Body() bulkGrantDto: BulkGrantPermissionsDto) {
    return this.userPermissionsService.bulkGrantPermissions(
      bulkGrantDto.userId,
      bulkGrantDto.organizationId,
      bulkGrantDto.permissionKeys,
      bulkGrantDto.grantedBy,
      bulkGrantDto.reason,
    );
  }

  @Post('bulk/revoke')
  @RequirePermission('users.update', 'roles.update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk revoke permissions from user' })
  @ApiResponse({ status: 204, description: 'Permissions revoked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async bulkRevokePermissions(@Body() bulkRevokeDto: BulkRevokePermissionsDto) {
    await this.userPermissionsService.bulkRevokePermissions(
      bulkRevokeDto.userId,
      bulkRevokeDto.organizationId,
      bulkRevokeDto.permissionKeys,
      bulkRevokeDto.revokedBy,
      bulkRevokeDto.reason,
    );
  }
}
