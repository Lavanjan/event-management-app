import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Bell,
  Download
} from 'lucide-react';
import { Button } from '../../components/ui/button';

import {
  useInventoryList,
  useInventoryStats,
  useDeleteInventoryItem,
  useLowStockItems,
  useOutOfStockItems
} from '../../hooks/useInventory';
import { InventoryDataTable } from '../../components/inventory/InventoryDataTable';
import { createInventoryColumns } from '../../components/inventory/InventoryTableColumns';
import { LowStockAlerts } from '../../components/inventory/LowStockAlerts';
import { InventoryFilters } from '../../services/inventoryService';
import { InventoryItem } from '../../types';
import CreateInventoryDialog from '../../components/modals/CreateInventoryDialog';
import { useToast } from '../../hooks/use-toast';
import { ManagementLayout, StatCard, ActionButton } from '../../components/layout/ManagementLayout';

export function InventoryListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'name',
    sortOrder: 'ASC',
  });
  const [showLowStockAlerts, setShowLowStockAlerts] = useState(true);

  const { data: inventoryData, isLoading, error, refetch } = useInventoryList(filters);
  const { data: stats, isLoading: statsLoading } = useInventoryStats();

  const { data: lowStockItems = [], isLoading: lowStockLoading } = useLowStockItems();
  const { data: outOfStockItems = [], isLoading: outOfStockLoading } = useOutOfStockItems();
  const deleteInventoryItem = useDeleteInventoryItem();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleFiltersChange = (newFilters: Partial<InventoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleDelete = async (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await deleteInventoryItem.mutateAsync(item.id);
        toast({
          title: 'Item Deleted',
          description: `${item.name} has been deleted successfully.`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete the item. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEdit = (item: InventoryItem) => {
    // This will be handled by the EditInventoryDialog component
    console.log('Edit item:', item);
  };

  const handleView = (item: InventoryItem) => {
    // Navigate to item detail page or open view modal
    console.log('View item:', item);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters(prev => ({ ...prev, limit: pageSize, page: 1 }));
  };

  const handleRefresh = () => {
    refetch();
  };

  // Create filter options from stats
  const filterOptions = {
    categories: stats?.categories?.map(cat => ({ label: cat, value: cat })) || [],
    brands: stats?.brands?.map(brand => ({ label: brand, value: brand })) || [],
    quantityUnits: stats?.quantityUnits?.map(unit => ({ label: unit, value: unit })) || [],
    stockStatuses: [
      { label: 'In Stock', value: 'in_stock' },
      { label: 'Low Stock', value: 'low_stock' },
      { label: 'Out of Stock', value: 'out_of_stock' },
    ],
  };

  // Create table columns
  const columns = createInventoryColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onView: handleView,
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold">Error loading inventory</h3>
          <p className="mt-2 text-muted-foreground">
            {(error as any)?.message || 'Something went wrong'}
          </p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const statsCards: StatCard[] = !statsLoading && stats ? [
    {
      icon: Package,
      label: 'Total Items',
      value: `${stats.totalItems} (${stats.activeItems} active)`,
      iconColor: 'text-primary',
    },
    {
      icon: TrendingUp,
      label: 'Total Value',
      value: formatCurrency(stats.totalValue),
      iconColor: 'text-green-600',
    },
    {
      icon: AlertTriangle,
      label: 'Low Stock Items',
      value: stats.lowStockItems,
      iconColor: 'text-orange-600',
    },
    {
      icon: TrendingDown,
      label: 'Out of Stock',
      value: stats.outOfStockItems,
      iconColor: 'text-red-600',
    },
  ] : [];

  const actions: ActionButton[] = [
    {
      icon: Bell,
      label: `Alerts ${(lowStockItems.length > 0 || outOfStockItems.length > 0) ? `(${lowStockItems.length + outOfStockItems.length})` : ''}`,
      onClick: () => navigate('/inventory/alerts'),
      variant: 'outline',
    },
    {
      icon: RefreshCw,
      label: 'Refresh',
      onClick: handleRefresh,
      variant: 'outline',
    },
    {
      icon: Download,
      label: 'Export',
      onClick: () => {
        // Export functionality
        console.log('Export inventory');
      },
      variant: 'outline',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Low Stock Alerts */}
      {showLowStockAlerts && !lowStockLoading && !outOfStockLoading &&
       (lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <LowStockAlerts
          lowStockItems={lowStockItems}
          outOfStockItems={outOfStockItems}
          onItemClick={handleView}
          onDismiss={() => setShowLowStockAlerts(false)}
        />
      )}

      <ManagementLayout
        title="Inventory Management"
        description="Manage your event inventory items and track stock levels"
        stats={statsCards}
        actions={actions}
        tableTitle="All Inventory Items"
        tableDescription="Manage and track all your inventory items with advanced filtering and search capabilities."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <CreateInventoryDialog onInventoryCreated={() => {}} />
          </div>
          <InventoryDataTable
            columns={columns}
            data={inventoryData?.data || []}
            searchPlaceholder="Search inventory items..."
            filterOptions={filterOptions}
            onFiltersChange={handleFiltersChange}
            isLoading={isLoading}
            totalCount={inventoryData?.total || 0}
            pageCount={inventoryData?.totalPages || 0}
            currentPage={inventoryData?.page || 1}
            pageSize={inventoryData?.limit || 20}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </ManagementLayout>
    </div>
  );
}
