import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowUpDown, Package, XCircle, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { InventoryItem } from '../../types';
import {
  commonColumns,
  createTextColumn,
  createNumberColumn,
  createStatusColumn,
  createDateColumn,
  createActionsColumn,
  ActionHandlers,
  statusVariants
} from '../common/DataTableColumns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { DocumentManager } from '../documents/DocumentManager';
import { useState } from 'react';

export const createInventoryColumns = (handlers: ActionHandlers<InventoryItem>): ColumnDef<InventoryItem>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{item.name}</p>
          {item.description && (
            <p className="text-sm text-muted-foreground truncate">{item.description}</p>
          )}
          {item.sku && (
            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'category',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const category = row.getValue('category') as string;
      return category ? (
        <Badge variant="secondary">{category}</Badge>
      ) : (
        <span className="text-muted-foreground">Uncategorized</span>
      );
    },
  },
  createTextColumn<InventoryItem>('brand', 'Brand'),
  {
    accessorKey: 'quantity',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const item = row.original;
      const allocatedQuantity = item.quantity - item.availableQuantity;
      
      return (
        <div className="text-right">
          <div className="font-medium">
            {item.availableQuantity} / {item.quantity} {item.quantityUnit}
          </div>
          <div className="text-sm text-muted-foreground">
            Available / Total
          </div>
          {allocatedQuantity > 0 && (
            <div className="text-xs text-orange-600">
              {allocatedQuantity} {item.quantityUnit} allocated
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'stockStatus',
    header: 'Status',
    cell: ({ row }) => {
      const item = row.original;
      
      const getStockStatus = () => {
        if (item.availableQuantity === 0) {
          return {
            label: 'Out of Stock',
            variant: 'destructive' as const,
            icon: XCircle,
          };
        }
        if (item.availableQuantity <= item.lowStockThreshold) {
          return {
            label: 'Low Stock',
            variant: 'warning' as const,
            icon: AlertTriangle,
          };
        }
        return {
          label: 'In Stock',
          variant: 'success' as const,
          icon: CheckCircle,
        };
      };

      const status = getStockStatus();
      const Icon = status.icon;

      return (
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4" />
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const item = row.original;
      if (value.includes('out_of_stock') && item.availableQuantity === 0) return true;
      if (value.includes('low_stock') && item.availableQuantity > 0 && item.availableQuantity <= item.lowStockThreshold) return true;
      if (value.includes('in_stock') && item.availableQuantity > item.lowStockThreshold) return true;
      return false;
    },
  },
  createNumberColumn<InventoryItem>('unitPrice', 'Unit Price', {
    format: 'currency',
    className: 'text-right font-medium'
  }),
  {
    accessorKey: 'totalValue',
    header: 'Total Value',
    cell: ({ row }) => {
      const item = row.original;
      const totalValue = item.quantity * item.unitPrice;
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(totalValue);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  createDateColumn<InventoryItem>('createdAt', 'Created', { showTime: true }),
  {
    id: 'documents',
    header: 'Documents',
    cell: ({ row }) => {
      const item = row.original;
      const [isOpen, setIsOpen] = useState(false);

      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
            >
              <FileText className="h-4 w-4 mr-1" />
              Manage
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Documents - {item.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <DocumentManager
                entityType="inventory_item"
                entityId={item.id}
                className="h-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      );
    },
  },
  createActionsColumn<InventoryItem>(handlers),
];
