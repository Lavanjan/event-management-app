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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EventTemplatesService } from './event-templates.service';
import {
  CreateEventTemplateDto,
  UpdateEventTemplateDto,
  CreateEventFromTemplateDto,
} from './dto/event-template.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireUserType } from '../auth/decorators/user-type.decorator';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserType } from '../../database/entities/user.entity';

@ApiTags('Event Templates')
@Controller('events/templates')
@UseGuards(SecureAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EventTemplatesController {
  constructor(private readonly eventTemplatesService: EventTemplatesService) {}

  @Post()
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Create a new event template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or template name exists' })
  create(
    @Body() createEventTemplateDto: CreateEventTemplateDto,
    @CurrentOrganization() organizationId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.eventTemplatesService.create(createEventTemplateDto, organizationId, userId);
  }

  @Get()
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get all event templates with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'includePublic', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('includePublic') includePublic: boolean = false,
    @CurrentOrganization() organizationId: string
  ) {
    return this.eventTemplatesService.findAll(paginationDto, organizationId, includePublic);
  }

  @Get('stats')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get event templates statistics' })
  @ApiResponse({ status: 200, description: 'Template statistics retrieved' })
  getStats(@CurrentOrganization() organizationId: string) {
    return this.eventTemplatesService.getTemplateStats(organizationId);
  }

  @Get('categories')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get all template categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  getCategories(@CurrentOrganization() organizationId: string) {
    return this.eventTemplatesService.getCategories(organizationId);
  }

  @Get(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get event template by ID' })
  @ApiResponse({ status: 200, description: 'Template found' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrganization() organizationId: string
  ) {
    return this.eventTemplatesService.findById(id, organizationId);
  }

  @Post(':id/create-event')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Create event from template' })
  @ApiResponse({ status: 201, description: 'Event created from template successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  createEventFromTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createEventDto: CreateEventFromTemplateDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.eventTemplatesService.createEventFromTemplate(id, createEventDto, organizationId);
  }

  @Post(':id/duplicate')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Duplicate an event template' })
  @ApiQuery({ name: 'newName', required: false, type: String })
  @ApiResponse({ status: 201, description: 'Template duplicated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  duplicateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('newName') newName: string,
    @CurrentOrganization() organizationId: string
  ) {
    return this.eventTemplatesService.duplicateTemplate(id, organizationId, newName);
  }

  @Patch(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Update event template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data or template name exists' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventTemplateDto: UpdateEventTemplateDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.eventTemplatesService.update(id, updateEventTemplateDto, organizationId);
  }

  @Delete(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Delete event template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete template with existing events' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrganization() organizationId: string
  ) {
    return this.eventTemplatesService.remove(id, organizationId);
  }
}
