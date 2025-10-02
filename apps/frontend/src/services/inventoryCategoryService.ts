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
  private baseUrl = '/inventory-categories';

  async getAll(): Promise<InventoryCategory[]> {
    // For product admin, we need to specify an organization ID
    // Using 'default-org' as a fallback for testing
    const response = await api.get(`${this.baseUrl}?organizationId=default-org`);
    return response.data;
  }

  async getById(id: string): Promise<InventoryCategory> {
    const response = await api.get(`${this.baseUrl}/${id}?organizationId=default-org`);
    return response.data;
  }

  async create(data: CreateInventoryCategoryDto): Promise<InventoryCategory> {
    const response = await api.post(`${this.baseUrl}?organizationId=default-org`, data);
    return response.data;
  }

  async update(id: string, data: UpdateInventoryCategoryDto): Promise<InventoryCategory> {
    const response = await api.put(`${this.baseUrl}/${id}?organizationId=default-org`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}?organizationId=default-org`);
  }

  async reorder(categoryIds: string[]): Promise<InventoryCategory[]> {
    const response = await api.put(`${this.baseUrl}/reorder?organizationId=default-org`, {
      categoryIds,
    });
    return response.data;
  }
}

export const inventoryCategoryService = new InventoryCategoryService();
