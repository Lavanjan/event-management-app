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
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';

@ApiTags('Events')
@Controller('events')
@UseGuards(SecureAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @RequirePermissions({ resource: 'events', action: 'create' })
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Location conflict' })
  create(@Body() createEventDto: CreateEventDto, @CurrentOrganization() organizationId: string) {
    return this.eventsService.create(createEventDto, organizationId);
  }

  @Get()
  @RequirePermissions({ resource: 'events', action: 'read' })
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
  @RequirePermissions({ resource: 'events', action: 'read' })
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
  @RequirePermissions({ resource: 'events', action: 'read' })
  @ApiOperation({ summary: 'Get all event locations' })
  @ApiResponse({ status: 200, description: 'Event locations retrieved' })
  getLocations(@CurrentOrganization() organizationId: string) {
    return this.eventsService.getLocations(organizationId);
  }

  @Get('types')
  @RequirePermissions({ resource: 'events', action: 'read' })
  @ApiOperation({ summary: 'Get all event types' })
  @ApiResponse({ status: 200, description: 'Event types retrieved' })
  getTypes() {
    return this.eventsService.getEventTypes();
  }

  @Get('templates')
  @RequirePermissions({ resource: 'events', action: 'read' })
  @ApiOperation({ summary: 'Get all event templates' })
  @ApiResponse({ status: 200, description: 'Event templates retrieved' })
  getTemplates() {
    return this.eventsService.getEventTemplates();
  }

  @Get('templates/stats')
  @RequirePermissions({ resource: 'events', action: 'read' })
  @ApiOperation({ summary: 'Get event templates statistics' })
  @ApiResponse({ status: 200, description: 'Event templates statistics retrieved' })
  getTemplatesStats() {
    return this.eventsService.getTemplatesStats();
  }

  @Get(':id')
  @RequirePermissions({ resource: 'events', action: 'read' })
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Event found' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.eventsService.findById(id, organizationId);
  }

  @Get(':id/stats')
  @RequirePermissions({ resource: 'events', action: 'read' })
  @ApiOperation({ summary: 'Get event statistics' })
  @ApiResponse({ status: 200, description: 'Event statistics retrieved' })
  getStats(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.eventsService.getEventStats(id, organizationId);
  }

  @Patch(':id')
  @RequirePermissions({ resource: 'events', action: 'update' })
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
  @RequirePermissions({ resource: 'events', action: 'delete' })
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete event with active bookings' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.eventsService.remove(id, organizationId);
  }
}
