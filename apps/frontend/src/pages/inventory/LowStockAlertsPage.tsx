import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  Bell, 
  Settings, 
  RefreshCw, 
  Filter, 
  Search, 
  Download,
  ArrowLeft,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { InventoryItem } from '../../types';

// Mock data for demonstration
const mockLowStockItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Professional Sound System',
    description: 'High-quality sound system for events',
    category: 'Audio Equipment',
    brand: 'Bose',
    sku: 'BSE-001',
    quantity: 50,
    availableQuantity: 8,
    quantityUnit: 'pieces',
    unitPrice: 150,
    lowStockThreshold: 10,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-09-29'),
  },
  {
    id: '2',
    name: 'LED Stage Lights',
    description: 'Colorful LED lights for stage decoration',
    category: 'Lighting',
    brand: 'Philips',
    sku: 'PHL-002',
    quantity: 100,
    availableQuantity: 5,
    quantityUnit: 'pieces',
    unitPrice: 75,
    lowStockThreshold: 15,
    isActive: true,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-09-29'),
  },
  {
    id: '3',
    name: 'Catering Tables',
    description: 'Round tables for dining events',
    category: 'Furniture',
    brand: 'EventPro',
    sku: 'EP-003',
    quantity: 30,
    availableQuantity: 0,
    quantityUnit: 'pieces',
    unitPrice: 25,
    lowStockThreshold: 5,
    isActive: true,
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-09-29'),
  },
  {
    id: '4',
    name: 'Decorative Flowers',
    description: 'Fresh flowers for event decoration',
    category: 'Decoration',
    brand: 'FloralCo',
    sku: 'FC-004',
    quantity: 20.5,
    availableQuantity: 2.5,
    quantityUnit: 'kg',
    unitPrice: 12,
    lowStockThreshold: 5,
    isActive: true,
    createdAt: new Date('2024-04-12'),
    updatedAt: new Date('2024-09-29'),
  },
  {
    id: '5',
    name: 'Wine Glasses',
    description: 'Crystal wine glasses for formal events',
    category: 'Tableware',
    brand: 'Crystal Co',
    sku: 'CC-005',
    quantity: 200,
    availableQuantity: 12,
    quantityUnit: 'pieces',
    unitPrice: 8,
    lowStockThreshold: 20,
    isActive: true,
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-09-29'),
  },
];

export function LowStockAlertsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('urgency');
  const [isLoading, setIsLoading] = useState(false);

  const items = mockLowStockItems;

  // Filter and sort items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = filteredItems.filter(item => 
    item.availableQuantity <= item.lowStockThreshold && item.availableQuantity > 0
  );
  
  const outOfStockItems = filteredItems.filter(item => item.availableQuantity === 0);

  // Sort items based on urgency
  const sortedLowStockItems = [...lowStockItems].sort((a, b) => {
    if (sortBy === 'urgency') {
      const aUrgency = a.availableQuantity / a.lowStockThreshold;
      const bUrgency = b.availableQuantity / b.lowStockThreshold;
      return aUrgency - bUrgency;
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
    }
    return 0;
  });

  const categories = Array.from(new Set(items.map(item => item.category)));

  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity.toFixed(quantity % 1 === 0 ? 0 : 2)} ${unit}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      category: item.category,
      brand: item.brand || '',
      currentStock: item.availableQuantity,
      threshold: item.lowStockThreshold,
      unit: item.quantityUnit,
      status: item.availableQuantity === 0 ? 'Out of Stock' : 'Low Stock',
      urgency: getUrgencyLevel(item),
      value: formatCurrency(item.quantity * item.unitPrice)
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

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const totalAlerts = outOfStockItems.length + lowStockItems.length;
  const totalValue = [...outOfStockItems, ...lowStockItems].reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice), 0
  );

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
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
              <Bell className="h-8 w-8 text-orange-500" />
              <span>Low Stock Alerts</span>
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage inventory items that require attention
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportAlerts}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {outOfStockItems.length} critical, {lowStockItems.length} low stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Immediate attention required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Restock recommended</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Affected inventory value</p>
          </CardContent>
        </Card>
      </div>

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
                  <SelectItem key={category} value={category}>
                    {category}
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
          <TabsTrigger value="critical">Critical ({outOfStockItems.length})</TabsTrigger>
          <TabsTrigger value="low">Low Stock ({lowStockItems.length})</TabsTrigger>
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
              {outOfStockItems.map((item) => (
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
                            <strong>Category:</strong> {item.category}
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
                          Value: {formatCurrency(item.quantity * item.unitPrice)}
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
                              <strong>Category:</strong> {item.category}
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
              {outOfStockItems.map((item) => (
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
                            <strong>Category:</strong> {item.category}
                          </span>
                          <span className="text-muted-foreground">
                            <strong>Value:</strong> {formatCurrency(item.quantity * item.unitPrice)}
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
  );
}
