import { api } from './api';
import { Role, CreateRoleDto, UpdateRoleDto, Permission } from '../types';

export const roleService = {
  async getRoles(): Promise<Role[]> {
    const response = await api.get('/roles');
    return response.data.data;
  },

  async getRole(id: string): Promise<Role> {
    const response = await api.get(`/roles/${id}`);
    return response.data.data;
  },

  async createRole(data: CreateRoleDto): Promise<Role> {
    const response = await api.post('/roles', data);
    return response.data.data;
  },

  async updateRole(id: string, data: UpdateRoleDto): Promise<Role> {
    const response = await api.put(`/roles/${id}`, data);
    return response.data.data;
  },

  async deleteRole(id: string): Promise<void> {
    await api.delete(`/roles/${id}`);
  },

  async getPermissions(): Promise<Permission[]> {
    const response = await api.get('/roles/permissions');
    return response.data.data;
  },

  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    await api.post(`/users/${userId}/roles`, { roleIds });
  },

  async removeRole(userId: string, roleId: string): Promise<void> {
    await api.delete(`/users/${userId}/roles/${roleId}`);
  },
};
