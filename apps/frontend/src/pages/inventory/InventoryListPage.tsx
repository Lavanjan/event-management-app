import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Bell
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your event inventory items and track stock levels
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/inventory/alerts')}
            className="relative"
          >
            <Bell className="h-4 w-4 mr-2" />
            Alerts
            {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {lowStockItems.length + outOfStockItems.length}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <CreateInventoryDialog onInventoryCreated={() => {}} />
        </div>
      </div>

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

      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeItems} active items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                Current inventory value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</div>
              <p className="text-xs text-muted-foreground">
                Need restocking
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Data Table */}
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
  );
}
