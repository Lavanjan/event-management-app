import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  createStatusColumn,
  createDateColumn,
  createActionsColumn,
  ActionHandlers,
  statusVariants
} from '../common/DataTableColumns';
import { Calendar, User, Mail, Phone, TrendingUp, TrendingDown } from 'lucide-react';

// Booking interface (should match your types)
export interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'advance_paid' | 'fully_paid' | 'overdue' | 'refunded';
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  advanceDueDate: Date | string;
  balanceDueDate: Date | string;
  totalExpenses: number;
  totalRevenues: number;
  profitLoss: number;
  notes?: string;
  event?: {
    id: string;
    name: string;
    eventDate: Date | string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const createBookingColumns = (handlers: ActionHandlers<Booking>, formatAmount?: (amount: number) => string): ColumnDef<Booking>[] => [
  // Customer Information
  {
    accessorKey: 'customerName',
    header: 'Customer',
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">{booking.customerName}</p>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{booking.customerEmail}</span>
            </div>
            {booking.customerPhone && (
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{booking.customerPhone}</span>
              </div>
            )}
          </div>
        </div>
      );
    },
  },

  // Event Information
  {
    accessorKey: 'event.name',
    header: 'Event',
    cell: ({ row }) => {
      const booking = row.original;
      if (!booking.event) return <span className="text-muted-foreground">—</span>;
      
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium truncate">{booking.event.name}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(booking.event.eventDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      );
    },
  },

  // Status
  // @ts-ignore
  createStatusColumn<Booking>('status', 'Status', {
    statusMap: {
      pending: { label: 'Pending', variant: 'pending' },
      confirmed: { label: 'Confirmed', variant: 'completed' },
      cancelled: { label: 'Cancelled', variant: 'cancelled' },
      completed: { label: 'Completed', variant: 'completed' },
    },
  }),

  // Payment Status with Progress
  {
    accessorKey: 'paymentStatus',
    header: 'Payment',
    cell: ({ row }) => {
      const booking = row.original;
      const paymentProgress = (booking.advanceAmount + (booking.totalAmount - booking.balanceAmount)) / booking.totalAmount * 100;
      
      const getPaymentStatusConfig = () => {
        switch (booking.paymentStatus) {
          case 'pending':
            return { label: 'Pending', variant: 'destructive' as const };
          case 'advance_paid':
            return { label: 'Advance Paid', variant: 'warning' as const };
          case 'fully_paid':
            return { label: 'Fully Paid', variant: 'success' as const };
          case 'overdue':
            return { label: 'Overdue', variant: 'destructive' as const };
          case 'refunded':
            return { label: 'Refunded', variant: 'secondary' as const };
          default:
            return { label: 'Unknown', variant: 'secondary' as const };
        }
      };

      const statusConfig = getPaymentStatusConfig();

      return (
        <div className="space-y-2">
          <Badge variant={(statusVariants as any)[statusConfig.variant] as any}>
            {statusConfig.label}
          </Badge>
          <div className="space-y-1">
            <Progress value={paymentProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {formatAmount ? formatAmount(booking.advanceAmount + (booking.totalAmount - booking.balanceAmount)) : `$${booking.advanceAmount + (booking.totalAmount - booking.balanceAmount)}`} / {formatAmount ? formatAmount(booking.totalAmount) : `$${booking.totalAmount}`}
            </p>
          </div>
        </div>
      );
    },
  },

  // Financial Summary
  {
    accessorKey: 'totalAmount',
    header: 'Amount',
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <div className="text-right space-y-1">
          <div className="font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(booking.totalAmount)}
          </div>
          <div className="text-xs text-muted-foreground">
            Advance: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(booking.advanceAmount)}
          </div>
          <div className="text-xs text-muted-foreground">
            Balance: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(booking.balanceAmount)}
          </div>
        </div>
      );
    },
  },

  // Profit/Loss
  {
    accessorKey: 'profitLoss',
    header: 'P&L',
    cell: ({ row }) => {
      const booking = row.original;
      const isProfit = booking.profitLoss >= 0;
      
      return (
        <div className="text-right space-y-1">
          <div className={`font-medium flex items-center justify-end space-x-1 ${
            isProfit ? 'text-green-600' : 'text-red-600'
          }`}>
            {isProfit ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>
              {formatAmount ? formatAmount(Math.abs(booking.profitLoss)) : new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(Math.abs(booking.profitLoss))}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Rev: {formatAmount ? formatAmount(booking.totalRevenues) : new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(booking.totalRevenues)}
          </div>
          <div className="text-xs text-muted-foreground">
            Exp: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(booking.totalExpenses)}
          </div>
        </div>
      );
    },
  },

  // Due Dates
  {
    accessorKey: 'advanceDueDate',
    header: 'Due Dates',
    cell: ({ row }) => {
      const booking = row.original;
      const now = new Date();
      const advanceDue = new Date(booking.advanceDueDate);
      const balanceDue = new Date(booking.balanceDueDate);
      
      const isAdvanceOverdue = booking.paymentStatus === 'pending' && now > advanceDue;
      const isBalanceOverdue = booking.paymentStatus === 'advance_paid' && now > balanceDue;
      
      return (
        <div className="space-y-1 text-sm">
          <div className={`${isAdvanceOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            Advance: {advanceDue.toLocaleDateString()}
          </div>
          <div className={`${isBalanceOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            Balance: {balanceDue.toLocaleDateString()}
          </div>
        </div>
      );
    },
  },

  // Created Date
  createDateColumn<Booking>('createdAt', 'Created', { showTime: true }),

  // Actions
  createActionsColumn<Booking>(handlers),
];
