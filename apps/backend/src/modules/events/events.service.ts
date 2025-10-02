import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';

import { Event } from '../../database/entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>
  ) {}

  async create(createEventDto: CreateEventDto, organizationId: string): Promise<Event> {
    // Events are now templates without specific dates, so no date validation needed
    // Location conflicts are checked at booking time, not event type creation time

    const event = this.eventRepository.create({
      ...createEventDto,
      organizationId,
    });
    return this.eventRepository.save(event);
  }

  async findAll(
    paginationDto: PaginationDto,
    organizationId: string
  ): Promise<PaginatedResponseDto<Event>> {
    const { page, limit, search, sortBy, sortOrder } = paginationDto;

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.bookings', 'bookings');

    // Organization filter (most important - always applied)
    queryBuilder.where('event.organizationId = :organizationId', { organizationId });

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(event.name ILIKE :search OR event.description ILIKE :search OR event.location ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Filter active events by default
    queryBuilder.andWhere('event.isActive = :isActive', { isActive: true });

    // Sorting - default to name since startDate no longer exists on events
    if (sortBy && sortBy !== 'startDate' && sortBy !== 'endDate') {
      queryBuilder.orderBy(`event.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('event.name', 'ASC');
    }

    // Pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [events, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(events, total, page, limit);
  }

  async findUpcoming(
    paginationDto: PaginationDto,
    organizationId: string
  ): Promise<PaginatedResponseDto<Event>> {
    const { page, limit, search, sortBy, sortOrder } = paginationDto;

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.bookings', 'bookings');

    // Organization filter (most important - always applied)
    queryBuilder.where('event.organizationId = :organizationId', { organizationId });

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(event.name ILIKE :search OR event.description ILIKE :search OR event.location ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Filter upcoming active events (no longer applicable since events are templates)
    queryBuilder.andWhere('event.isActive = :isActive', { isActive: true });

    // Sorting - default to name since startDate no longer exists on events
    if (sortBy && sortBy !== 'startDate' && sortBy !== 'endDate') {
      queryBuilder.orderBy(`event.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('event.name', 'ASC');
    }

    // Pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [events, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(events, total, page, limit);
  }

  async findById(id: string, organizationId: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id, organizationId },
      relations: ['bookings', 'bookings.inventoryAllocations'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, organizationId: string): Promise<Event> {
    const event = await this.findById(id, organizationId);

    // Events are now templates without specific dates
    // No date validation or location conflict checking needed at event type level
    // These checks happen at booking time

    // Update fields
    Object.assign(event, updateEventDto);

    return this.eventRepository.save(event);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const event = await this.findById(id, organizationId);

    // Check if event has active bookings
    const activeBookings = event.bookings?.filter(
      booking => booking.status === 'confirmed' || booking.status === 'pending'
    );

    if (activeBookings && activeBookings.length > 0) {
      throw new BadRequestException('Cannot delete event with active bookings');
    }

    // Soft delete by deactivating
    event.isActive = false;
    await this.eventRepository.save(event);
  }

  async getEventStats(
    id: string,
    organizationId: string
  ): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    totalRevenue: number;
    availableSpots: number;
    occupancyRate: number;
  }> {
    const event = await this.findById(id, organizationId);

    const totalBookings = event.bookings?.length || 0;
    const confirmedBookings = event.bookings?.filter(b => b.status === 'confirmed').length || 0;
    const pendingBookings = event.bookings?.filter(b => b.status === 'pending').length || 0;

    const totalRevenue =
      event.bookings?.reduce((sum, booking) => sum + Number(booking.totalAmount), 0) || 0;

    // Calculate available spots based on max attendees and confirmed bookings
    const availableSpots = event.maxAttendees ? event.maxAttendees - confirmedBookings : 0;
    const occupancyRate = event.maxAttendees ? (confirmedBookings / event.maxAttendees) * 100 : 0;

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalRevenue,
      availableSpots,
      occupancyRate,
    };
  }

  async getEventsInDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    // Events are now templates without dates
    // This method should query bookings instead, but keeping for backward compatibility
    return this.eventRepository.find({
      where: {
        isActive: true,
      },
      relations: ['bookings'],
      order: {
        name: 'ASC',
      },
    });
  }

  private async checkLocationConflict(
    location: string,
    startDate: Date,
    endDate: Date,
    organizationId: string,
    excludeEventId?: string
  ): Promise<Event | null> {
    // Events are now templates without dates
    // Location conflicts should be checked at booking level, not event type level
    // Returning null means no conflict
    return null;
  }

  async getLocations(organizationId: string): Promise<{ success: boolean; data: string[] }> {
    const locations = await this.eventRepository
      .createQueryBuilder('event')
      .select('DISTINCT event.location', 'location')
      .where('event.location IS NOT NULL')
      .andWhere('event.location != :empty', { empty: '' })
      .andWhere('event.organizationId = :organizationId', { organizationId })
      .getRawMany();

    return {
      success: true,
      data: locations.map(item => item.location).filter(Boolean),
    };
  }

  async getEventTypes(): Promise<{ success: boolean; data: string[] }> {
    // Since there's no type column, return common event types
    const commonEventTypes = [
      'Wedding',
      'Corporate Event',
      'Birthday Party',
      'Conference',
      'Workshop',
      'Seminar',
      'Gala',
      'Fundraiser',
      'Product Launch',
      'Team Building',
      'Holiday Party',
      'Graduation',
      'Anniversary',
      'Networking Event',
      'Trade Show',
    ];

    return {
      success: true,
      data: commonEventTypes,
    };
  }

  // Deprecated methods - use EventTemplatesService instead
  async getEventTemplates(): Promise<{ success: boolean; data: any[]; message?: string }> {
    // This method is deprecated and will be removed
    // Use EventTemplatesService.findAll() instead
    return {
      success: true,
      data: [],
      message: 'This endpoint is deprecated. Use /events/templates instead.',
    };
  }

  async getTemplatesStats(): Promise<{ success: boolean; data: any; message?: string }> {
    // This method is deprecated and will be removed
    // Use EventTemplatesService.getTemplateStats() instead
    return {
      success: true,
      data: {
        totalTemplates: 0,
        mostUsedTemplate: 'None',
        usageStats: [],
        recentlyCreated: 0,
        averageCapacity: 0,
      },
      message: 'This endpoint is deprecated. Use /events/templates/stats instead.',
    };
  }
}
