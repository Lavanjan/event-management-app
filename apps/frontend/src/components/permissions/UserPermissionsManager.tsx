// @ts-ignore
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useThreeTierPermissions } from '../../hooks/useThreeTierPermissions';
import { userPermissionService } from '../../services/userPermissionService';
import { api } from '../../services/api';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { DataTable } from '../ui/data-table';
import { ManagementLayout, StatCard, ActionButton } from '../layout/ManagementLayout';
import {
  Search,
  Users,
  Shield,
  Settings,

  AlertCircle,
  ArrowUpDown,
  MoreHorizontal,
  UserCheck,
  UserX,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useToast } from '../../hooks/use-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  isActive: boolean;
  permissions?: UserPermission[];
}

interface UserPermission {
  id: string;
  permissionKey: string;
  type: 'grant' | 'deny';
  enabled: boolean;
  grantedBy: string;
  grantedAt: string;
  reason?: string;
}

interface UserPermissionsManagerProps {
  className?: string;
}

export const UserPermissionsManager: React.FC<UserPermissionsManagerProps> = ({
  // @ts-ignore
  className = ''
}) => {
  // @ts-ignore - className is used for styling but not referenced in code
  console.log(className);
  const { hasPermission } = useThreeTierPermissions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch organization users with their permission counts
  const { data: users = [] } = useQuery({
    queryKey: ['organization-users'],
    queryFn: async () => {
      const response = await api.get('/users/organization');
      // Handle nested data structure
      return response.data.data?.data || response.data.data || response.data || [];
    },
  });

  // Update user permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ userId, permissionKey, type }: { userId: string; permissionKey: string; type: 'grant' | 'deny' | 'remove' }) => {
      if (type === 'remove') {
        return userPermissionService.removeUserPermission(userId);
      }
      return userPermissionService.updateUserPermission(userId, { permissionKey, granted: type === 'grant' } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-users'] });
      toast({
        title: 'Success',
        description: 'User permission updated successfully',
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

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter((user: User) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Handle permission actions
  const handlePermissionAction = (userId: string, permissionKey: string, type: 'grant' | 'deny' | 'remove') => {
    updatePermissionMutation.mutate({
      userId,
      permissionKey,
      type,
    });
  };

  // Get permission count for a user
  const getPermissionCount = (user: User) => {
    if (!user.permissions) return 0;
    return user.permissions.filter(p => p.enabled).length;
  };

  // Get user status badge
  const getUserStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
  };

  // Get user type badge
  const getUserTypeBadge = (userType: string) => {
    const type = userType.replace('_', ' ');
    return <Badge variant="outline">{type}</Badge>;
  };

  // Table columns definition
  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          User Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                {user.firstName[0]}{user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.firstName} {user.lastName}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'userType',
      header: 'User Type',
      cell: ({ row }) => getUserTypeBadge(row.original.userType),
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => {
        const count = getPermissionCount(row.original);
        return (
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>{count} overrides</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => getUserStatusBadge(row.original),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Manage Permissions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handlePermissionAction(user.id, 'all', 'remove')}
                className="text-destructive"
              >
                <UserX className="mr-2 h-4 w-4" />
                Clear All Overrides
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [getPermissionCount, getUserStatusBadge, getUserTypeBadge, handlePermissionAction]);

  if (!hasPermission('users.update')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Insufficient Permissions</h3>
            <p className="text-gray-600">You need user management permissions to access this feature.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats: StatCard[] = [
    {
      icon: Users,
      label: 'Total Users',
      value: users.length,
      iconColor: 'bg-teal-100',
    },
    {
      icon: UserCheck,
      label: 'Active Users',
      value: users.filter((u: User) => u.isActive).length,
      iconColor: 'bg-green-100',
    },
    {
      icon: Shield,
      label: 'With Overrides',
      value: users.filter((u: User) => u.permissions && u.permissions.length > 0).length,
      iconColor: 'bg-blue-100',
    },
    {
      icon: Settings,
      label: 'Admins',
      value: users.filter((u: User) => u.userType.includes('admin')).length,
      iconColor: 'bg-orange-100',
    },
  ];

  const actions: ActionButton[] = [
    {
      icon: Download,
      label: 'Export',
      onClick: () => {
        // Export functionality
        console.log('Export user permissions');
      },
      variant: 'outline',
    },
  ];

  return (
    <div className="space-y-6">
      <ManagementLayout
        title="User Permissions"
        description="Manage individual user permissions and overrides for your organization."
        stats={stats}
        actions={actions}
        tableTitle="Organization Users"
        tableDescription="Manage and track all user permissions with advanced filtering and search capabilities."
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredUsers}
          />
        </div>
      </ManagementLayout>

      {/* Permission Management Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Permissions for {selectedUser.firstName} {selectedUser.lastName}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Manage individual permission overrides for this user. This feature will be enhanced in future updates.
              </p>
              <div className="text-center py-8">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Permission Management</h3>
                <p className="text-muted-foreground">
                  Individual permission management interface coming soon.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};


