import React from 'react';
import { AlertTriangle, Package, TrendingDown, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { InventoryItem } from '../../types';

interface LowStockAlertsProps {
  lowStockItems: InventoryItem[];
  outOfStockItems: InventoryItem[];
  onItemClick?: (item: InventoryItem) => void;
  onDismiss?: () => void;
  className?: string;
}

export function LowStockAlerts({
  lowStockItems = [],
  outOfStockItems = [],
  onItemClick,
  onDismiss,
  className,
}: LowStockAlertsProps) {
  const totalAlerts = lowStockItems.length + outOfStockItems.length;

  if (totalAlerts === 0) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStockPercentage = (item: InventoryItem) => {
    return Math.round((item.availableQuantity / item.quantity) * 100);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg">Stock Alerts</CardTitle>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          {totalAlerts} item{totalAlerts !== 1 ? 's' : ''} require{totalAlerts === 1 ? 's' : ''} attention
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Out of Stock Items */}
        {outOfStockItems.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <h4 className="font-medium text-red-700">Out of Stock ({outOfStockItems.length})</h4>
            </div>
            <div className="space-y-2">
              {outOfStockItems.map((item) => (
                <Alert key={item.id} className="border-red-200 bg-red-50">
                  <AlertDescription>
                    <div 
                      className={`flex items-center justify-between ${
                        onItemClick ? 'cursor-pointer hover:bg-red-100 p-2 rounded' : ''
                      }`}
                      onClick={() => onItemClick?.(item)}
                    >
                      <div className="flex items-center space-x-3">
                        <Package className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="font-medium text-red-800">{item.name}</p>
                          <p className="text-sm text-red-600">
                            {item.category && `${item.category} • `}
                            0 {item.quantityUnit} available
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">Out of Stock</Badge>
                        <p className="text-xs text-red-600 mt-1">
                          Value: {formatCurrency(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Separator if both types exist */}
        {outOfStockItems.length > 0 && lowStockItems.length > 0 && (
          <Separator />
        )}

        {/* Low Stock Items */}
        {lowStockItems.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h4 className="font-medium text-orange-700">Low Stock ({lowStockItems.length})</h4>
            </div>
            <div className="space-y-2">
              {lowStockItems.map((item) => {
                const stockPercentage = getStockPercentage(item);
                return (
                  <Alert key={item.id} className="border-orange-200 bg-orange-50">
                    <AlertDescription>
                      <div 
                        className={`flex items-center justify-between ${
                          onItemClick ? 'cursor-pointer hover:bg-orange-100 p-2 rounded' : ''
                        }`}
                        onClick={() => onItemClick?.(item)}
                      >
                        <div className="flex items-center space-x-3">
                          <Package className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="font-medium text-orange-800">{item.name}</p>
                            <p className="text-sm text-orange-600">
                              {item.category && `${item.category} • `}
                              {item.availableQuantity} {item.quantityUnit} available
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="w-16 h-1.5 bg-orange-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-orange-500 transition-all duration-300"
                                  style={{ width: `${stockPercentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-orange-600">{stockPercentage}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="warning">Low Stock</Badge>
                          <p className="text-xs text-orange-600 mt-1">
                            Threshold: {item.lowStockThreshold} {item.quantityUnit}
                          </p>
                          <p className="text-xs text-orange-600">
                            Value: {formatCurrency(item.availableQuantity * item.unitPrice)}
                          </p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Total items requiring attention: {totalAlerts}
          </span>
          <div className="flex space-x-4">
            {outOfStockItems.length > 0 && (
              <span className="text-red-600 font-medium">
                {outOfStockItems.length} out of stock
              </span>
            )}
            {lowStockItems.length > 0 && (
              <span className="text-orange-600 font-medium">
                {lowStockItems.length} low stock
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
