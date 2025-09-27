import api from './api';
import { InventoryItem, PaginatedResponse, CreateInventoryItemDto, UpdateInventoryItemDto } from '../types';

export interface InventoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  category?: string;
  lowStock?: boolean;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categories: Array<{
    name: string;
    count: number;
    value: number;
  }>;
}

class InventoryService {
  async getAll(filters: InventoryFilters = {}): Promise<PaginatedResponse<InventoryItem>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/inventory?${params.toString()}`);
    // API returns {success: true, data: {data: [...], total: 15, ...}}
    // We need to return the pagination object with items renamed to data
    const paginationData = response.data.data;
    return {
      ...paginationData,
      data: paginationData.data // items array
    };
  }

  async getById(id: string): Promise<InventoryItem> {
    const response = await api.get(`/inventory/${id}`);
    return response.data.data;
  }

  async create(data: CreateInventoryItemDto): Promise<InventoryItem> {
    const response = await api.post('/inventory', data);
    return response.data.data;
  }

  async update(id: string, data: UpdateInventoryItemDto): Promise<InventoryItem> {
    const response = await api.patch(`/inventory/${id}`, data);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/inventory/${id}`);
  }

  async getStats(): Promise<InventoryStats> {
    const response = await api.get('/inventory/stats');
    return response.data.data;
  }

  async getLowStock(): Promise<InventoryItem[]> {
    const response = await api.get('/inventory/low-stock');
    return response.data.data;
  }

  async allocate(id: string, quantity: number): Promise<InventoryItem> {
    const response = await api.patch(`/inventory/${id}/allocate`, { quantity });
    return response.data.data;
  }

  async deallocate(id: string, quantity: number): Promise<InventoryItem> {
    const response = await api.patch(`/inventory/${id}/deallocate`, { quantity });
    return response.data.data;
  }

  async adjustQuantity(id: string, quantity: number, reason?: string): Promise<InventoryItem> {
    const response = await api.patch(`/inventory/${id}/adjust`, { quantity, reason });
    return response.data.data;
  }

  async getCategories(): Promise<string[]> {
    const response = await api.get('/inventory/categories');
    return response.data.data;
  }

  async bulkUpdate(updates: Array<{ id: string; data: Partial<UpdateInventoryItemDto> }>): Promise<InventoryItem[]> {
    const response = await api.patch('/inventory/bulk-update', { updates });
    return response.data.data;
  }

  async exportData(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await api.get(`/inventory/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async importData(file: File): Promise<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/inventory/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }
}

export const inventoryService = new InventoryService();
