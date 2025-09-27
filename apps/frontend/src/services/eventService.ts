import api from './api';
import { Event, PaginatedResponse, CreateEventDto, UpdateEventDto } from '../types';

export interface EventFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  activeEvents: number;
  completedEvents: number;
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
}

class EventService {
  async getAll(filters: EventFilters = {}): Promise<PaginatedResponse<Event>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/events?${params.toString()}`);
    // API returns {success: true, data: {data: [...], total: 7, ...}}
    // We need to return the pagination object with items renamed to data
    const paginationData = response.data.data;
    return {
      ...paginationData,
      data: paginationData.data // items array
    };
  }

  async getUpcoming(filters: EventFilters = {}): Promise<PaginatedResponse<Event>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/events/upcoming?${params.toString()}`);
    return response.data.data;
  }

  async getById(id: string): Promise<Event> {
    const response = await api.get(`/events/${id}`);
    return response.data.data;
  }

  async create(data: CreateEventDto): Promise<Event> {
    const response = await api.post('/events', data);
    return response.data.data;
  }

  async update(id: string, data: UpdateEventDto): Promise<Event> {
    const response = await api.patch(`/events/${id}`, data);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  }

  async getStats(id: string): Promise<EventStats> {
    const response = await api.get(`/events/${id}/stats`);
    return response.data.data;
  }

  async duplicate(id: string, newName: string): Promise<Event> {
    const response = await api.post(`/events/${id}/duplicate`, { name: newName });
    return response.data.data;
  }

  async getAvailableSlots(id: string, date: string): Promise<Array<{ start: string; end: string }>> {
    const response = await api.get(`/events/${id}/available-slots?date=${date}`);
    return response.data.data;
  }

  async checkAvailability(
    location: string,
    startDate: string,
    endDate: string,
    excludeEventId?: string
  ): Promise<{ available: boolean; conflictingEvents: Event[] }> {
    const params = new URLSearchParams({
      location,
      startDate,
      endDate,
    });

    if (excludeEventId) {
      params.append('excludeEventId', excludeEventId);
    }

    const response = await api.get(`/events/check-availability?${params.toString()}`);
    return response.data.data;
  }

  async getEventTemplates(): Promise<Event[]> {
    const response = await api.get('/events/templates');
    return response.data.data;
  }

  async createFromTemplate(templateId: string, data: Partial<CreateEventDto>): Promise<Event> {
    const response = await api.post(`/events/templates/${templateId}/create`, data);
    return response.data.data;
  }

  async getLocations(): Promise<string[]> {
    const response = await api.get('/events/locations');
    return response.data.data;
  }

  async getEventTypes(): Promise<string[]> {
    const response = await api.get('/events/types');
    return response.data.data;
  }

  async exportCalendar(format: 'ics' | 'csv' = 'ics'): Promise<Blob> {
    const response = await api.get(`/events/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const eventService = new EventService();
