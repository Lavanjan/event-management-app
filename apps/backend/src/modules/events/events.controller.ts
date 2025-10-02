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

import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireUserType } from '../auth/decorators/user-type.decorator';
import { UserType } from '../../database/entities';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';

@ApiTags('Events')
@Controller('events')
@UseGuards(SecureAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Location conflict' })
  create(@Body() createEventDto: CreateEventDto, @CurrentOrganization() organizationId: string) {
    return this.eventsService.create(createEventDto, organizationId);
  }

  @Get()
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get all events with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto, @CurrentOrganization() organizationId: string) {
    return this.eventsService.findAll(paginationDto, organizationId);
  }

  @Get('upcoming')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Upcoming events retrieved' })
  findUpcoming(
    @Query() paginationDto: PaginationDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.eventsService.findUpcoming(paginationDto, organizationId);
  }

  @Get('locations')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get all event locations' })
  @ApiResponse({ status: 200, description: 'Event locations retrieved' })
  getLocations(@CurrentOrganization() organizationId: string) {
    return this.eventsService.getLocations(organizationId);
  }

  @Get('types')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get all event types' })
  @ApiResponse({ status: 200, description: 'Event types retrieved' })
  getTypes() {
    return this.eventsService.getEventTypes();
  }

  @Get('templates')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get all event templates' })
  @ApiResponse({ status: 200, description: 'Event templates retrieved' })
  getTemplates() {
    return this.eventsService.getEventTemplates();
  }

  @Get('templates/stats')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get event templates statistics' })
  @ApiResponse({ status: 200, description: 'Event templates statistics retrieved' })
  getTemplatesStats() {
    return this.eventsService.getTemplatesStats();
  }

  @Get(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Event found' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.eventsService.findById(id, organizationId);
  }

  @Get(':id/stats')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get event statistics' })
  @ApiResponse({ status: 200, description: 'Event statistics retrieved' })
  getStats(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.eventsService.getEventStats(id, organizationId);
  }

  @Patch(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 400, description: 'Cannot update past events' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.eventsService.update(id, updateEventDto, organizationId);
  }

  @Delete(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete event with active bookings' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.eventsService.remove(id, organizationId);
  }
}
