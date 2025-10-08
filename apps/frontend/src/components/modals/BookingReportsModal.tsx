// @ts-ignore
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar, User } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Booking } from '../../types';

interface BookingReportsModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}



const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function BookingReportsModal({ booking, isOpen, onClose }: BookingReportsModalProps) {
  const { formatAmount } = useCurrency();

  if (!booking) return null;

  const hasRevenues = booking.revenues && booking.revenues.length > 0;
  const hasExpenses = booking.expenses && booking.expenses.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Report
          </DialogTitle>
          <DialogDescription>
            Detailed revenue and expense breakdown for this booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{booking.customerName}</div>
                  <div className="text-sm text-muted-foreground">{booking.customerEmail}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{booking.event?.name || 'Event'}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(booking.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Total: {formatAmount(booking.totalAmount)}</div>
                  <div className="text-sm text-muted-foreground">
                    Advance: {formatAmount(booking.advanceAmount)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Revenue
                </Badge>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(booking.totalRevenues)}
              </div>
              <div className="text-sm text-muted-foreground">
                {booking.revenues?.length || 0} item(s)
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <Badge variant="outline" className="text-red-600 border-red-600">
                  Expenses
                </Badge>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatAmount(booking.totalExpenses)}
              </div>
              <div className="text-sm text-muted-foreground">
                {booking.expenses?.length || 0} item(s)
              </div>
            </div>

            <div className={`p-4 border rounded-lg ${
              booking.profitLoss >= 0 
                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <DollarSign className={`h-5 w-5 ${booking.profitLoss >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                <Badge variant={booking.profitLoss >= 0 ? 'default' : 'destructive'}>
                  {booking.profitLoss >= 0 ? 'Profit' : 'Loss'}
                </Badge>
              </div>
              <div className={`text-2xl font-bold ${booking.profitLoss >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatAmount(Math.abs(booking.profitLoss))}
              </div>
              <div className="text-sm text-muted-foreground">
                Net {booking.profitLoss >= 0 ? 'profit' : 'loss'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenues Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-600">
                  Revenues ({booking.revenues?.length || 0})
                </h3>
              </div>

              {hasRevenues ? (
                <div className="space-y-3">
                  {booking.revenues?.map((revenue, index) => (
                    <div key={revenue.id || index} className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-green-800 dark:text-green-200">
                            {revenue.name}
                          </h4>
                          {revenue.category && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {revenue.category}
                            </Badge>
                          )}
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatAmount(revenue.amount)}
                        </div>
                      </div>
                      {revenue.description && (
                        <p className="text-sm text-muted-foreground">
                          {revenue.description}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        Added on {formatDate(revenue.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div className="text-sm">No revenues recorded</div>
                  <div className="text-xs">Revenue items will appear here when added</div>
                </div>
              )}
            </div>

            {/* Expenses Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-600">
                  Expenses ({booking.expenses?.length || 0})
                </h3>
              </div>

              {hasExpenses ? (
                <div className="space-y-3">
                  {booking.expenses?.map((expense, index) => (
                    <div key={expense.id || index} className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-red-800 dark:text-red-200">
                            {expense.name}
                          </h4>
                          {expense.category && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {expense.category}
                            </Badge>
                          )}
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          {formatAmount(expense.amount)}
                        </div>
                      </div>
                      {expense.description && (
                        <p className="text-sm text-muted-foreground">
                          {expense.description}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        Added on {formatDate(expense.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div className="text-sm">No expenses recorded</div>
                  <div className="text-xs">Expense items will appear here when added</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
