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
  Users
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

export function UserListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    error
  } = useUsers(filters);

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

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

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateUser.mutateAsync({
        id: userId,
        data: { status: newStatus }
      });
      toast({
        title: 'User Updated',
        description: `User status changed to ${newStatus}`,
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
    navigate(`/users/${user.id}/edit`);
  };

  const handleView = (user: User) => {
    navigate(`/users/${user.id}`);
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={getStatusColor(status)}>
            {status || 'Unknown'}
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
                onClick={() => handleStatusToggle(user.id, user.status || 'inactive')}
              >
                {user.status === 'active' ? (
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={() => navigate('/users/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users..."
        isLoading={isLoading}
        emptyStateIcon={Users}
        emptyStateTitle="No users found"
        emptyStateDescription="Create your first user to get started."
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={usersData?.total || 0}
      />
    </div>
  );
}
