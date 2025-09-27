import { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  useInventoryList,
  useInventoryStats,
  useInventoryCategories,
  useDeleteInventoryItem
} from '../../hooks/useInventory';
import { InventoryFilters } from '../../services/inventoryService';
import { format } from 'date-fns';
import CreateInventoryDialog from '../../components/modals/CreateInventoryDialog';
import EditInventoryDialog from '../../components/modals/EditInventoryDialog';
import { useToast } from '../../hooks/use-toast';

export function InventoryListPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'name',
    sortOrder: 'ASC',
  });

  const { data: inventoryData, isLoading, error } = useInventoryList(filters);
  const { data: stats, isLoading: statsLoading } = useInventoryStats();
  const { data: categories, isLoading: categoriesLoading } = useInventoryCategories();
  const deleteInventoryItem = useDeleteInventoryItem();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStockStatus = (item: any) => {
    if (item.quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    const minimumQuantity = item.metadata?.minimumQuantity || 5; // Default minimum quantity
    if (item.quantity <= minimumQuantity) return { label: 'Low Stock', variant: 'warning' as const };
    return { label: 'In Stock', variant: 'success' as const };
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleCategoryFilter = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: category === 'all' ? undefined : category,
      page: 1
    }));
  };

  const handleSort = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
      page: 1
    }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      await deleteInventoryItem.mutateAsync(id);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold">Error loading inventory</h3>
          <p className="mt-2 text-muted-foreground">
            {error.message || 'Something went wrong'}
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
        <CreateInventoryDialog onInventoryCreated={() => {}} />
      </div>

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
                Across {stats.totalCategories} categories
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search inventory items..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={filters.category || 'all'}
              onValueChange={handleCategoryFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {!categoriesLoading && categories?.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'ASC' | 'DESC' }));
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-ASC">Name (A-Z)</SelectItem>
                <SelectItem value="name-DESC">Name (Z-A)</SelectItem>
                <SelectItem value="quantity-ASC">Quantity (Low-High)</SelectItem>
                <SelectItem value="quantity-DESC">Quantity (High-Low)</SelectItem>
                <SelectItem value="unitPrice-ASC">Price (Low-High)</SelectItem>
                <SelectItem value="unitPrice-DESC">Price (High-Low)</SelectItem>
                <SelectItem value="createdAt-DESC">Newest First</SelectItem>
                <SelectItem value="createdAt-ASC">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            {inventoryData?.total || 0} items found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : inventoryData?.data && inventoryData.data.length > 0 ? (
            <div className="space-y-4">
              {inventoryData.data.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Package className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm">
                            <strong>Category:</strong> {item.metadata?.category || 'Uncategorized'}
                          </span>
                          <span className="text-sm">
                            <strong>SKU:</strong> {item.metadata?.sku || 'N/A'}
                          </span>
                          <span className="text-sm">
                            <strong>Price:</strong> {formatCurrency(item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold">{item.quantity}</p>
                        <p className="text-sm text-muted-foreground">Available</p>
                        {item.allocatedQuantity > 0 && (
                          <p className="text-xs text-orange-600">
                            {item.allocatedQuantity} allocated
                          </p>
                        )}
                      </div>

                      <Badge variant={stockStatus.variant}>
                        {stockStatus.label}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <EditInventoryDialog item={item} onInventoryUpdated={() => {}} />
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No inventory items found</h3>
              <p className="mt-2 text-muted-foreground">
                {filters.search ? 'Try adjusting your search criteria' : 'Get started by adding your first inventory item'}
              </p>
              <div className="mt-4">
                <CreateInventoryDialog onInventoryCreated={() => {}} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {inventoryData && inventoryData.total > inventoryData.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((inventoryData.page - 1) * inventoryData.limit) + 1} to{' '}
            {Math.min(inventoryData.page * inventoryData.limit, inventoryData.total)} of{' '}
            {inventoryData.total} items
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(inventoryData.page - 1)}
              disabled={inventoryData.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(inventoryData.page + 1)}
              disabled={inventoryData.page >= Math.ceil(inventoryData.total / inventoryData.limit)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
