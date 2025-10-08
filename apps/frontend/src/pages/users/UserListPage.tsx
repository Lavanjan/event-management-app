import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  ArrowUpDown,
  Users,
  Shield,
  Clock,
  Download
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import { DataTable } from '../../components/common/DataTable';
import { useUsers, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { User } from '../../types';
import { format } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { ManagementLayout, StatCard, ActionButton } from '../../components/layout/ManagementLayout';
import { CreateUserModal } from '../../components/users/CreateUserModal';
import { EditUserModal } from '../../components/users/EditUserModal';

export function UserListPage() {
  // @ts-ignore
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    role: '',
    status: '',
    sortBy: 'firstName',
    sortOrder: 'ASC' as 'ASC' | 'DESC',
  });

  const {
    data: usersData,
    isLoading,
    // @ts-ignore
    error
  // @ts-ignore
  } = useUsers(filters);

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleCreateSuccess = () => {
    // Refresh the users list
    setFilters(prev => ({ ...prev }));
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'staff':
        return 'secondary';
      case 'customer':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // @ts-ignore
  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'secondary';
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleStatusToggle = async (userId: string, currentIsActive: boolean) => {
    try {
      const newIsActive = !currentIsActive;
      await updateUser.mutateAsync({
        id: userId,
        data: { isActive: newIsActive }
      });
      toast({
        title: 'User Updated',
        description: `User ${newIsActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        await deleteUser.mutateAsync(userId);
        toast({
          title: 'User Deleted',
          description: `${userName} has been deleted successfully`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete user',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // @ts-ignore
  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Table columns definition
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'firstName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div>
              <div className="font-medium">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Mail className="mr-1 h-3 w-3" />
                {user.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'roles',
      header: 'Role',
      cell: ({ row }) => {
        const user = row.original;
        const role = user.roles?.[0]?.name || 'Customer';
        return (
          <Badge variant={getRoleColor(role)}>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string;
        return phone ? (
          <div className="flex items-center">
            <Phone className="mr-1 h-3 w-3" />
            {phone}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return (
          <div className="flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            {formatDate(date)}
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const user = row.original;
        const isActive = user.isActive;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-100 text-green-800' : ''}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusToggle(user.id, user.isActive)}
              >
                {user.isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const users = usersData?.data || [];

  const stats: StatCard[] = [
    {
      icon: Users,
      label: 'Total Users',
      value: usersData?.total || 0,
      iconColor: 'text-primary',
    },
    {
      icon: UserCheck,
      label: 'Active Users',
      value: users.filter(u => u.isActive).length,
      iconColor: 'text-green-600',
    },
    {
      icon: Shield,
      label: 'Admins',
      value: users.filter(u => u.userType.includes('admin')).length,
      iconColor: 'text-blue-600',
    },
    {
      icon: Clock,
      label: 'Recent Signups',
      value: users.filter(u => {
        const createdAt = new Date(u.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdAt > thirtyDaysAgo;
      }).length,
      iconColor: 'text-orange-600',
    },
  ];

  const actions: ActionButton[] = [
    {
      icon: Download,
      label: 'Export',
      onClick: () => {
        // Export functionality
        console.log('Export users');
      },
      variant: 'outline',
    },
  ];

  return (
    <div className="space-y-6">
      <ManagementLayout
        title="Users"
        description="Manage user accounts and permissions"
        stats={stats}
        actions={actions}
        tableTitle="All Users"
        tableDescription="Manage and track all user accounts with advanced filtering and search capabilities."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
          <DataTable
            columns={columns}
            data={users}
            searchPlaceholder="Search users..."
            isLoading={isLoading}
            emptyStateIcon={Users}
            emptyStateTitle="No users found"
            emptyStateDescription="Create your first user to get started."
            filters={filters as any}
            onFiltersChange={setFilters as any}
            totalCount={usersData?.total || 0}
          />
        </div>
      </ManagementLayout>

      {/* Create User Modal */}
      <CreateUserModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={selectedUser}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
