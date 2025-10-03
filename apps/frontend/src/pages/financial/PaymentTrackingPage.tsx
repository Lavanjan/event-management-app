import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Send,
  Phone,
  Mail,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { DataTable } from '../../components/ui/data-table';
import { PageLayout } from '../../components/common/PageLayout';
// import { PageHeader } from '../../components/common/PageHeader';
import { PageLoading, ErrorState } from '../../components/forms/LoadingSpinner';
import { useBookingList, useOverdueBookings, useUpdatePaymentStatus } from '../../hooks/useBookings';
import { usePaymentSummary, useSendPaymentReminder } from '../../hooks/usePayments';
import { Booking, PaymentStatus } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { PaymentDetailsModal } from '../../components/modals/PaymentDetailsModal';
import { RecordPaymentModal } from '../../components/modals/RecordPaymentModal';
import { useToast } from '../../hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface PaymentFilters {
  page: number;
  limit: number;
  search?: string;
  paymentStatus?: PaymentStatus;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function PaymentTrackingPage() {
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: 20,
    sortBy: 'advanceDueDate',
    sortOrder: 'ASC',
  });

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isPaymentDetailsOpen, setIsPaymentDetailsOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  const { toast } = useToast();
  const { data: bookingData, isLoading, error, refetch } = useBookingList(filters);
  const updatePaymentStatus = useUpdatePaymentStatus();
  const sendReminder = useSendPaymentReminder();

  const bookings = bookingData?.data || [];
  const totalPages = bookingData ? Math.ceil(bookingData.total / filters.limit) : 0;

  // Action handlers
  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsPaymentDetailsOpen(true);
  };

  const handleRecordPayment = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsRecordPaymentOpen(true);
  };

  const handleSendReminder = async (booking: Booking) => {
    const amount = booking.paymentStatus === PaymentStatus.PENDING
      ? booking.advanceAmount
      : booking.balanceAmount;

    const dueDate = booking.paymentStatus === PaymentStatus.PENDING
      ? booking.advanceDueDate
      : booking.balanceDueDate;

    if (!amount || !dueDate) {
      toast({
        title: 'Cannot Send Reminder',
        description: 'Missing payment amount or due date information.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await sendReminder.mutateAsync({
        bookingId: booking.id,
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        eventName: booking.event?.name || 'Unknown Event',
        amount: Number(amount),
        dueDate: dueDate.toString(),
        type: booking.paymentStatus === PaymentStatus.PENDING ? 'advance' : 'balance',
        template: 'gentle',
      });

      toast({
        title: 'Reminder Sent',
        description: `Payment reminder sent to ${booking.customerEmail}`,
      });
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };

  const handleQuickStatusUpdate = async (booking: Booking) => {
    // Determine next logical status
    let nextStatus: PaymentStatus;

    switch (booking.paymentStatus) {
      case PaymentStatus.PENDING:
        nextStatus = PaymentStatus.ADVANCE_PAID;
        break;
      case PaymentStatus.ADVANCE_PAID:
        nextStatus = PaymentStatus.FULLY_PAID;
        break;
      case PaymentStatus.OVERDUE:
        nextStatus = PaymentStatus.ADVANCE_PAID;
        break;
      default:
        toast({
          title: 'Cannot Update Status',
          description: 'This booking is already fully paid or refunded.',
          variant: 'destructive',
        });
        return;
    }

    try {
      await updatePaymentStatus.mutateAsync({
        bookingId: booking.id,
        status: nextStatus,
      });

      toast({
        title: 'Status Updated',
        description: `Payment status updated to ${nextStatus.replace('_', ' ').toLowerCase()}`,
      });

      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleModalRefresh = () => {
    refetch();
  };

  // Calculate payment statistics
  const paymentStats = useMemo(() => {
    if (!bookings.length) return null;

    const pending = bookings.filter(b => b.paymentStatus === PaymentStatus.PENDING);
    const advancePaid = bookings.filter(b => b.paymentStatus === PaymentStatus.ADVANCE_PAID);
    const fullyPaid = bookings.filter(b => b.paymentStatus === PaymentStatus.FULLY_PAID);
    const overdue = bookings.filter(b => b.paymentStatus === PaymentStatus.OVERDUE);

    const totalPendingAmount = pending.reduce((sum, b) => sum + Number(b.advanceAmount || 0), 0);
    const totalBalanceAmount = advancePaid.reduce((sum, b) => sum + Number(b.balanceAmount || 0), 0);
    const totalOverdueAmount = overdue.reduce((sum, b) => sum + Number(b.balanceAmount || b.advanceAmount || 0), 0);

    return {
      pending: { count: pending.length, amount: totalPendingAmount },
      advancePaid: { count: advancePaid.length, amount: totalBalanceAmount },
      fullyPaid: { count: fullyPaid.length, amount: 0 },
      overdue: { count: overdue.length, amount: totalOverdueAmount },
    };
  }, [bookings]);

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const variants = {
      [PaymentStatus.PENDING]: { variant: 'secondary' as const, icon: Clock, text: 'Pending' },
      [PaymentStatus.ADVANCE_PAID]: { variant: 'default' as const, icon: CreditCard, text: 'Advance Paid' },
      [PaymentStatus.FULLY_PAID]: { variant: 'success' as const, icon: CheckCircle, text: 'Fully Paid' },
      [PaymentStatus.OVERDUE]: { variant: 'destructive' as const, icon: AlertTriangle, text: 'Overdue' },
      [PaymentStatus.REFUNDED]: { variant: 'outline' as const, icon: RefreshCw, text: 'Refunded' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const handlePaymentStatusUpdate = async (bookingId: string, newStatus: PaymentStatus) => {
    try {
      await updatePaymentStatus.mutateAsync({ id: bookingId, paymentStatus: newStatus });
      refetch();
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handlePaymentStatusFilter = (status?: PaymentStatus) => {
    setFilters(prev => ({ ...prev, paymentStatus: status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const columns = [
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }: any) => {
        const booking = row.original as Booking;
        return (
          <div>
            <div className="font-medium">{booking.customerName}</div>
            <div className="text-sm text-muted-foreground">{booking.customerEmail}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'event.name',
      header: 'Event',
      cell: ({ row }: any) => {
        const booking = row.original as Booking;
        return (
          <div>
            <div className="font-medium">{booking.event?.name || 'Unknown Event'}</div>
            <div className="text-sm text-muted-foreground">
              {booking.startDate ? format(new Date(booking.startDate), 'MMM dd, yyyy') : 'No date'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      cell: ({ row }: any) => {
        const booking = row.original as Booking;
        return (
          <div className="text-right">
            <div className="font-medium">${Number(booking.totalAmount || 0).toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">
              Advance: ${Number(booking.advanceAmount || 0).toFixed(2)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment Status',
      cell: ({ row }: any) => {
        const booking = row.original as Booking;
        return getPaymentStatusBadge(booking.paymentStatus);
      },
    },
    {
      accessorKey: 'advanceDueDate',
      header: 'Due Date',
      cell: ({ row }: any) => {
        const booking = row.original as Booking;
        const dueDate = booking.paymentStatus === PaymentStatus.ADVANCE_PAID 
          ? booking.balanceDueDate 
          : booking.advanceDueDate;
        
        if (!dueDate) return <span className="text-muted-foreground">No due date</span>;
        
        const isOverdue = new Date(dueDate) < new Date();
        return (
          <div className={cn(
            "text-sm",
            isOverdue && "text-destructive font-medium"
          )}>
            {format(new Date(dueDate), 'MMM dd, yyyy')}
            {isOverdue && (
              <div className="text-xs text-destructive">Overdue</div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const booking = row.original as Booking;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewDetails(booking)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRecordPayment(booking)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendReminder(booking)}>
                <Send className="h-4 w-4 mr-2" />
                Send Reminder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickStatusUpdate(booking)}>
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <PageLoading message="Loading payment data..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load payment data" onRetry={refetch} />;
  }

  return (
    <PageLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Tracking</h1>
          <p className="text-muted-foreground">Monitor and manage payment status for all bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Payment Statistics */}
      {paymentStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats.pending.count}</div>
              <p className="text-xs text-muted-foreground">
                ${Number(paymentStats.pending.amount || 0).toFixed(2)} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Advance Paid</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats.advancePaid.count}</div>
              <p className="text-xs text-muted-foreground">
                ${Number(paymentStats.advancePaid.amount || 0).toFixed(2)} balance due
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fully Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats.fullyPaid.count}</div>
              <p className="text-xs text-muted-foreground">
                Completed payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{paymentStats.overdue.count}</div>
              <p className="text-xs text-muted-foreground">
                ${Number(paymentStats.overdue.amount || 0).toFixed(2)} overdue
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by customer name or email..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={!filters.paymentStatus ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePaymentStatusFilter(undefined)}
              >
                All
              </Button>
              <Button
                variant={filters.paymentStatus === PaymentStatus.PENDING ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePaymentStatusFilter(PaymentStatus.PENDING)}
              >
                Pending
              </Button>
              <Button
                variant={filters.paymentStatus === PaymentStatus.OVERDUE ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePaymentStatusFilter(PaymentStatus.OVERDUE)}
              >
                Overdue
              </Button>
              <Button
                variant={filters.paymentStatus === PaymentStatus.ADVANCE_PAID ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePaymentStatusFilter(PaymentStatus.ADVANCE_PAID)}
              >
                Advance Paid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            Detailed view of all booking payments and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={bookings}
            isLoading={isLoading}
            pagination={{
              totalCount: bookingData?.total || 0,
              pageNumber: filters.page,
              pageSize: filters.limit,
            }}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <PaymentDetailsModal
        booking={selectedBooking}
        isOpen={isPaymentDetailsOpen}
        onClose={() => {
          setIsPaymentDetailsOpen(false);
          setSelectedBooking(null);
        }}
        onRefresh={handleModalRefresh}
      />

      <RecordPaymentModal
        booking={selectedBooking}
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setSelectedBooking(null);
        }}
        onSuccess={handleModalRefresh}
      />
    </PageLayout>
  );
}
