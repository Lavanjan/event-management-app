import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Package,
  TrendingDown,

  Filter,
  Search,
  Download,

  Eye,
  Edit,
  BarChart3
} from 'lucide-react';
import { ManagementLayout, StatCard, ActionButton } from '../../components/layout/ManagementLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { InventoryItem } from '../../types';
import { useLowStockItems, useOutOfStockItems } from '../../hooks/useInventory';
import { useCurrency } from '../../contexts/CurrencyContext';

export function LowStockAlertsPage() {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('urgency');

  // Fetch real data from backend
  const { data: lowStockData, isLoading: lowStockLoading } = useLowStockItems();
  const { data: outOfStockData, isLoading: outOfStockLoading } = useOutOfStockItems();

  const lowStockItems = lowStockData || [];
  const outOfStockItems = outOfStockData || [];
  const allItems = [...lowStockItems, ...outOfStockItems];

  // Filter items based on search and category
  const filteredLowStockItems = lowStockItems.filter((item: InventoryItem) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category?.name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredOutOfStockItems = outOfStockItems.filter((item: InventoryItem) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category?.name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sort items based on urgency
  const sortedLowStockItems = [...filteredLowStockItems].sort((a, b) => {
    if (sortBy === 'urgency') {
      const aUrgency = a.availableQuantity / (a.lowStockThreshold || 1);
      const bUrgency = b.availableQuantity / (b.lowStockThreshold || 1);
      return aUrgency - bUrgency;
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'category') {
      return (a.category?.name || '').localeCompare(b.category?.name || '');
    }
    return 0;
  });

  // Get unique categories from all items
  const categories = Array.from(new Set(allItems.map(item => item.category?.name || item.category)));

  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity.toFixed(quantity % 1 === 0 ? 0 : 2)} ${unit}`;
  };



  const getStockPercentage = (item: InventoryItem) => {
    return (item.availableQuantity / item.quantity) * 100;
  };

  const getUrgencyLevel = (item: InventoryItem) => {
    if (item.availableQuantity === 0) return 'critical';
    const ratio = item.availableQuantity / item.lowStockThreshold;
    if (ratio <= 0.3) return 'high';
    if (ratio <= 0.7) return 'medium';
    return 'low';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const exportAlerts = () => {
    const alertData = [...outOfStockItems, ...lowStockItems].map(item => ({
      name: item.name,
      // @ts-ignore
      category: item.category?.name || item.category,
      brand: item.brand || '',
      currentStock: item.availableQuantity,
      threshold: item.lowStockThreshold,
      unit: item.quantityUnit,
      status: item.availableQuantity === 0 ? 'Out of Stock' : 'Low Stock',
      urgency: getUrgencyLevel(item),
      value: formatAmount(item.quantity * item.unitPrice)
    }));

    const csvContent = [
      ['Name', 'Category', 'Brand', 'Current Stock', 'Threshold', 'Unit', 'Status', 'Urgency', 'Total Value'],
      ...alertData.map(item => Object.values(item))
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `low-stock-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalAlerts = filteredOutOfStockItems.length + filteredLowStockItems.length;
  const totalValue = [...filteredOutOfStockItems, ...filteredLowStockItems].reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice), 0
  );

  const stats: StatCard[] = [
    {
      icon: AlertTriangle,
      label: 'Total Alerts',
      value: totalAlerts,
      iconColor: 'bg-orange-100',
    },
    {
      icon: TrendingDown,
      label: 'Out of Stock',
      value: filteredOutOfStockItems.length,
      iconColor: 'bg-red-100',
    },
    {
      icon: Package,
      label: 'Low Stock',
      value: filteredLowStockItems.length,
      iconColor: 'bg-yellow-100',
    },
    {
      icon: BarChart3,
      label: 'Total Value',
      value: formatAmount(totalValue),
      iconColor: 'bg-blue-100',
    },
  ];

  const actions: ActionButton[] = [
    {
      icon: Download,
      label: 'Export',
      onClick: exportAlerts,
      variant: 'outline',
    },
  ];

  return (
    <ManagementLayout
      title="Low Stock Alerts"
      description="Monitor and manage inventory items that require attention"
      stats={stats}
      actions={actions}
      tableTitle="Stock Alerts"
      tableDescription="Manage items that are low in stock or out of stock"
    >
      {(lowStockLoading || outOfStockLoading) ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading stock alerts...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items, categories, or brands..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    // @ts-ignore
                    <SelectItem key={category?.name || category} value={category?.name || category}>
                      {/* @ts-ignore */}
                      {category?.name || category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgency">Urgency</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

      {/* Alert Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Alerts ({totalAlerts})</TabsTrigger>
          <TabsTrigger value="critical">Critical ({filteredOutOfStockItems.length})</TabsTrigger>
          <TabsTrigger value="low">Low Stock ({filteredLowStockItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {totalAlerts === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="mx-auto h-16 w-16 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold text-green-600 mb-2">All Items Well Stocked</h3>
                <p className="text-muted-foreground">No low stock alerts at this time.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Out of Stock Items */}
              {filteredOutOfStockItems.map((item: InventoryItem) => (
                <Card key={item.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <h3 className="font-semibold text-red-900">{item.name}</h3>
                          <Badge variant="destructive">Critical</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-muted-foreground">
                            {/* @ts-ignore */}
                            <strong>Category:</strong> {item.category?.name || item.category}
                          </span>
                          <span className="text-muted-foreground">
                            <strong>Brand:</strong> {item.brand || 'N/A'}
                          </span>
                          <span className="text-muted-foreground">
                            <strong>SKU:</strong> {item.sku}
                          </span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-lg font-bold text-red-600">
                          {formatQuantity(0, item.quantityUnit)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          of {formatQuantity(item.quantity, item.quantityUnit)}
                        </div>
                        <Progress value={0} className="w-24 h-2" />
                        <div className="text-xs text-muted-foreground">
                          Value: {formatAmount(item.quantity * item.unitPrice)}
                        </div>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/inventory/${item.id}`)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Low Stock Items */}
              {sortedLowStockItems.map((item) => {
                const urgency = getUrgencyLevel(item);
                const stockPercentage = getStockPercentage(item);

                return (
                  <Card key={item.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <TrendingDown className="h-5 w-5 text-orange-600" />
                            <h3 className="font-semibold text-orange-900">{item.name}</h3>
                            <Badge
                              variant="warning"
                              className={`capitalize ${getUrgencyColor(urgency)}`}
                            >
                              {urgency} Priority
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-muted-foreground">
                              {/* @ts-ignore */}
                              <strong>Category:</strong> {item.category?.name || item.category}
                            </span>
                            <span className="text-muted-foreground">
                              <strong>Brand:</strong> {item.brand || 'N/A'}
                            </span>
                            <span className="text-muted-foreground">
                              <strong>Threshold:</strong> {formatQuantity(item.lowStockThreshold, item.quantityUnit)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="text-lg font-bold text-orange-600">
                            {formatQuantity(item.availableQuantity, item.quantityUnit)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            of {formatQuantity(item.quantity, item.quantityUnit)}
                          </div>
                          <Progress value={stockPercentage} className="w-24 h-2" />
                          <div className="text-xs text-muted-foreground">
                            {stockPercentage.toFixed(1)}% remaining
                          </div>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/inventory/${item.id}`)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="critical" className="space-y-4">
          {outOfStockItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="mx-auto h-16 w-16 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold text-green-600 mb-2">No Critical Alerts</h3>
                <p className="text-muted-foreground">All items have stock available.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {outOfStockItems.map((item: InventoryItem) => (
                <Card key={item.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <h3 className="font-semibold text-red-900">{item.name}</h3>
                          <Badge variant="destructive">Out of Stock</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-muted-foreground">
                            {/* @ts-ignore */}
                            <strong>Category:</strong> {item.category?.name || item.category}
                          </span>
                          <span className="text-muted-foreground">
                            <strong>Value:</strong> {formatAmount(item.quantity * item.unitPrice)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-lg font-bold text-red-600">
                          {formatQuantity(0, item.quantityUnit)}
                        </div>
                        <Progress value={0} className="w-24 h-2" />
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/inventory/${item.id}`)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Restock
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="low" className="space-y-4">
          {lowStockItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="mx-auto h-16 w-16 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold text-green-600 mb-2">No Low Stock Alerts</h3>
                <p className="text-muted-foreground">All items are above their threshold levels.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedLowStockItems.map((item) => {
                const urgency = getUrgencyLevel(item);
                const stockPercentage = getStockPercentage(item);

                return (
                  <Card key={item.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <TrendingDown className="h-5 w-5 text-orange-600" />
                            <h3 className="font-semibold text-orange-900">{item.name}</h3>
                            <Badge
                              variant="warning"
                              className={`capitalize ${getUrgencyColor(urgency)}`}
                            >
                              {urgency} Priority
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-muted-foreground">
                              <strong>Threshold:</strong> {formatQuantity(item.lowStockThreshold, item.quantityUnit)}
                            </span>
                            <span className="text-muted-foreground">
                              <strong>Current:</strong> {formatQuantity(item.availableQuantity, item.quantityUnit)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="text-lg font-bold text-orange-600">
                            {stockPercentage.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">remaining</div>
                          <Progress value={stockPercentage} className="w-24 h-2" />
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/inventory/${item.id}`)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3 mr-1" />
                              Restock
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
        </div>
      )}
    </ManagementLayout>
  );
}
