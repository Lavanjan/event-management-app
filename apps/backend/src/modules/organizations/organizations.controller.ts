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
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireUserType } from '../auth/decorators/user-type.decorator';
import { UserType } from '../../database/entities';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(SecureAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @RequireUserType(UserType.PRODUCT_ADMIN)
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
  findAll(@Query() paginationDto: PaginationDto) {
    return this.organizationsService.findAll(paginationDto);
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
}
