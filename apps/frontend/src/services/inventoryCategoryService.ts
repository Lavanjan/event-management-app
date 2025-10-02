import api from './api';

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  items?: any[]; // InventoryItem[] - avoiding circular dependency
}

export interface CreateInventoryCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateInventoryCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

class InventoryCategoryService {
  async getAll(): Promise<InventoryCategory[]> {
    const response = await api.get('/inventory-categories');
    return response.data.data;
  }

  async getById(id: string): Promise<InventoryCategory> {
    const response = await api.get(`/inventory-categories/${id}`);
    return response.data.data;
  }

  async create(data: CreateInventoryCategoryDto): Promise<InventoryCategory> {
    const response = await api.post('/inventory-categories', data);
    return response.data.data;
  }

  async update(id: string, data: UpdateInventoryCategoryDto): Promise<InventoryCategory> {
    const response = await api.put(`/inventory-categories/${id}`, data);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/inventory-categories/${id}`);
  }

  async reorder(categoryIds: string[]): Promise<InventoryCategory[]> {
    const response = await api.put('/inventory-categories/reorder', { categoryIds });
    return response.data.data;
  }
}

export const inventoryCategoryService = new InventoryCategoryService();
