import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { DataTable } from '../common/DataTable';
import { useToast } from '../../hooks/use-toast';
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Users,
  Shield,
  Settings
} from 'lucide-react';
import { api } from '../../services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { CreateRoleModal } from './CreateRoleModal';
import { EditRoleModal } from './EditRoleModal';
import { RoleDetailsModal } from './RoleDetailsModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface Role {
  id: string;
  name: string;
  description: string;
  scope: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rolePermissions: Array<{
    id: string;
    permissionKey: string;
    name: string;
    category: string;
  }>;
  permissionKeys: string[];
}

interface RoleFilters {
  search: string;
  scope: string;
  isActive: string;
  page: number;
  limit: number;
}

export const RoleList: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<RoleFilters>({
    search: '',
    scope: '',
    isActive: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const { toast } = useToast();

  const loadRoles = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await api.get(`/enhanced-roles?${queryParams}`);
      const result = response.data;
      if (result.success) {
        setRoles(result.data);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load roles. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, [filters]);

  const handleFilterChange = (key: keyof RoleFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      const response = await fetch(`/api/roles/enhanced/${roleToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete role');
      }

      toast({
        title: 'Success',
        description: 'Role deleted successfully.',
      });
      
      loadRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete role. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setRoleToDelete(null);
    }
  };

  const getPermissionCategoryCounts = (role: Role) => {
    const categories = role.rolePermissions.reduce((acc, perm) => {
      acc[perm.category] = (acc[perm.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .slice(0, 3) // Show only first 3 categories
      .map(([category, count]) => `${category} (${count})`)
      .join(', ');
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Role Name',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-gray-500">{row.original.description || 'No description'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'scope',
      header: 'Scope',
      cell: ({ row }: any) => (
        <Badge variant={row.original.scope === 'global' ? 'default' : 'secondary'}>
          {row.original.scope.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.rolePermissions.length} permissions</div>
          <div className="text-sm text-gray-500">
            {getPermissionCategoryCounts(row.original)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: any) => (
        <div className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRole(row.original);
              setShowDetailsModal(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRole(row.original);
              setShowEditModal(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRoleToDelete(row.original);
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-gray-600">Manage roles and permissions for your organization</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search roles..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              value={filters.scope}
              onValueChange={(value) => handleFilterChange('scope', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Scopes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Scopes</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.isActive}
              onValueChange={(value) => handleFilterChange('isActive', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  search: '',
                  scope: '',
                  isActive: '',
                  page: 1,
                  limit: 20,
                });
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={roles}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>

      {showCreateModal && (
        <CreateRoleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadRoles();
            setShowCreateModal(false);
          }}
        />
      )}

      {showEditModal && selectedRole && (
        <EditRoleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          role={selectedRole}
          onSuccess={() => {
            loadRoles();
            setShowEditModal(false);
          }}
        />
      )}

      {showDetailsModal && selectedRole && (
        <RoleDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          role={selectedRole}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.name}"? 
              This action cannot be undone and will remove all permissions associated with this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole}>
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
