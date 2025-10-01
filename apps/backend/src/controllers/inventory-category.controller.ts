import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SecureAuthGuard } from '../modules/auth/guards/secure-auth.guard';
import { OrganizationPermissionGuard } from '../common/guards/organization-permission.guard';
import { RequireOrganizationPermission } from '../common/guards/organization-permission.guard';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import {
  InventoryCategoryService,
  CreateInventoryCategoryDto,
  UpdateInventoryCategoryDto,
} from '../services/inventory-category.service';

@ApiTags('Inventory Categories')
@Controller('inventory-categories')
@UseGuards(SecureAuthGuard, OrganizationPermissionGuard)
@ApiBearerAuth('JWT-auth')
export class InventoryCategoryController {
  constructor(private readonly categoryService: InventoryCategoryService) {}

  @Get()
  @RequireOrganizationPermission('inventory.read')
  @ApiOperation({ summary: 'Get all inventory categories' })
  @ApiResponse({ status: 200, description: 'Inventory categories retrieved successfully' })
  async findAll(@CurrentOrganization() organizationId: string) {
    return this.categoryService.findAll(organizationId);
  }

  @Post()
  @RequireOrganizationPermission('inventory.create')
  @ApiOperation({ summary: 'Create a new inventory category' })
  @ApiResponse({ status: 201, description: 'Inventory category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Category with this name already exists' })
  async create(
    @Body() createDto: CreateInventoryCategoryDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.categoryService.create(createDto, organizationId);
  }

  @Put('reorder')
  @RequireOrganizationPermission('inventory.update')
  @ApiOperation({ summary: 'Reorder inventory categories' })
  @ApiResponse({ status: 200, description: 'Inventory categories reordered successfully' })
  async reorder(
    @Body() { categoryIds }: { categoryIds: string[] },
    @CurrentOrganization() organizationId: string
  ) {
    return this.categoryService.reorder(categoryIds, organizationId);
  }

  @Get(':id')
  @RequireOrganizationPermission('inventory.read')
  @ApiOperation({ summary: 'Get inventory category by ID' })
  @ApiResponse({ status: 200, description: 'Inventory category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Inventory category not found' })
  async findById(@Param('id') id: string, @CurrentOrganization() organizationId: string) {
    return this.categoryService.findById(id, organizationId);
  }

  @Put(':id')
  @RequireOrganizationPermission('inventory.update')
  @ApiOperation({ summary: 'Update an inventory category' })
  @ApiResponse({ status: 200, description: 'Inventory category updated successfully' })
  @ApiResponse({ status: 404, description: 'Inventory category not found' })
  @ApiResponse({ status: 409, description: 'Category with this name already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInventoryCategoryDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.categoryService.update(id, updateDto, organizationId);
  }

  @Delete(':id')
  @RequireOrganizationPermission('inventory.delete')
  @ApiOperation({ summary: 'Delete an inventory category' })
  @ApiResponse({ status: 204, description: 'Inventory category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory category not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentOrganization() organizationId: string) {
    await this.categoryService.delete(id, organizationId);
  }
}
