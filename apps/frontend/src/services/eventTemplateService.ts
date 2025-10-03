import { api } from './api';
import {
  EventTemplate,
  CreateEventTemplateDto,
  UpdateEventTemplateDto,
  CreateEventFromTemplateDto,
  EventTemplateFilters,
  EventTemplateStats,
  PaginatedEventTemplates,
} from '../types/eventTemplate';
import { Event } from '../types';

class EventTemplateService {
  private baseUrl = '/events/templates';

  async getAll(filters: EventTemplateFilters = {}): Promise<PaginatedEventTemplates> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.includePublic) params.append('includePublic', filters.includePublic.toString());

    const response = await api.get(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  async getById(id: string): Promise<EventTemplate> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(data: CreateEventTemplateDto): Promise<EventTemplate> {
    const response = await api.post(this.baseUrl, data);
    return response.data;
  }

  async update(id: string, data: UpdateEventTemplateDto): Promise<EventTemplate> {
    const response = await api.patch(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async createEventFromTemplate(
    templateId: string, 
    data: CreateEventFromTemplateDto
  ): Promise<Event> {
    const response = await api.post(`${this.baseUrl}/${templateId}/create-event`, data);
    return response.data;
  }

  async duplicate(id: string, newName?: string): Promise<EventTemplate> {
    const params = newName ? `?newName=${encodeURIComponent(newName)}` : '';
    const response = await api.post(`${this.baseUrl}/${id}/duplicate${params}`);
    return response.data;
  }

  async getStats(): Promise<EventTemplateStats> {
    const response = await api.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  async getCategories(): Promise<string[]> {
    const response = await api.get(`${this.baseUrl}/categories`);
    return response.data;
  }

  // Utility methods for filtering and searching
  async searchTemplates(query: string, filters: EventTemplateFilters = {}): Promise<PaginatedEventTemplates> {
    return this.getAll({
      ...filters,
      search: query,
    });
  }

  async getTemplatesByCategory(category: string, filters: EventTemplateFilters = {}): Promise<PaginatedEventTemplates> {
    return this.getAll({
      ...filters,
      category,
    });
  }

  async getMostUsedTemplates(limit = 10): Promise<PaginatedEventTemplates> {
    return this.getAll({
      limit,
      sortBy: 'usageCount',
      sortOrder: 'DESC',
    });
  }

  async getRecentTemplates(limit = 10): Promise<PaginatedEventTemplates> {
    return this.getAll({
      limit,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
  }

  // Template validation helpers
  validateTemplate(template: CreateEventTemplateDto | UpdateEventTemplateDto): string[] {
    const errors: string[] = [];

    if ('name' in template && (!template.name || template.name.trim().length === 0)) {
      errors.push('Template name is required');
    }

    if ('defaultDurationHours' in template && template.defaultDurationHours !== undefined) {
      if (template.defaultDurationHours <= 0 || template.defaultDurationHours > 24) {
        errors.push('Duration must be between 1 and 24 hours');
      }
    }

    if ('defaultCapacity' in template && template.defaultCapacity !== undefined) {
      if (template.defaultCapacity <= 0) {
        errors.push('Capacity must be greater than 0');
      }
    }

    if ('requiredAdvancePercentage' in template && template.requiredAdvancePercentage !== undefined) {
      if (template.requiredAdvancePercentage < 0 || template.requiredAdvancePercentage > 100) {
        errors.push('Advance percentage must be between 0 and 100');
      }
    }

    if ('balancePaymentWindowDays' in template && template.balancePaymentWindowDays !== undefined) {
      if (template.balancePaymentWindowDays < 0) {
        errors.push('Balance payment window must be 0 or greater');
      }
    }

    // Validate pricing
    const prices = [
      template.defaultHourlyPrice,
      template.defaultHalfDayPrice,
      template.defaultFullDayPrice,
    ].filter(price => price !== undefined && price !== null);

    if (prices.some(price => price! < 0)) {
      errors.push('Prices must be 0 or greater');
    }

    return errors;
  }

  // Template comparison helpers
  compareTemplates(template1: EventTemplate, template2: EventTemplate): {
    differences: string[];
    similarities: string[];
  } {
    const differences: string[] = [];
    const similarities: string[] = [];

    const fields = [
      'defaultDurationHours',
      'defaultCapacity',
      'defaultHourlyPrice',
      'defaultHalfDayPrice',
      'defaultFullDayPrice',
      'requiredAdvancePercentage',
      'balancePaymentWindowDays',
      'allowInventoryAllocation',
      'requireApproval',
      'autoConfirm',
    ] as const;

    fields.forEach(field => {
      if (template1[field] === template2[field]) {
        similarities.push(field);
      } else {
        differences.push(field);
      }
    });

    return { differences, similarities };
  }

  // Export/Import helpers
  exportTemplate(template: EventTemplate): string {
    const exportData = {
      name: template.name,
      description: template.description,
      category: template.category,
      defaultDurationHours: template.defaultDurationHours,
      defaultCapacity: template.defaultCapacity,
      defaultLocation: template.defaultLocation,
      defaultHourlyPrice: template.defaultHourlyPrice,
      defaultHalfDayPrice: template.defaultHalfDayPrice,
      defaultFullDayPrice: template.defaultFullDayPrice,
      requiredAdvancePercentage: template.requiredAdvancePercentage,
      balancePaymentWindowDays: template.balancePaymentWindowDays,
      allowInventoryAllocation: template.allowInventoryAllocation,
      requireApproval: template.requireApproval,
      autoConfirm: template.autoConfirm,
      requiredInventory: template.requiredInventory,
      defaultInventoryAllocations: template.defaultInventoryAllocations,
      templateSettings: template.templateSettings,
    };

    return JSON.stringify(exportData, null, 2);
  }

  parseImportData(jsonData: string): CreateEventTemplateDto {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate required fields
      if (!data.name) {
        throw new Error('Template name is required');
      }
      
      if (!data.defaultDurationHours) {
        throw new Error('Default duration is required');
      }

      if (data.requiredAdvancePercentage === undefined) {
        data.requiredAdvancePercentage = 50; // Default value
      }

      if (data.balancePaymentWindowDays === undefined) {
        data.balancePaymentWindowDays = 7; // Default value
      }

      return data as CreateEventTemplateDto;
    } catch (error) {
      throw new Error(`Invalid template data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Analytics helpers
  calculateTemplateMetrics(template: EventTemplate): {
    utilizationRate: number;
    averageEventDuration: number;
    revenuePerEvent: number;
  } {
    const utilizationRate = template.usageCount > 0 ? 
      (template.usageCount / (template.totalEvents || 1)) * 100 : 0;

    const averageEventDuration = template.defaultDurationHours;

    const revenuePerEvent = template.defaultFullDayPrice || 
      template.defaultHalfDayPrice || 
      (template.defaultHourlyPrice ? template.defaultHourlyPrice * template.defaultDurationHours : 0) || 0;

    return {
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      averageEventDuration,
      revenuePerEvent,
    };
  }
}

export const eventTemplateService = new EventTemplateService();
