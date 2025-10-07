import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Edit3,
  Trash2,
  Download,
  BarChart3,
} from 'lucide-react';
import { Booking } from '../../types';
import { format } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { useCurrency } from '../../contexts/CurrencyContext';
import { api } from '../../services/api';
import { useInventoryList } from '../../hooks/useInventory';

interface BookingDetailsModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onBookingUpdated?: () => void;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  description?: string;
  createdAt: string;
}

interface Revenue {
  id: string;
  name: string;
  amount: number;
  category: string;
  description?: string;
  createdAt: string;
}

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onBookingUpdated,
}: BookingDetailsModalProps) {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const [expenses, setExpenses] = useState<Expense[]>(booking.expenses || []);
  const [revenues, setRevenues] = useState<Revenue[]>(booking.revenues || []);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddRevenue, setShowAddRevenue] = useState(false);

  // Expense type toggle state
  const [expenseType, setExpenseType] = useState<'inventory' | 'other'>('other');

  // Expense form state - Other expenses
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  // Expense form state - Inventory expenses
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [inventoryQuantity, setInventoryQuantity] = useState(1);

  // Fetch inventory items for inventory expenses
  const { data: inventoryData } = useInventoryList({ limit: 100 });
  const inventoryItems = inventoryData?.data || [];

  // Revenue form state
  const [revenueName, setRevenueName] = useState('');
  const [revenueAmount, setRevenueAmount] = useState('');
  const [revenueDescription, setRevenueDescription] = useState('');

  // Sync local state with booking prop when it changes
  useEffect(() => {
    setExpenses(booking.expenses || []);
    setRevenues(booking.revenues || []);
  }, [booking.id, booking.expenses, booking.revenues]);

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalRevenues = revenues.reduce((sum, rev) => sum + Number(rev.amount), 0);
  const profitLoss = totalRevenues - totalExpenses;

  const handleAddExpense = async () => {
    if (expenseType === 'other') {
      // Validate other expense fields
      if (!expenseName || !expenseAmount) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in expense name and amount',
          variant: 'destructive',
        });
        return;
      }

      try {
        const response = await api.post(`/bookings/${booking.id}/expenses`, {
          name: expenseName,
          amount: parseFloat(expenseAmount),
          category: expenseCategory || 'General',
          description: expenseDescription,
        });

        // Backend returns the full updated booking, so update expenses from it
        const updatedBooking = response.data.data;
        setExpenses(updatedBooking.expenses || []);
        resetExpenseForm();

        toast({
          title: 'Success',
          description: 'Expense added successfully',
        });

        onBookingUpdated?.();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to add expense',
          variant: 'destructive',
        });
      }
    } else {
      // Handle inventory expense
      if (!selectedInventoryId || inventoryQuantity <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please select an inventory item and specify quantity',
          variant: 'destructive',
        });
        return;
      }

      const selectedItem = inventoryItems.find(item => item.id === selectedInventoryId);
      if (!selectedItem) {
        toast({
          title: 'Error',
          description: 'Selected inventory item not found',
          variant: 'destructive',
        });
        return;
      }

      try {
        const totalAmount = selectedItem.unitPrice * inventoryQuantity;
        const response = await api.post(`/bookings/${booking.id}/expenses`, {
          name: `Inventory: ${selectedItem.name}`,
          amount: totalAmount,
          category: 'Inventory',
          description: `${inventoryQuantity} ${selectedItem.quantityUnit} @ $${selectedItem.unitPrice} each`,
        });

        // Backend returns the full updated booking, so update expenses from it
        const updatedBooking = response.data.data;
        setExpenses(updatedBooking.expenses || []);
        resetExpenseForm();

        toast({
          title: 'Success',
          description: 'Inventory expense added successfully',
        });

        onBookingUpdated?.();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to add inventory expense',
          variant: 'destructive',
        });
      }
    }
  };

  const resetExpenseForm = () => {
    setExpenseName('');
    setExpenseAmount('');
    setExpenseCategory('');
    setExpenseDescription('');
    setSelectedInventoryId('');
    setInventoryQuantity(1);
    setShowAddExpense(false);
  };

  const handleAddRevenue = async () => {
    if (!revenueName || !revenueAmount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in revenue name and amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.post(`/bookings/${booking.id}/revenues`, {
        name: revenueName,
        amount: parseFloat(revenueAmount),
        description: revenueDescription,
      });

      // Backend returns the full updated booking, so update revenues from it
      const updatedBooking = response.data.data;
      setRevenues(updatedBooking.revenues || []);
      setRevenueName('');
      setRevenueAmount('');
      setRevenueDescription('');
      setShowAddRevenue(false);

      toast({
        title: 'Success',
        description: 'Revenue added successfully',
      });

      onBookingUpdated?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add revenue',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await api.delete(`/bookings/${booking.id}/expenses/${expenseId}`);
      setExpenses(expenses.filter(exp => exp.id !== expenseId));

      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
      });

      onBookingUpdated?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete expense',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRevenue = async (revenueId: string) => {
    try {
      await api.delete(`/bookings/${booking.id}/revenues/${revenueId}`);
      setRevenues(revenues.filter(rev => rev.id !== revenueId));

      toast({
        title: 'Success',
        description: 'Revenue deleted successfully',
      });

      onBookingUpdated?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete revenue',
        variant: 'destructive',
      });
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Booking Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                <p className="font-medium">{booking.customerName}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {booking.customerEmail}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Phone</Label>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {booking.customerPhone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Event & Booking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event & Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Event</Label>
                <p className="font-medium">{booking.event?.name}</p>
                <p className="text-sm text-muted-foreground">{booking.event?.location}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Duration Type</Label>
                <Badge variant="outline" className="mt-1">
                  {booking.durationType?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              {booking.startDate && (
                <div>
                  <Label className="text-sm text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{format(new Date(booking.startDate), 'PPP p')}</p>
                </div>
              )}
              {booking.endDate && (
                <div>
                  <Label className="text-sm text-muted-foreground">End Date</Label>
                  <p className="font-medium">{format(new Date(booking.endDate), 'PPP p')}</p>
                </div>
              )}
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <Badge>{booking.status}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Payment Status</Label>
                <div className="mt-1">
                  <Badge variant="secondary">{booking.paymentStatus}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="text-xl font-bold">
                  {formatAmount(Number(booking.totalAmount))}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Advance Paid:</span>
                <span className="font-semibold text-green-600">
                  {formatAmount(Number(booking.advanceAmount))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Balance Due:</span>
                <span className="font-semibold text-orange-600">
                  {formatAmount(Number(booking.balanceAmount))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Allocations */}
          {booking.inventoryAllocations && booking.inventoryAllocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Inventory Allocations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {booking.inventoryAllocations.map((allocation: any) => (
                    <div
                      key={allocation.id}
                      className="flex justify-between items-center p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{allocation.inventoryItem?.name || 'Item'}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {allocation.quantity} ×{' '}
                          {formatAmount(Number(allocation.unitPrice))}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatAmount(Number(allocation.totalPrice))}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Summary */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Total Revenues</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {formatAmount(totalRevenues)}
                  </p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-sm font-medium">Total Expenses</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {formatAmount(totalExpenses)}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    profitLoss >= 0
                      ? 'bg-green-50 dark:bg-green-950/20'
                      : 'bg-orange-50 dark:bg-orange-950/20'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 mb-2 ${
                      profitLoss >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm font-medium">Profit/Loss</span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      profitLoss >= 0
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {profitLoss >= 0 ? '+' : ''}
                    {formatAmount(profitLoss)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Expenses
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddExpense(!showAddExpense)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Expense
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Inventory allocations are automatically added as expenses
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddExpense && (
                <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                  {/* Expense Type Toggle */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Expense Type</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="expenseType"
                          checked={expenseType === 'other'}
                          onChange={() => setExpenseType('other')}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Other Expenses</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="expenseType"
                          checked={expenseType === 'inventory'}
                          onChange={() => setExpenseType('inventory')}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Inventory Expenses</span>
                      </label>
                    </div>
                  </div>

                  {/* Other Expenses Form */}
                  {expenseType === 'other' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Expense Name *</Label>
                        <Input
                          value={expenseName}
                          onChange={e => setExpenseName(e.target.value)}
                          placeholder="e.g., Catering"
                        />
                      </div>
                      <div>
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={expenseAmount}
                          onChange={e => setExpenseAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Description (Optional)</Label>
                        <Input
                          value={expenseDescription}
                          onChange={e => setExpenseDescription(e.target.value)}
                          placeholder="Optional details"
                        />
                      </div>
                    </div>
                  )}

                  {/* Inventory Expenses Form */}
                  {expenseType === 'inventory' && (
                    <div className="space-y-3">
                      <div>
                        <Label>Inventory Item *</Label>
                        <Select value={selectedInventoryId} onValueChange={setSelectedInventoryId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select inventory item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} - ${item.unitPrice} ({item.availableQuantity} {item.quantityUnit} available)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={inventoryQuantity}
                            onChange={e => setInventoryQuantity(parseInt(e.target.value) || 1)}
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <Label>Unit Type</Label>
                          <Input
                            value={inventoryItems.find(item => item.id === selectedInventoryId)?.quantityUnit || 'pieces'}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                      </div>
                      {selectedInventoryId && (
                        <div className="p-3 bg-accent rounded-lg">
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span>Unit Price:</span>
                              <span>${inventoryItems.find(item => item.id === selectedInventoryId)?.unitPrice || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Quantity:</span>
                              <span>{inventoryQuantity}</span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-1 mt-1">
                              <span>Total Amount:</span>
                              <span>${((inventoryItems.find(item => item.id === selectedInventoryId)?.unitPrice || 0) * inventoryQuantity).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleAddExpense} size="sm">
                      Save Expense
                    </Button>
                    <Button
                      onClick={resetExpenseForm}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No expenses added yet</p>
              ) : (
                <div className="space-y-2">
                  {expenses.map(expense => (
                    <div
                      key={expense.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{expense.name}</p>
                          {expense.category && (
                            <Badge variant="outline" className="text-xs">
                              {expense.category}
                            </Badge>
                          )}
                        </div>
                        {expense.description && (
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-red-600">
                          -{formatAmount(Number(expense.amount))}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenues Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Revenues
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddRevenue(!showAddRevenue)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Revenue
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Booking fee is automatically added as revenue
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddRevenue && (
                <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Revenue Name *</Label>
                      <Input
                        value={revenueName}
                        onChange={e => setRevenueName(e.target.value)}
                        placeholder="e.g., Photography Package"
                      />
                    </div>
                    <div>
                      <Label>Amount *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={revenueAmount}
                        onChange={e => setRevenueAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description (Optional)</Label>
                      <Input
                        value={revenueDescription}
                        onChange={e => setRevenueDescription(e.target.value)}
                        placeholder="Optional details"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddRevenue} size="sm">
                      Save Revenue
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddRevenue(false);
                        setRevenueName('');
                        setRevenueAmount('');
                        setRevenueDescription('');
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {revenues.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No revenues added yet</p>
              ) : (
                <div className="space-y-2">
                  {revenues.map(revenue => (
                    <div
                      key={revenue.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{revenue.name}</p>
                          {revenue.category && (
                            <Badge variant="outline" className="text-xs">
                              {revenue.category}
                            </Badge>
                          )}
                        </div>
                        {revenue.description && (
                          <p className="text-sm text-muted-foreground">{revenue.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-green-600">
                          +{formatAmount(Number(revenue.amount))}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRevenue(revenue.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {booking.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{booking.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
