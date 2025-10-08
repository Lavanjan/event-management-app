import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  MoreHorizontal,
  ArrowUpDown,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

// Common column types
export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface ActionHandlers<T> {
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  customActions?: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: (item: T) => void;
    variant?: 'default' | 'destructive';
  }>;
}

// Status badge variants
export const statusVariants = {
  active: 'default',
  inactive: 'secondary',
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
  cancelled: 'destructive',
  completed: 'success',
  in_progress: 'warning',
  draft: 'secondary',
  published: 'default',
  archived: 'secondary',
  paid: 'success',
  unpaid: 'destructive',
  partial: 'warning',
  refunded: 'secondary',
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'destructive',
} as const;

// Utility functions for common column types
export const createSelectColumn = <T,>(): ColumnDef<T> => ({
  id: 'select',
  header: ({ table }) => (
    <input
      type="checkbox"
      checked={table.getIsAllPageRowsSelected()}
      onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
      className="rounded border border-input"
    />
  ),
  cell: ({ row }) => (
    <input
      type="checkbox"
      checked={row.getIsSelected()}
      onChange={(e) => row.toggleSelected(e.target.checked)}
      className="rounded border border-input"
    />
  ),
  enableSorting: false,
  enableHiding: false,
});

export const createTextColumn = <T,>(
  accessorKey: string,
  header: string,
  options?: {
    sortable?: boolean;
    searchable?: boolean;
    className?: string;
    maxLength?: number;
  }
): ColumnDef<T> => ({
  accessorKey,
  header: options?.sortable !== false ? ({ column }) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="h-auto p-0 font-medium"
    >
      {header}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ) : header,
  cell: ({ getValue }) => {
    const value = getValue() as string;
    if (!value) return <span className="text-muted-foreground">—</span>;
    
    if (options?.maxLength && value.length > options.maxLength) {
      return (
        <span title={value} className={options.className}>
          {value.substring(0, options.maxLength)}...
        </span>
      );
    }
    
    return <span className={options?.className}>{value}</span>;
  },
});

export const createNumberColumn = <T,>(
  accessorKey: string,
  header: string,
  options?: {
    sortable?: boolean;
    format?: 'currency' | 'decimal' | 'integer';
    currency?: string;
    decimals?: number;
    className?: string;
  }
): ColumnDef<T> => ({
  accessorKey,
  header: options?.sortable !== false ? ({ column }) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="h-auto p-0 font-medium"
    >
      {header}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ) : header,
  cell: ({ getValue }) => {
    const value = getValue() as number;
    if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
    
    let formattedValue: string;
    
    switch (options?.format) {
      case 'currency':
        formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: options.currency || 'USD',
        }).format(value);
        break;
      case 'decimal':
        formattedValue = value.toFixed(options?.decimals || 2);
        break;
      case 'integer':
        formattedValue = Math.round(value).toString();
        break;
      default:
        formattedValue = value.toString();
    }
    
    return <span className={options?.className}>{formattedValue}</span>;
  },
});

export const createDateColumn = <T,>(
  accessorKey: string,
  header: string,
  options?: {
    sortable?: boolean;
    format?: string;
    showTime?: boolean;
    className?: string;
  }
): ColumnDef<T> => ({
  accessorKey,
  header: options?.sortable !== false ? ({ column }) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="h-auto p-0 font-medium"
    >
      {header}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ) : header,
  cell: ({ getValue }) => {
    const value = getValue();
    if (!value) return <span className="text-muted-foreground">—</span>;
    
    const date = typeof value === 'string' ? new Date(value) : value as Date;
    const formatString = options?.format || (options?.showTime ? 'MMM dd, yyyy HH:mm' : 'MMM dd, yyyy');
    
    return (
      <div className={`text-sm ${options?.className || ''}`}>
        <div>{format(date, formatString)}</div>
        {options?.showTime && !options?.format && (
          <div className="text-muted-foreground">{format(date, 'HH:mm')}</div>
        )}
      </div>
    );
  },
});

export const createStatusColumn = <T,>(
  accessorKey: string,
  header: string,
  options?: {
    sortable?: boolean;
    statusMap?: Record<string, { label: string; variant: keyof typeof statusVariants }>;
    className?: string;
  }
): ColumnDef<T> => ({
  accessorKey,
  header: options?.sortable !== false ? ({ column }) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="h-auto p-0 font-medium"
    >
      {header}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ) : header,
  cell: ({ getValue }) => {
    const value = getValue() as string;
    if (!value) return <span className="text-muted-foreground">—</span>;
    
    const statusConfig = options?.statusMap?.[value] || {
      label: value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      variant: 'default' as keyof typeof statusVariants
    };
    
    return (
      <Badge variant={statusVariants[statusConfig.variant] as any} className={options?.className}>
        {statusConfig.label}
      </Badge>
    );
  },
});

export const createActionsColumn = <T extends BaseEntity>(
  handlers: ActionHandlers<T>
): ColumnDef<T> => ({
  id: 'actions',
  header: 'Actions',
  cell: ({ row }) => {
    const item = row.original;
    
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
          
          {handlers.onView && (
            <DropdownMenuItem onClick={() => handlers.onView!(item)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
          )}
          
          {handlers.onEdit && (
            <DropdownMenuItem onClick={() => handlers.onEdit!(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          
          {handlers.customActions?.map((action, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => action.onClick(item)}
              className={action.variant === 'destructive' ? 'text-red-600' : ''}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          ))}
          
          {(handlers.onDelete || handlers.customActions?.some(a => a.variant === 'destructive')) && (
            <DropdownMenuSeparator />
          )}
          
          {handlers.onDelete && (
            <DropdownMenuItem
              onClick={() => handlers.onDelete!(item)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
  enableSorting: false,
  enableHiding: false,
});

// Preset column configurations for common use cases
export const commonColumns = {
  id: <T,>() => createTextColumn<T>('id', 'ID', { sortable: false, maxLength: 8 }),
  name: <T,>() => createTextColumn<T>('name', 'Name'),
  description: <T,>() => createTextColumn<T>('description', 'Description', { maxLength: 50 }),
  email: <T,>() => createTextColumn<T>('email', 'Email'),
  status: <T,>() => createStatusColumn<T>('status', 'Status'),
  createdAt: <T,>() => createDateColumn<T>('createdAt', 'Created', { showTime: true }),
  updatedAt: <T,>() => createDateColumn<T>('updatedAt', 'Updated', { showTime: true }),
  price: <T,>() => createNumberColumn<T>('price', 'Price', { format: 'currency' }),
  quantity: <T,>() => createNumberColumn<T>('quantity', 'Quantity', { format: 'decimal', decimals: 2 }),
  actions: <T extends BaseEntity>(handlers: ActionHandlers<T>) => createActionsColumn(handlers),
};
