import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Edit,
  Trash2,
  AlertTriangle,
  DollarSign,
  BarChart3,
  History,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useToast } from '../../hooks/use-toast';
import { InventoryItem } from '../../types';

// Mock data for demonstration - replace with actual API calls
const mockItem: InventoryItem = {
  id: '1',
  name: 'Professional Sound System',
  description: 'High-quality sound system for events',
  category: { id: '1', name: 'Audio Equipment' },
  brand: 'Bose',
  sku: 'BSE-001',
  quantity: 50,
  availableQuantity: 15,
  quantityUnit: 'pieces',
  unitPrice: 150,
  lowStockThreshold: 10,
  isActive: true,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-09-29'),
};

export function InventoryDetailPage() {

  const navigate = useNavigate();
  const { toast } = useToast();
  const [, setShowEditDialog] = useState(false);

  // For now, using mock data - replace with actual API call
  const item = mockItem;
  const isLoading = false;
  const error = null;

  const handleDelete = async () => {
    if (!item) return;

    if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      try {
        // await deleteInventoryItem.mutateAsync(item.id);
        toast({
          title: 'Item Deleted',
          description: `${item.name} has been deleted successfully.`,
        });
        navigate('/inventory');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete the item. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.availableQuantity === 0) {
      return {
        label: 'Out of Stock',
        variant: 'destructive' as const,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: AlertTriangle
      };
    }
    if (item.availableQuantity <= item.lowStockThreshold) {
      return {
        label: 'Low Stock',
        variant: 'warning' as const,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: AlertTriangle
      };
    }
    return {
      label: 'In Stock',
      variant: 'success' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: Package
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity.toFixed(quantity % 1 === 0 ? 0 : 2)} ${unit}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-semibold">Item Not Found</h3>
        <p className="text-muted-foreground">The inventory item you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/inventory')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inventory
        </Button>
      </div>
    );
  }

  const stockStatus = getStockStatus(item);
  const stockPercentage = (item.availableQuantity / item.quantity) * 100;
  const allocatedQuantity = item.quantity - item.availableQuantity;
  const totalValue = item.quantity * item.unitPrice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{item.name}</h1>
            <p className="text-muted-foreground">{item.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {(stockStatus.variant === 'destructive' || stockStatus.variant === 'warning') && (
        <Card className={`border-l-4 ${stockStatus.variant === 'destructive' ? 'border-l-red-500' : 'border-l-orange-500'} ${stockStatus.bgColor}`}>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <stockStatus.icon className={`h-6 w-6 ${stockStatus.color}`} />
              <div>
                <h3 className={`font-semibold ${stockStatus.color}`}>
                  {stockStatus.variant === 'destructive' ? 'Out of Stock Alert' : 'Low Stock Alert'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stockStatus.variant === 'destructive'
                    ? 'This item is completely out of stock and needs immediate restocking.'
                    : `Only ${formatQuantity(item.availableQuantity, item.quantityUnit)} remaining. Consider restocking soon.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatQuantity(item.availableQuantity, item.quantityUnit)}
            </div>
            <div className="space-y-2 mt-2">
              <Progress value={stockPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {formatQuantity(item.quantity, item.quantityUnit)} total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <stockStatus.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={stockStatus.variant} className="text-sm">
              {stockStatus.label}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Threshold: {formatQuantity(item.lowStockThreshold, item.quantityUnit)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unit Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(item.unitPrice)}</div>
            <p className="text-xs text-muted-foreground">per {item.quantityUnit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatQuantity(item.quantity, item.quantityUnit)} × {formatCurrency(item.unitPrice)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Item Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SKU</label>
                    <p className="font-medium">{item.sku || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <p className="font-medium">{typeof item.category === 'string' ? item.category : item.category?.name || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Brand</label>
                    <p className="font-medium">{item.brand || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unit</label>
                    <p className="font-medium">{item.quantityUnit}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Quantity</span>
                    <span className="font-medium">{formatQuantity(item.quantity, item.quantityUnit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Available</span>
                    <span className="font-medium text-green-600">{formatQuantity(item.availableQuantity, item.quantityUnit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Allocated</span>
                    <span className="font-medium text-orange-600">{formatQuantity(allocatedQuantity, item.quantityUnit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Low Stock Threshold</span>
                    <span className="font-medium">{formatQuantity(item.lowStockThreshold, item.quantityUnit)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Allocation</CardTitle>
              <CardDescription>
                View how this inventory item is currently allocated across bookings and events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Allocation Details</h3>
                <p className="mt-2 text-muted-foreground">
                  Allocation tracking will be implemented here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock History</CardTitle>
              <CardDescription>
                Track changes to stock levels, pricing, and other modifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">History Tracking</h3>
                <p className="mt-2 text-muted-foreground">
                  Stock history tracking will be implemented here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
