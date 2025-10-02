import api from './api';
import { User, Role, Permission, PaginatedResponse } from '../types';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  role?: string;
  status?: 'active' | 'inactive';
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  roleIds: string[];
  sendEmail?: boolean;
  autoGenerateCredentials?: boolean;
  requiresVerification?: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleIds?: string[];
  isActive?: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  roleDistribution: Array<{
    roleName: string;
    count: number;
  }>;
  recentLogins: number;
}

class UserService {
  async getAll(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/users?${params.toString()}`);
    // API returns {success: true, data: {data: [...], total: 2, ...}}
    // We need to return the pagination object with items renamed to data
    const paginationData = response.data.data;
    return {
      ...paginationData,
      data: paginationData.data // items array
    };
  }

  async getById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  }

  async create(data: CreateUserDto): Promise<User> {
    const response = await api.post('/users', data);
    return response.data.data;
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const response = await api.patch(`/users/${id}`, data);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }

  async activate(id: string): Promise<User> {
    const response = await api.patch(`/users/${id}/activate`);
    return response.data.data;
  }

  async deactivate(id: string): Promise<User> {
    const response = await api.patch(`/users/${id}/deactivate`);
    return response.data.data;
  }

  async resetPassword(id: string): Promise<{ temporaryPassword: string }> {
    const response = await api.post(`/users/${id}/reset-password`);
    return response.data.data;
  }

  async sendWelcomeEmail(id: string): Promise<void> {
    await api.post(`/users/${id}/send-welcome-email`);
  }

  async getStats(): Promise<UserStats> {
    const response = await api.get('/users/stats');
    return response.data.data;
  }

  async exportData(filters: UserFilters = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    params.append('format', format);

    const response = await api.get(`/users/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async bulkUpdate(updates: Array<{ id: string; data: Partial<UpdateUserDto> }>): Promise<User[]> {
    const response = await api.patch('/users/bulk-update', { updates });
    return response.data.data;
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await api.delete('/users/bulk-delete', { data: { ids } });
  }

  async getActivityLog(id: string): Promise<Array<{
    id: string;
    action: string;
    details: string;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
  }>> {
    const response = await api.get(`/users/${id}/activity-log`);
    return response.data.data;
  }

  // Role Management
  async getAllRoles(): Promise<Role[]> {
    const response = await api.get('/roles');
    return response.data.data;
  }

  async getRoleById(id: string): Promise<Role> {
    const response = await api.get(`/roles/${id}`);
    return response.data.data;
  }

  async getAllPermissions(): Promise<Permission[]> {
    const response = await api.get('/roles/permissions');
    return response.data.data;
  }

  async createRole(data: {
    name: string;
    description?: string;
    permissionIds: string[];
  }): Promise<Role> {
    const response = await api.post('/roles', data);
    return response.data.data;
  }

  async updateRole(id: string, data: {
    name?: string;
    description?: string;
    permissionIds?: string[];
  }): Promise<Role> {
    const response = await api.patch(`/roles/${id}`, data);
    return response.data.data;
  }

  async deleteRole(id: string): Promise<void> {
    await api.delete(`/roles/${id}`);
  }

  // User Verification Methods
  async verifyUser(userId: string, otp: string): Promise<User> {
    const response = await api.post('/users/verify', { userId, otp });
    return response.data.data;
  }

  async verifyByToken(token: string, otp?: string): Promise<User> {
    const response = await api.post('/users/verify-token', { token, otp });
    return response.data.data;
  }

  async resendVerification(userId: string): Promise<void> {
    await api.post('/users/resend-verification', { userId });
  }
}

export const userService = new UserService();
