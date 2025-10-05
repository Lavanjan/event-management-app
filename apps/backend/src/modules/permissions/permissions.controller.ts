import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MasterPermissionsService } from './master-permissions.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly masterPermissionsService: MasterPermissionsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all master permissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Master permissions retrieved successfully',
  })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'module', required: false, description: 'Filter by module' })
  async getPermissions(
    @Query('category') category?: string,
    @Query('module') module?: string
  ) {
    try {
      let permissions;

      if (category) {
        permissions = await this.masterPermissionsService.findByCategory(category);
      } else if (module) {
        permissions = await this.masterPermissionsService.findByModule(module);
      } else {
        permissions = await this.masterPermissionsService.findAll();
      }

      return {
        success: true,
        data: permissions,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve permissions',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get all permission categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission categories retrieved successfully',
  })
  async getCategories() {
    try {
      const categories = await this.masterPermissionsService.getCategories();

      return {
        success: true,
        data: categories,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve categories',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('modules')
  @Public()
  @ApiOperation({ summary: 'Get all permission modules' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission modules retrieved successfully',
  })
  async getModules() {
    try {
      const modules = await this.masterPermissionsService.getModules();

      return {
        success: true,
        data: modules,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve modules',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
