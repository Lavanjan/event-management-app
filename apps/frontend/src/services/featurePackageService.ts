import { api } from './api';

export interface FeaturePackage {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'one-time';
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationPackage {
  id: string;
  organizationId: string;
  featurePackageId: string;
  featurePackage: FeaturePackage;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeaturePackageDto {
  name: string;
  description?: string;
  features: string[];
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'one-time';
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateFeaturePackageDto {
  name?: string;
  description?: string;
  features?: string[];
  price?: number;
  billingCycle?: 'monthly' | 'yearly' | 'one-time';
  isActive?: boolean;
  sortOrder?: number;
}

export interface AssignPackageDto {
  organizationId: string;
  featurePackageId: string;
  assignedBy: string;
  expiresAt?: string;
  notes?: string;
}

class FeaturePackageService {
  // Feature Package Management (Product Admin only)
  async createFeaturePackage(data: CreateFeaturePackageDto): Promise<FeaturePackage> {
    const response = await api.post('/feature-packages', data);
    return response.data;
  }

  async getAllFeaturePackages(): Promise<FeaturePackage[]> {
    const response = await api.get('/feature-packages');
    return response.data.data || response.data; // Handle both response formats
  }

  async getActiveFeaturePackages(): Promise<FeaturePackage[]> {
    const response = await api.get('/feature-packages/active');
    return response.data.data || response.data; // Handle both response formats
  }

  async getFeaturePackageById(id: string): Promise<FeaturePackage> {
    const response = await api.get(`/feature-packages/${id}`);
    return response.data;
  }

  async updateFeaturePackage(id: string, data: UpdateFeaturePackageDto): Promise<FeaturePackage> {
    const response = await api.patch(`/feature-packages/${id}`, data);
    return response.data;
  }

  async deleteFeaturePackage(id: string): Promise<void> {
    await api.delete(`/feature-packages/${id}`);
  }

  // Organization Package Management (Product Admin only)
  async assignPackageToOrganization(data: AssignPackageDto): Promise<OrganizationPackage> {
    const response = await api.post('/feature-packages/assign', data);
    return response.data;
  }

  async removePackageFromOrganization(organizationId: string, packageId: string): Promise<void> {
    await api.delete(`/feature-packages/assign/${organizationId}/${packageId}`);
  }

  async getOrganizationPackages(organizationId: string): Promise<OrganizationPackage[]> {
    const response = await api.get(`/feature-packages/organization/${organizationId}`);
    return response.data.data || response.data; // Handle both response structures
  }

  async getOrganizationFeatures(organizationId: string): Promise<string[]> {
    const response = await api.get(`/feature-packages/organization/${organizationId}/features`);
    return response.data.data || response.data; // Handle both response structures
  }

  // Helper methods
  async getCurrentOrganizationFeatures(): Promise<string[]> {
    const response = await api.get('/auth/me');
    const userData = response.data.user || response.data.data || response.data; // Handle response structure
    const organizationId = userData.organizationId;
    if (!organizationId) {
      throw new Error('User does not have an organization ID');
    }
    return this.getOrganizationFeatures(organizationId);
  }

  async getCurrentOrganizationPackages(): Promise<OrganizationPackage[]> {
    const response = await api.get('/auth/me');
    const userData = response.data.user || response.data.data || response.data; // Handle response structure
    const organizationId = userData.organizationId;
    if (!organizationId) {
      throw new Error('User does not have an organization ID');
    }
    return this.getOrganizationPackages(organizationId);
  }
}

export const featurePackageService = new FeaturePackageService();
