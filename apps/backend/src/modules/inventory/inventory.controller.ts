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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(SecureAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @RequirePermissions({ resource: 'inventory', action: 'create' })
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiResponse({ status: 201, description: 'Inventory item created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Item already exists' })
  create(
    @Body() createInventoryItemDto: CreateInventoryItemDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.inventoryService.create(createInventoryItemDto, organizationId);
  }

  @Get()
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get all inventory items with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Inventory items retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto, @CurrentOrganization() organizationId: string) {
    return this.inventoryService.findAll(paginationDto, organizationId);
  }

  @Get('available')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get available inventory items for booking' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Available inventory items retrieved' })
  findAllAvailable(
    @Query() paginationDto: PaginationDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.inventoryService.findAllAvailable(paginationDto, organizationId);
  }

  @Get('stats')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiResponse({ status: 200, description: 'Inventory statistics retrieved' })
  getStats() {
    return this.inventoryService.getInventoryStats();
  }

  @Get('low-stock')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get low stock items' })
  @ApiQuery({
    name: 'threshold',
    required: false,
    type: Number,
    description: 'Stock threshold (default: 10)',
  })
  @ApiResponse({ status: 200, description: 'Low stock items retrieved' })
  getLowStock(@Query('threshold') threshold?: number) {
    return this.inventoryService.getLowStockItems(threshold);
  }

  @Get('categories')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get all inventory categories' })
  @ApiResponse({ status: 200, description: 'Inventory categories retrieved' })
  getCategories() {
    return this.inventoryService.getCategories();
  }

  @Get(':id')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiResponse({ status: 200, description: 'Inventory item found' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.inventoryService.findById(id, organizationId);
  }

  @Patch(':id')
  @RequirePermissions({ resource: 'inventory', action: 'update' })
  @ApiOperation({ summary: 'Update inventory item' })
  @ApiResponse({ status: 200, description: 'Inventory item updated successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.inventoryService.update(id, updateInventoryItemDto, organizationId);
  }

  @Delete(':id')
  @RequirePermissions({ resource: 'inventory', action: 'delete' })
  @ApiOperation({ summary: 'Delete inventory item' })
  @ApiResponse({ status: 200, description: 'Inventory item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete item with active allocations' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.inventoryService.remove(id, organizationId);
  }

  @Get(':id/availability/:quantity')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Check item availability for given quantity' })
  @ApiResponse({ status: 200, description: 'Availability checked' })
  checkAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('quantity') quantity: number,
    @CurrentOrganization() organizationId: string
  ) {
    return this.inventoryService.checkAvailability(id, quantity, organizationId);
  }
}
