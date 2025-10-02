import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventTemplate, Event } from '../../database/entities';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import {
  CreateEventTemplateDto,
  UpdateEventTemplateDto,
  CreateEventFromTemplateDto,
} from './dto/event-template.dto';

@Injectable()
export class EventTemplatesService {
  constructor(
    @InjectRepository(EventTemplate)
    private eventTemplateRepository: Repository<EventTemplate>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>
  ) {}

  async create(
    createEventTemplateDto: CreateEventTemplateDto,
    organizationId: string,
    createdBy: string
  ): Promise<EventTemplate> {
    // Check if template name already exists for this organization
    const existingTemplate = await this.eventTemplateRepository.findOne({
      where: { 
        name: createEventTemplateDto.name, 
        organizationId,
        isActive: true 
      },
    });

    if (existingTemplate) {
      throw new BadRequestException('Template with this name already exists');
    }

    const template = this.eventTemplateRepository.create({
      ...createEventTemplateDto,
      organizationId,
      createdBy,
      usageCount: 0,
    });

    return this.eventTemplateRepository.save(template);
  }

  async findAll(
    paginationDto: PaginationDto,
    organizationId: string,
    includePublic = false
  ): Promise<PaginatedResponseDto<EventTemplate>> {
    const { page, limit, search, sortBy, sortOrder } = paginationDto;

    const queryBuilder = this.eventTemplateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.events', 'events');

    // Organization filter - include public templates if requested
    if (includePublic) {
      queryBuilder.where(
        '(template.organizationId = :organizationId OR template.isPublic = true)',
        { organizationId }
      );
    } else {
      queryBuilder.where('template.organizationId = :organizationId', { organizationId });
    }

    // Only active templates
    queryBuilder.andWhere('template.isActive = true');

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(template.name ILIKE :search OR template.description ILIKE :search OR template.category ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Sorting
    const validSortFields = [
      'name',
      'category',
      'usageCount',
      'createdAt',
      'lastUsedAt',
      'defaultDurationHours',
      'defaultCapacity',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(`template.${sortField}`, order);

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [templates, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(templates, total, page, limit);
  }

  async findById(id: string, organizationId: string): Promise<EventTemplate> {
    const template = await this.eventTemplateRepository.findOne({
      where: [
        { id, organizationId },
        { id, isPublic: true }, // Allow access to public templates
      ],
      relations: ['events'],
    });

    if (!template) {
      throw new NotFoundException('Event template not found');
    }

    return template;
  }

  async update(
    id: string,
    updateEventTemplateDto: UpdateEventTemplateDto,
    organizationId: string
  ): Promise<EventTemplate> {
    const template = await this.eventTemplateRepository.findOne({
      where: { id, organizationId }, // Only allow updating own templates
    });

    if (!template) {
      throw new NotFoundException('Event template not found');
    }

    // Check if name is being changed and if it conflicts
    if (updateEventTemplateDto.name && updateEventTemplateDto.name !== template.name) {
      const existingTemplate = await this.eventTemplateRepository.findOne({
        where: { 
          name: updateEventTemplateDto.name, 
          organizationId,
          isActive: true 
        },
      });

      if (existingTemplate && existingTemplate.id !== id) {
        throw new BadRequestException('Template with this name already exists');
      }
    }

    Object.assign(template, updateEventTemplateDto);
    return this.eventTemplateRepository.save(template);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const template = await this.eventTemplateRepository.findOne({
      where: { id, organizationId },
      relations: ['events'],
    });

    if (!template) {
      throw new NotFoundException('Event template not found');
    }

    // Check if template is being used by any events
    if (template.events && template.events.length > 0) {
      throw new BadRequestException(
        'Cannot delete template that is being used by existing events'
      );
    }

    // Soft delete by setting isActive to false
    template.isActive = false;
    await this.eventTemplateRepository.save(template);
  }

  async createEventFromTemplate(
    templateId: string,
    createEventDto: CreateEventFromTemplateDto,
    organizationId: string
  ): Promise<Event> {
    const template = await this.findById(templateId, organizationId);

    // Create event with template defaults, overridden by provided values
    const eventData = {
      name: createEventDto.name,
      description: createEventDto.description || template.description,
      location: createEventDto.location || template.defaultLocation,
      maxAttendees: createEventDto.maxAttendees || template.defaultCapacity,
      hourlyPrice: createEventDto.hourlyPrice ?? template.defaultHourlyPrice,
      halfDayPrice: createEventDto.halfDayPrice ?? template.defaultHalfDayPrice,
      fullDayPrice: createEventDto.fullDayPrice ?? template.defaultFullDayPrice,
      requiredAdvancePercentage: template.requiredAdvancePercentage,
      balancePaymentWindowDays: template.balancePaymentWindowDays,
      allowInventoryAllocation: template.allowInventoryAllocation,
      organizationId,
      templateId: template.id,
    };

    const event = this.eventRepository.create(eventData);
    const savedEvent = await this.eventRepository.save(event);

    // Update template usage statistics
    template.usageCount += 1;
    template.lastUsedAt = new Date();
    await this.eventTemplateRepository.save(template);

    return savedEvent;
  }

  async getTemplateStats(organizationId: string): Promise<any> {
    const queryBuilder = this.eventTemplateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.events', 'events')
      .where('template.organizationId = :organizationId', { organizationId })
      .andWhere('template.isActive = true');

    const templates = await queryBuilder.getMany();

    const totalTemplates = templates.length;
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
    const mostUsedTemplate = templates.reduce((prev, current) => 
      (prev.usageCount > current.usageCount) ? prev : current, templates[0]
    );

    const categoryStats = templates.reduce((acc, template) => {
      const category = template.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const usageStats = templates
      .map(t => ({
        templateId: t.id,
        name: t.name,
        usageCount: t.usageCount,
        category: t.category,
        lastUsed: t.lastUsedAt,
      }))
      .sort((a, b) => b.usageCount - a.usageCount);

    const recentlyCreated = templates.filter(
      t => new Date(t.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    const averageCapacity = templates.length > 0 
      ? templates.reduce((sum, t) => sum + (t.defaultCapacity || 0), 0) / templates.length 
      : 0;

    return {
      totalTemplates,
      totalUsage,
      mostUsedTemplate: mostUsedTemplate?.name || 'None',
      categoryStats,
      usageStats,
      recentlyCreated,
      averageCapacity: Math.round(averageCapacity),
    };
  }

  async getCategories(organizationId: string): Promise<string[]> {
    const result = await this.eventTemplateRepository
      .createQueryBuilder('template')
      .select('DISTINCT template.category', 'category')
      .where('template.organizationId = :organizationId', { organizationId })
      .andWhere('template.isActive = true')
      .andWhere('template.category IS NOT NULL')
      .getRawMany();

    return result.map(r => r.category).filter(Boolean);
  }

  async duplicateTemplate(
    id: string,
    organizationId: string,
    newName?: string
  ): Promise<EventTemplate> {
    const originalTemplate = await this.findById(id, organizationId);

    const duplicateData = {
      ...originalTemplate,
      id: undefined, // Let TypeORM generate new ID
      name: newName || `${originalTemplate.name} (Copy)`,
      usageCount: 0,
      lastUsedAt: null,
      createdAt: undefined,
      updatedAt: undefined,
      events: undefined,
      organizationId, // Ensure it belongs to the requesting organization
    };

    const duplicate = this.eventTemplateRepository.create(duplicateData);
    return this.eventTemplateRepository.save(duplicate);
  }
}
