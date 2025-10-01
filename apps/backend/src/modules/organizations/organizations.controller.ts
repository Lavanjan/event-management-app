import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
import { FindOrganizationsDto } from './dto/find-organizations.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireUserType } from '../auth/decorators/user-type.decorator';
import { UserType } from '../../database/entities';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(SecureAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Public() // Temporarily public for testing
  // @RequireUserType(UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Create a new organization (Product Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Organization created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Organization slug or admin email already exists',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Product Admins can create organizations',
  })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @RequireUserType(UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Get all organizations (Product Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organizations retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Product Admins can view all organizations',
  })
  findAll(@Query() findOrganizationsDto: FindOrganizationsDto) {
    return this.organizationsService.findAll(findOrganizationsDto);
  }

  @Get(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Get organization by ID (Product Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Product Admins can view organization details',
  })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Get('slug/:slug')
  @RequireUserType(UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Get organization by slug (Product Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Product Admins can view organization details',
  })
  findBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  @Patch(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Update organization (Product Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Organization slug already exists',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Product Admins can update organizations',
  })
  update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Delete organization (Product Admin only)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Organization deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Product Admins can delete organizations',
  })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @Patch(':id/activate')
  @RequireUserType(UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Activate organization (Product Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization activated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Organization is already active',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Product Admins can activate organizations',
  })
  activateOrganization(@Param('id') id: string) {
    return this.organizationsService.activateOrganization(id);
  }

  @Patch(':id/suspend')
  @RequireUserType(UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Suspend organization (Product Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization suspended successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Only active organizations can be suspended',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Product Admins can suspend organizations',
  })
  suspendOrganization(@Param('id') id: string) {
    return this.organizationsService.suspendOrganization(id);
  }

  @Patch(':id/deactivate')
  @RequireUserType(UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Deactivate organization (Product Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization deactivated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Organization is already inactive',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Product Admins can deactivate organizations',
  })
  deactivateOrganization(@Param('id') id: string) {
    return this.organizationsService.deactivateOrganization(id);
  }

  @Get(':id/permissions')
  @Public() // Temporarily public for testing
  // @RequireUserType(UserType.PRODUCT_ADMIN) // Temporarily disabled for testing
  @ApiOperation({ summary: 'Get organization permissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization permissions retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Product Admins can view organization permissions',
  })
  getOrganizationPermissions(@Param('id') id: string) {
    return this.organizationsService.getOrganizationPermissions(id);
  }

  @Put(':id/permissions')
  @Public() // Temporarily public for testing
  // @RequireUserType(UserType.PRODUCT_ADMIN) // Temporarily disabled for testing
  @ApiOperation({ summary: 'Update organization permissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization permissions updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Product Admins can update organization permissions',
  })
  updateOrganizationPermissions(
    @Param('id') id: string,
    @Body() updatePermissionsDto: { permissions: any[] }
  ) {
    return this.organizationsService.updateOrganizationPermissions(
      id,
      updatePermissionsDto.permissions
    );
  }

  @Post(':id/resend-verification')
  @RequireUserType(UserType.PRODUCT_ADMIN)
  @ApiOperation({
    summary: 'Resend verification email for organization admin (Product Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Organization is already verified',
  })
  async resendVerification(@Param('id') id: string) {
    return this.organizationsService.resendVerificationEmail(id);
  }

  @Delete(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Delete organization (Product Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete active organization',
  })
  async deleteOrganization(@Param('id') id: string) {
    return this.organizationsService.deleteOrganization(id);
  }
}
