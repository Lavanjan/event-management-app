// @ts-ignore
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useThreeTierPermissions } from '../../hooks/useThreeTierPermissions';
import { api } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
// @ts-ignore
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { CreateRoleModal } from '../roles/CreateRoleModal';
import { ManageRolePermissionsModal } from '../roles/ManageRolePermissionsModal';
import { DataTable } from '../common/DataTable';
import { ManagementLayout, StatCard, ActionButton } from '../layout/ManagementLayout';
import {
  // @ts-ignore
  Search,
  Shield,
  Plus,
  Users,
  Settings,
  AlertCircle,
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  X,
  Download,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useToast } from '../../hooks/use-toast';

interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  userCount?: number;
  permissions?: string[];
}

interface RolePermission {
  id: string;
  permissionKey: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

interface RolePermissionsManagerProps {
  className?: string;
}

// @ts-ignore
export const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({
  // @ts-ignore
  className = ''
}) => {
  const {
    // @ts-ignore
    isOrganizationAdmin,
    // @ts-ignore
    hasPermission,
    // @ts-ignore
    organizationFeatures,
    // @ts-ignore
    permissionData
  } = useThreeTierPermissions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch organization roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['organization-roles'],
    queryFn: async () => {
      const response = await api.get('/enhanced-roles');
      return response.data.data;
    },
  });

  // Fetch role permissions for selected role
  const { data: rolePermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['role-permissions', selectedRole?.id],
    queryFn: async () => {
      if (!selectedRole) return [];
      const response = await api.get(`/roles/${selectedRole.id}/permissions`);
      return response.data.data;
    },
    enabled: !!selectedRole,
  });

  // Update role permission mutation
  const updateRolePermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissionKey, enabled }: { roleId: string; permissionKey: string; enabled: boolean }) => {
      return api.patch(`/roles/${roleId}/permissions/${permissionKey}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: 'Success',
        description: 'Role permission updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update permission',
        variant: 'destructive',
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return api.delete(`/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-roles'] });
      setSelectedRole(null);
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete role',
        variant: 'destructive',
      });
    },
  });

  // Table columns definition
  const columns: ColumnDef<Role>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 hover:bg-transparent"
        >
          Role Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium">{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-muted-foreground max-w-[300px] truncate">
          {row.getValue('description') || 'No description'}
        </span>
      ),
    },
    {
      accessorKey: 'userCount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 hover:bg-transparent"
        >
          Users
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue('userCount') || 0}</span>
        </div>
      ),
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => {
        const permissions = row.getValue('permissions') as string[] || [];
        return (
          <Badge variant="outline">
            {permissions.length} permissions
          </Badge>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>
          {row.getValue('isActive') ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const role = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedRole(role)}>
                <Edit className="mr-2 h-4 w-4" />
                Manage Permissions
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteRoleMutation.mutate(role.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [deleteRoleMutation, setSelectedRole]);

  const handlePermissionToggle = (permissionKey: string, enabled: boolean) => {
    if (!selectedRole) return;
    updateRolePermissionMutation.mutate({
      roleId: selectedRole.id,
      permissionKey,
      enabled,
    });
  };

  const isPermissionEnabled = (permissionKey: string) => {
    return rolePermissions.some((p: RolePermission) => p.permissionKey === permissionKey && p.enabled);
  };

  const groupPermissionsByCategory = () => {
    const grouped: { [key: string]: string[] } = {};
    organizationFeatures?.forEach(feature => {
      const category = feature.split('.')[0];
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(feature);
    });
    return grouped;
  };

  if (!hasPermission('roles.read')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Insufficient Permissions</h3>
            <p className="text-gray-600">You need role management permissions to access this feature.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats: StatCard[] = [
    {
      icon: Shield,
      label: 'Total Roles',
      value: roles.length,
      iconColor: 'bg-teal-100',
    },
    {
      icon: Users,
      label: 'Active Roles',
      value: roles.filter((r: any) => r.isActive).length,
      iconColor: 'bg-green-100',
    },
    {
      icon: Settings,
      label: 'Permissions',
      value: organizationFeatures?.length || 0,
      iconColor: 'bg-blue-100',
    },
    {
      icon: CheckCircle,
      label: 'System Roles',
      value: roles.filter((r: any) => r.scope === 'system').length,
      iconColor: 'bg-orange-100',
    },
  ];

  const actions: ActionButton[] = [
    {
      icon: Plus,
      label: 'Create Role',
      onClick: () => setShowCreateModal(true),
      variant: 'default',
    },
    {
      icon: Download,
      label: 'Export',
      onClick: () => {
        // Export functionality
        console.log('Export roles');
      },
      variant: 'outline',
    },
  ];

  return (
    <div className="space-y-6">
      <ManagementLayout
        title="Role Management"
        description="Create and manage roles with specific permissions for your organization."
        stats={stats}
        actions={actions}
        tableTitle="Organization Roles"
        tableDescription="Manage and track all roles with advanced filtering and search capabilities."
      >
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={roles}
            searchPlaceholder="Search roles..."
            isLoading={rolesLoading}
            emptyStateIcon={Shield}
            emptyStateTitle="No roles found"
            emptyStateDescription="Create your first role to get started."
            totalCount={roles.length}
          />
        </div>
      </ManagementLayout>

      {/* Permission Management Modal */}
      {selectedRole && (
        <ManageRolePermissionsModal
          role={selectedRole}
          isOpen={!!selectedRole}
          onClose={() => setSelectedRole(null)}
          onPermissionsUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['organization-roles'] });
            queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
          }}
        />
      )}

      {/* Create Role Modal */}
      <CreateRoleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries({ queryKey: ['organization-roles'] });
        }}
      />
    </div>
  );
};
