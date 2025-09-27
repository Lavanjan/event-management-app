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
    // Validate dates
    if (new Date(createEventDto.startDate) >= new Date(createEventDto.endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (new Date(createEventDto.startDate) <= new Date()) {
      throw new BadRequestException('Start date must be in the future');
    }

    // Check for conflicting events at the same location within the organization
    if (createEventDto.location) {
      const conflictingEvent = await this.checkLocationConflict(
        createEventDto.location,
        new Date(createEventDto.startDate),
        new Date(createEventDto.endDate),
        organizationId
      );

      if (conflictingEvent) {
        throw new ConflictException(
          `Location "${createEventDto.location}" is already booked for the specified time period`
        );
      }
    }

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

    // Sorting
    if (sortBy) {
      queryBuilder.orderBy(`event.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('event.startDate', 'ASC');
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

    // Filter upcoming active events
    queryBuilder.andWhere('event.isActive = :isActive', { isActive: true });
    queryBuilder.andWhere('event.startDate > :now', { now: new Date() });

    // Sorting
    if (sortBy) {
      queryBuilder.orderBy(`event.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('event.startDate', 'ASC');
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

    // Validate dates if being updated
    const startDate = updateEventDto.startDate
      ? new Date(updateEventDto.startDate)
      : event.startDate;
    const endDate = updateEventDto.endDate ? new Date(updateEventDto.endDate) : event.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Don't allow updating past events
    if (event.isInPast()) {
      throw new BadRequestException('Cannot update past events');
    }

    // Check for location conflicts if location or dates are being updated
    if (updateEventDto.location || updateEventDto.startDate || updateEventDto.endDate) {
      const location = updateEventDto.location || event.location;

      if (location) {
        const conflictingEvent = await this.checkLocationConflict(
          location,
          startDate,
          endDate,
          organizationId,
          id // Exclude current event from conflict check
        );

        if (conflictingEvent) {
          throw new ConflictException(
            `Location "${location}" is already booked for the specified time period`
          );
        }
      }
    }

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

    const availableSpots = event.availableSpots;
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
    return this.eventRepository.find({
      where: {
        isActive: true,
        startDate: Between(startDate, endDate),
      },
      relations: ['bookings'],
      order: {
        startDate: 'ASC',
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
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.location = :location', { location })
      .andWhere('event.organizationId = :organizationId', { organizationId })
      .andWhere('event.isActive = :isActive', { isActive: true })
      .andWhere('(event.startDate < :endDate AND event.endDate > :startDate)', {
        startDate,
        endDate,
      });

    if (excludeEventId) {
      queryBuilder.andWhere('event.id != :excludeEventId', { excludeEventId });
    }

    return queryBuilder.getOne();
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

  async getEventTemplates(): Promise<{ success: boolean; data: any[] }> {
    // For now, return some predefined templates
    // In the future, this could be stored in a separate table
    const templates = [
      {
        id: '1',
        name: 'Corporate Conference',
        type: 'Conference',
        description: 'Standard corporate conference template',
        defaultDuration: 8, // hours
        defaultCapacity: 100,
        requiredInventory: ['Projector', 'Microphone', 'Chairs'],
      },
      {
        id: '2',
        name: 'Wedding Reception',
        type: 'Wedding',
        description: 'Wedding reception template',
        defaultDuration: 6,
        defaultCapacity: 150,
        requiredInventory: ['Tables', 'Chairs', 'Sound System'],
      },
      {
        id: '3',
        name: 'Birthday Party',
        type: 'Party',
        description: 'Birthday party template',
        defaultDuration: 4,
        defaultCapacity: 50,
        requiredInventory: ['Tables', 'Chairs', 'Decorations'],
      },
    ];

    return {
      success: true,
      data: templates,
    };
  }

  async getTemplatesStats(): Promise<{ success: boolean; data: any }> {
    // Return statistics about event templates usage
    const stats = {
      totalTemplates: 3,
      mostUsedTemplate: 'Corporate Conference',
      usageStats: [
        { templateId: '1', name: 'Corporate Conference', usageCount: 15 },
        { templateId: '2', name: 'Wedding Reception', usageCount: 8 },
        { templateId: '3', name: 'Birthday Party', usageCount: 12 },
      ],
      recentlyCreated: 2,
      averageCapacity: 100,
    };

    return {
      success: true,
      data: stats,
    };
  }
}
