import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Users, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { api } from '../../services/api';

interface Role {
  id: string;
  name: string;
  description: string;
  scope: string;
  isActive: boolean;
  isSystemRole?: boolean;
  rolePermissions: Array<{
    id: string;
    module: string;
    action: string;
    enabled: boolean;
  }>;
  _count?: {
    users: number;
  };
}

interface RoleManagementTabProps {
  roles: Role[];
  isLoadingRoles: boolean;
  availablePermissions: string[];
  hasPermission: (permission: string) => boolean;
}

interface CreateRoleDto {
  name: string;
  description: string;
  scope: 'organization';
  permissionKeys: string[];
}

export const RoleManagementTab: React.FC<RoleManagementTabProps> = ({
  roles,
  isLoadingRoles,
  availablePermissions,
  hasPermission,
}) => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<CreateRoleDto>({
    name: '',
    description: '',
    scope: 'organization',
    permissionKeys: [],
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: CreateRoleDto) => {
      const response = await api.post('/roles', roleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationRoles'] });
      setIsCreateModalOpen(false);
      setNewRole({ name: '', description: '', scope: 'organization', permissionKeys: [] });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateRoleDto> }) => {
      const response = await api.put(`/roles/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationRoles'] });
      setIsEditModalOpen(false);
      setSelectedRole(null);
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      await api.delete(`/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationRoles'] });
      setSelectedRole(null);
    },
  });

  const handleCreateRole = () => {
    createRoleMutation.mutate(newRole);
  };

  const handleUpdateRole = () => {
    if (selectedRole) {
      updateRoleMutation.mutate({
        id: selectedRole.id,
        data: {
          name: selectedRole.name,
          description: selectedRole.description,
          permissionKeys: selectedRole.rolePermissions
            .filter(p => p.enabled)
            .map(p => `${p.module}.${p.action}`),
        },
      });
    }
  };

  const handleDeleteRole = (roleId: string) => {
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  const togglePermissionInNewRole = (permission: string) => {
    setNewRole(prev => ({
      ...prev,
      permissionKeys: prev.permissionKeys.includes(permission)
        ? prev.permissionKeys.filter(p => p !== permission)
        : [...prev.permissionKeys, permission],
    }));
  };

  const togglePermissionInSelectedRole = (permission: string) => {
    if (!selectedRole) return;
    
    const [module, action] = permission.split('.');
    const existingPermission = selectedRole.rolePermissions.find(
      p => p.module === module && p.action === action
    );

    if (existingPermission) {
      // Toggle existing permission
      setSelectedRole({
        ...selectedRole,
        rolePermissions: selectedRole.rolePermissions.map(p =>
          p.id === existingPermission.id ? { ...p, enabled: !p.enabled } : p
        ),
      });
    } else {
      // Add new permission
      setSelectedRole({
        ...selectedRole,
        rolePermissions: [
          ...selectedRole.rolePermissions,
          {
            id: `temp-${Date.now()}`,
            module,
            action,
            enabled: true,
          },
        ],
      });
    }
  };

  if (!hasPermission('roles.read')) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Insufficient Permissions</h3>
            <p className="text-sm text-yellow-700 mt-1">
              You need role management permissions to access this feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Organization Roles</h3>
          <p className="text-sm text-gray-500">Manage roles and their permissions</p>
        </div>
        {hasPermission('roles.create') && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-md font-medium text-gray-900">Roles</h4>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {isLoadingRoles ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : roles?.filter(role => !role.isSystemRole).length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No dynamic roles found</p>
              </div>
            ) : (
              roles?.filter(role => !role.isSystemRole).map((role) => (
                <div
                  key={role.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedRole?.id === role.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-sm font-medium text-gray-900">{role.name}</h5>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          role.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {role.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {role._count?.users || 0} users
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          {role.rolePermissions?.filter(p => p.enabled).length || 0} permissions
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasPermission('roles.update') && !role.isSystemRole && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRole(role);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {hasPermission('roles.delete') && !role.isSystemRole && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(role.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Role Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-md font-medium text-gray-900">
              {selectedRole ? `${selectedRole.name} Permissions` : 'Select a Role'}
            </h4>
          </div>
          <div className="p-6">
            {!selectedRole ? (
              <p className="text-gray-500 text-center py-8">
                Select a role from the list to view its permissions
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Role Information</h5>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div>
                      <span className="text-xs font-medium text-gray-500">Name:</span>
                      <p className="text-sm text-gray-900">{selectedRole.name}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Description:</span>
                      <p className="text-sm text-gray-900">{selectedRole.description}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Scope:</span>
                      <p className="text-sm text-gray-900">{selectedRole.scope}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Permissions</h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availablePermissions.map((permission) => {
                      const [module, action] = permission.split('.');
                      const rolePermission = selectedRole.rolePermissions.find(
                        p => p.module === module && p.action === action
                      );
                      const isEnabled = rolePermission?.enabled || false;

                      return (
                        <div key={permission} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{permission}</p>
                            <p className="text-xs text-gray-500">
                              {module} module - {action} action
                            </p>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isEnabled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {isEnabled ? 'Granted' : 'Not Granted'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Role</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter role name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Enter role description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                    {availablePermissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`new-${permission}`}
                          checked={newRole.permissionKeys.includes(permission)}
                          onChange={() => togglePermissionInNewRole(permission)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label htmlFor={`new-${permission}`} className="text-sm text-gray-900">
                          {permission}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRole}
                  disabled={!newRole.name.trim() || createRoleMutation.isPending}
                >
                  {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {isEditModalOpen && selectedRole && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Role: {selectedRole.name}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={selectedRole.name}
                    onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={selectedRole.description}
                    onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                    {availablePermissions.map((permission) => {
                      const [module, action] = permission.split('.');
                      const rolePermission = selectedRole.rolePermissions.find(
                        p => p.module === module && p.action === action
                      );
                      const isEnabled = rolePermission?.enabled || false;

                      return (
                        <div key={permission} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            id={`edit-${permission}`}
                            checked={isEnabled}
                            onChange={() => togglePermissionInSelectedRole(permission)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <label htmlFor={`edit-${permission}`} className="text-sm text-gray-900">
                            {permission}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateRole}
                  disabled={updateRoleMutation.isPending}
                >
                  {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
