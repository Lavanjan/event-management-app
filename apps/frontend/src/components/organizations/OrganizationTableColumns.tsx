import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Settings, Shield, Trash2, Ban, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Organization } from '../../services/organizationService';

interface OrganizationTableColumnsProps {
  onView: (organization: Organization) => void;
  onEdit: (organization: Organization) => void;
  onManagePermissions: (organization: Organization) => void;
  onDelete?: (organization: Organization) => void;
  onSuspend?: (organization: Organization) => void;
  onResendVerification?: (organization: Organization) => void;
}

export function OrganizationTableColumns({
  onView,
  onEdit,
  onManagePermissions,
  onDelete,
  onSuspend,
  onResendVerification
}: OrganizationTableColumnsProps): ColumnDef<Organization>[] {
  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive || status === 'inactive') {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (status === 'suspended') {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="outline">Pending</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Organization Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const organization = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{organization.name}</span>
            {organization.description && (
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {organization.description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => {
        const organization = row.original;
        return (
          <div className="flex flex-col text-sm">
            {organization.email && <span>{organization.email}</span>}
            {organization.phone && <span className="text-muted-foreground">{organization.phone}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'website',
      header: 'Website',
      cell: ({ row }) => {
        const website = row.getValue('website') as string;
        return website ? (
          <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {website}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const organization = row.original;
        return getStatusBadge(organization.status, organization.isActive);
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return <span className="text-sm">{date.toLocaleDateString()}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const organization = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(organization)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(organization)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManagePermissions(organization)}>
                <Shield className="mr-2 h-4 w-4" />
                Manage Permissions
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {organization.status === 'pending' && onResendVerification && (
                <DropdownMenuItem onClick={() => onResendVerification(organization)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification
                </DropdownMenuItem>
              )}

              {organization.status === 'active' && onSuspend && (
                <DropdownMenuItem onClick={() => onSuspend(organization)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend
                </DropdownMenuItem>
              )}

              {organization.status !== 'active' && onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(organization)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
