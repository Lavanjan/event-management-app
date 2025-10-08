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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FeaturePackagesService } from './feature-packages.service';
import { CreateFeaturePackageDto, UpdateFeaturePackageDto, AssignPackageDto } from './dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Feature Packages')
@ApiBearerAuth()
@Controller('feature-packages')
@UseGuards(PermissionsGuard)
export class FeaturePackagesController {
  constructor(private readonly featurePackagesService: FeaturePackagesService) {}

  @Post()
  @RequirePermission('product.admin')
  @ApiOperation({ summary: 'Create a new feature package (Product Admin only)' })
  @ApiResponse({ status: 201, description: 'Feature package created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or package name already exists' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Body() createFeaturePackageDto: CreateFeaturePackageDto) {
    return this.featurePackagesService.createFeaturePackage(createFeaturePackageDto);
  }

  @Get()
  @RequirePermission('product.admin', 'product.packages')
  @ApiOperation({ summary: 'Get all feature packages' })
  @ApiResponse({ status: 200, description: 'List of all feature packages' })
  async findAll() {
    return this.featurePackagesService.getAllFeaturePackages();
  }

  @Get('active')
  @Public() // Make this public for organization creation
  @ApiOperation({ summary: 'Get active feature packages' })
  @ApiResponse({ status: 200, description: 'List of active feature packages' })
  async findActive() {
    return this.featurePackagesService.getActiveFeaturePackages();
  }

  @Get(':id')
  @RequirePermission('product.admin', 'product.packages')
  @ApiOperation({ summary: 'Get feature package by ID' })
  @ApiParam({ name: 'id', description: 'Feature package ID' })
  @ApiResponse({ status: 200, description: 'Feature package details' })
  @ApiResponse({ status: 404, description: 'Feature package not found' })
  async findOne(@Param('id') id: string) {
    return this.featurePackagesService.getFeaturePackageById(id);
  }

  @Patch(':id')
  @RequirePermission('product.admin')
  @ApiOperation({ summary: 'Update feature package (Product Admin only)' })
  @ApiParam({ name: 'id', description: 'Feature package ID' })
  @ApiResponse({ status: 200, description: 'Feature package updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Feature package not found' })
  async update(@Param('id') id: string, @Body() updateFeaturePackageDto: UpdateFeaturePackageDto) {
    return this.featurePackagesService.updateFeaturePackage(id, updateFeaturePackageDto);
  }

  @Delete(':id')
  @RequirePermission('product.admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete feature package (Product Admin only)' })
  @ApiParam({ name: 'id', description: 'Feature package ID' })
  @ApiResponse({ status: 204, description: 'Feature package deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete package assigned to organizations' })
  @ApiResponse({ status: 404, description: 'Feature package not found' })
  async remove(@Param('id') id: string) {
    await this.featurePackagesService.deleteFeaturePackage(id);
  }

  // Organization Package Management
  @Post('assign')
  @RequirePermission('product.admin')
  @ApiOperation({ summary: 'Assign package to organization (Product Admin only)' })
  @ApiResponse({ status: 201, description: 'Package assigned successfully' })
  @ApiResponse({ status: 400, description: 'Package already assigned or invalid data' })
  async assignPackage(@Body() assignPackageDto: AssignPackageDto) {
    return this.featurePackagesService.assignPackageToOrganization(assignPackageDto);
  }

  @Delete('assign/:organizationId/:packageId')
  @RequirePermission('product.admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove package from organization (Product Admin only)' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'packageId', description: 'Feature package ID' })
  @ApiResponse({ status: 204, description: 'Package removed successfully' })
  @ApiResponse({ status: 404, description: 'Package assignment not found' })
  async removePackage(
    @Param('organizationId') organizationId: string,
    @Param('packageId') packageId: string,
  ) {
    await this.featurePackagesService.removePackageFromOrganization(organizationId, packageId);
  }

  @Get('organization/:organizationId')
  @RequirePermission('product.admin', 'product.organizations')
  @ApiOperation({ summary: 'Get packages assigned to organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'List of packages assigned to organization' })
  async getOrganizationPackages(@Param('organizationId') organizationId: string) {
    return this.featurePackagesService.getOrganizationPackages(organizationId);
  }

  @Get('organization/:organizationId/features')
  @RequirePermission('product.admin', 'product.organizations')
  @ApiOperation({ summary: 'Get available features for organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'List of available features for organization' })
  async getOrganizationFeatures(@Param('organizationId') organizationId: string) {
    return this.featurePackagesService.getOrganizationAvailableFeatures(organizationId);
  }
}
