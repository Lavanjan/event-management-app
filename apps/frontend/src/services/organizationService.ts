import { api } from './api';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  status: 'active' | 'suspended' | 'inactive';
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  status?: 'active' | 'suspended' | 'inactive';
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateOrganizationRequest extends Partial<CreateOrganizationRequest> {}

export interface OrganizationListResponse {
  data: Organization[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrganizationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'suspended' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class OrganizationService {
  private baseUrl = '/organizations';

  async getOrganizations(params?: OrganizationQueryParams): Promise<OrganizationListResponse> {
    const response = await api.get(this.baseUrl, { params });
    return response.data;
  }

  async getOrganization(id: string): Promise<Organization> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization> {
    const response = await api.get(`${this.baseUrl}/slug/${slug}`);
    return response.data;
  }

  async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
    const response = await api.post(this.baseUrl, data);
    return response.data;
  }

  async updateOrganization(id: string, data: UpdateOrganizationRequest): Promise<Organization> {
    const response = await api.patch(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteOrganization(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async activateOrganization(id: string): Promise<Organization> {
    const response = await api.patch(`${this.baseUrl}/${id}`, { status: 'active', isActive: true });
    return response.data;
  }

  async suspendOrganization(id: string): Promise<Organization> {
    const response = await api.patch(`${this.baseUrl}/${id}`, { status: 'suspended', isActive: false });
    return response.data;
  }

  async deactivateOrganization(id: string): Promise<Organization> {
    const response = await api.patch(`${this.baseUrl}/${id}`, { status: 'inactive', isActive: false });
    return response.data;
  }

  // Utility method to generate slug from name
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Utility method to validate slug
  async validateSlug(slug: string, excludeId?: string): Promise<boolean> {
    try {
      const org = await this.getOrganizationBySlug(slug);
      // If we found an organization with this slug and it's not the one we're excluding, it's invalid
      return excludeId ? org.id === excludeId : false;
    } catch (error) {
      // If we get a 404, the slug is available
      return true;
    }
  }
}

export const organizationService = new OrganizationService();
