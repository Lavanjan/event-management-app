import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  BookOpen,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  TrendingUp,

  Calendar,
  DollarSign,
  ArrowUpDown,
  Eye,
  FileText,
  BarChart3,
  Play,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { DataTable } from '../../components/ui/data-table';
import { DataTableFacetedFilter } from '../../components/ui/data-table-faceted-filter';
import { BookingStatus, PaymentStatus, Booking } from '../../types';
import { format } from 'date-fns';
import { useBookingList, useStartBooking, useCompleteBooking } from '../../hooks/useBookings';
import CreateBookingDialog from '../../components/modals/CreateBookingDialog';
import EditBookingDialog from '../../components/modals/EditBookingDialog';
import { BookingDetailsModal } from '../../components/modals/BookingDetailsModal';
import { BookingReportsModal } from '../../components/modals/BookingReportsModal';
import { DocumentManager } from '../../components/documents';
// @ts-ignore
import { useToast } from '../../hooks/use-toast';
import { useCurrency } from '../../contexts/CurrencyContext';
import { ManagementLayout, StatCard, ActionButton } from '../../components/layout/ManagementLayout';

interface BookingFilters {
  page: number;
  limit: number;
  search?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}



const getStatusBadgeVariant = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return 'default';
    case BookingStatus.PENDING:
      return 'secondary';
    case BookingStatus.STARTED:
      return 'secondary';
    case BookingStatus.COMPLETED:
      return 'default';
    case BookingStatus.CANCELLED:
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getPaymentStatusBadgeVariant = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.FULLY_PAID:
      return 'default';
    case PaymentStatus.ADVANCE_PAID:
      return 'secondary';
    case PaymentStatus.PENDING:
      return 'outline';
    case PaymentStatus.OVERDUE:
      return 'destructive';
    case PaymentStatus.REFUNDED:
      return 'secondary';
    default:
      return 'outline';
  }
};

// Filter options
const statusOptions = [
  {
    label: 'Pending',
    value: BookingStatus.PENDING,
    icon: AlertCircle,
  },
  {
    label: 'Confirmed',
    value: BookingStatus.CONFIRMED,
    icon: CheckCircle,
  },
  {
    label: 'Started',
    value: BookingStatus.STARTED,
    icon: Play,
  },
  {
    label: 'Completed',
    value: BookingStatus.COMPLETED,
    icon: CheckCircle,
  },
  {
    label: 'Cancelled',
    value: BookingStatus.CANCELLED,
    icon: XCircle,
  },
];

const paymentStatusOptions = [
  {
    label: 'Pending',
    value: PaymentStatus.PENDING,
    icon: AlertCircle,
  },
  {
    label: 'Advance Paid',
    value: PaymentStatus.ADVANCE_PAID,
    icon: DollarSign,
  },
  {
    label: 'Fully Paid',
    value: PaymentStatus.FULLY_PAID,
    icon: CheckCircle,
  },
  {
    label: 'Overdue',
    value: PaymentStatus.OVERDUE,
    icon: XCircle,
  },
  {
    label: 'Refunded',
    value: PaymentStatus.REFUNDED,
    icon: RefreshCw,
  },
];

// Filters Toolbar Component
interface BookingFiltersToolbarProps {
  filters: BookingFilters;
  onSearchChange: (search: string) => void;
  onStatusChange: (values: string[]) => void;
  onPaymentStatusChange: (values: string[]) => void;
  onResetFilters: () => void;
}

function BookingFiltersToolbar({
  filters,
  onSearchChange,
  onStatusChange,
  onPaymentStatusChange,
  onResetFilters,
}: BookingFiltersToolbarProps) {
  const hasActiveFilters = filters.search || filters.status || filters.paymentStatus;

  return (
    <div className="flex flex-col lg:flex-row w-full items-start space-y-2 mb-2 lg:mb-0 lg:space-x-2 lg:space-y-0">
      {/* Search Input */}
      <div className="relative w-full lg:w-[250px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search bookings..."
          value={filters.search || ''}
          onChange={e => onSearchChange(e.target.value)}
          className="h-8 pl-10"
        />
      </div>

      {/* Status Filter */}
      <DataTableFacetedFilter
        title="Status"
        multiSelect={false}
        options={statusOptions}
        selectedValues={filters.status ? [filters.status] : []}
        onFilterChange={onStatusChange}
      />

      {/* Payment Status Filter */}
      <DataTableFacetedFilter
        title="Payment Status"
        multiSelect={false}
        options={paymentStatusOptions}
        selectedValues={filters.paymentStatus ? [filters.paymentStatus] : []}
        onFilterChange={onPaymentStatusChange}
      />

      {/* Reset Filters Button */}
      {hasActiveFilters && (
        <Button variant="ghost" className="h-8 px-2 lg:px-3" onClick={onResetFilters}>
          Reset
          <XCircle className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Table columns definition
const createColumns = (
  onBookingUpdated: () => void,
  onViewDetails: (booking: Booking) => void,
  onOpenReports: (booking: Booking) => void,
  onStartEvent: (booking: Booking) => void,
  onCompleteEvent: (booking: Booking) => void,
  formatAmount: (amount: number) => string
): ColumnDef<Booking>[] => [
  {
    accessorKey: 'customerName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{booking.customerName}</div>
          <div className="text-sm text-muted-foreground">{booking.customerEmail}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'event',
    header: 'Event',
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{booking.event?.name}</div>
          <div className="text-sm text-muted-foreground">{booking.event?.location}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{formatAmount(booking.totalAmount)}</div>
          <div className="text-sm text-muted-foreground">
            Advance: {formatAmount(booking.advanceAmount)}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as BookingStatus;
      return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Payment',
    cell: ({ row }) => {
      const status = row.getValue('paymentStatus') as PaymentStatus;
      return (
        <Badge variant={getPaymentStatusBadgeVariant(status)}>{status.replace('_', ' ')}</Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date;
      return (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          {format(new Date(date), 'MMM dd, yyyy')}
        </div>
      );
    },
  },
  {
    accessorKey: 'reports',
    header: 'Reports',
    cell: ({ row }) => {
      const booking = row.original;
      // Reports only available for completed events
      const isCompleted = booking.status === BookingStatus.COMPLETED;
      const hasData = isCompleted && ((booking.expenses && booking.expenses.length > 0) || (booking.revenues && booking.revenues.length > 0));

      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onOpenReports(booking)}
            disabled={!isCompleted}
            title={!isCompleted ? 'Reports available only for completed events' : hasData ? 'View financial reports' : 'No financial data available'}
          >
            <BarChart3 className={`h-4 w-4 ${isCompleted ? (hasData ? 'text-primary' : 'text-muted-foreground') : 'text-gray-300'}`} />
          </Button>
        </div>
      );
    },
  },
  {
    id: 'documents',
    header: 'Documents',
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <div className="flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Manage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Documents - {booking.customerName}</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">
                <DocumentManager
                  entityType="booking"
                  entityId={booking.id}
                  title="Booking Documents"
                  description="Upload and manage documents related to this booking (invoices, contracts, receipts, etc.)"
                  allowUpload={true}
                  showFilters={true}
                  className="h-full"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewDetails(booking)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <EditBookingDialog booking={booking} onBookingUpdated={onBookingUpdated} />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {booking.status === BookingStatus.CONFIRMED && (
              <DropdownMenuItem onClick={() => onStartEvent(booking)}>
                <Play className="mr-2 h-4 w-4" />
                Start Event
              </DropdownMenuItem>
            )}
            {booking.status === BookingStatus.STARTED && (
              <DropdownMenuItem onClick={() => onCompleteEvent(booking)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Event
              </DropdownMenuItem>
            )}
            {booking.status !== BookingStatus.COMPLETED && booking.status !== BookingStatus.CANCELLED && (
              <DropdownMenuItem className="text-destructive">
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Booking
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function BookingListPage() {

  const { formatAmount } = useCurrency();
  const [filters, setFilters] = useState<BookingFilters>({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBookingForReports, setSelectedBookingForReports] = useState<Booking | null>(null);

  const { data: bookingData, isLoading, error } = useBookingList(filters);
  const bookings = bookingData?.data || [];

  const startBookingMutation = useStartBooking();
  const completeBookingMutation = useCompleteBooking();

  const handleBookingUpdated = () => {
    // Refetch bookings data
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailsModalOpen(true);
  };

  const handleOpenReports = (booking: Booking) => {
    setSelectedBookingForReports(booking);
  };

  const handleStartEvent = (booking: Booking) => {
    startBookingMutation.mutate(booking.id);
  };

  const handleCompleteEvent = (booking: Booking) => {
    completeBookingMutation.mutate(booking.id);
  };

  const columns = useMemo(() => createColumns(
    handleBookingUpdated,
    handleViewDetails,
    handleOpenReports,
    handleStartEvent,
    handleCompleteEvent,
    formatAmount
  ), [formatAmount]);

  const handleSearch = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search,
      page: 1,
    }));
  };

  const handleStatusFilter = (values: string[]) => {
    setFilters(prev => ({
      ...prev,
      status: values.length > 0 ? (values[0] as BookingStatus) : undefined,
      page: 1,
    }));
  };

  const handlePaymentStatusFilter = (values: string[]) => {
    setFilters(prev => ({
      ...prev,
      paymentStatus: values.length > 0 ? (values[0] as PaymentStatus) : undefined,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (size: number) => {
    setFilters(prev => ({ ...prev, limit: size, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">Failed to load bookings</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const stats: StatCard[] = [
    {
      icon: BookOpen,
      label: 'Total Bookings',
      value: bookingData?.total || 0,
      iconColor: 'bg-teal-100',
    },
    {
      icon: TrendingUp,
      label: 'Total Revenue',
      value: formatAmount(
        bookings.reduce((sum: number, booking: Booking) => {
          const amount = typeof booking.totalAmount === 'string'
            ? parseFloat(booking.totalAmount)
            : booking.totalAmount;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0)
      ),
      iconColor: 'bg-green-100',
    },
    {
      icon: Calendar,
      label: 'Upcoming Events',
      value: bookings.filter(b =>
        (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.STARTED) &&
        new Date(b.startDate) > new Date()
      ).length,
      iconColor: 'bg-blue-100',
    },
    {
      icon: CheckCircle,
      label: 'Completed',
      value: bookings.filter(b => b.status === BookingStatus.COMPLETED).length,
      iconColor: 'text-green-600',
    },
  ];

  const actions: ActionButton[] = [
    {
      icon: Download,
      label: 'Export',
      onClick: () => {
        // Export functionality
        console.log('Export bookings');
      },
      variant: 'outline',
    },
  ];

  return (
    <div className="space-y-6">
      <ManagementLayout
        title="Booking Management"
        description="Manage customer bookings and track payments"
        stats={stats}
        actions={actions}
        tableTitle="All Bookings"
        tableDescription="Manage and track all customer bookings with advanced filtering and search capabilities."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <CreateBookingDialog onBookingCreated={handleBookingUpdated} />
          </div>
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
            filtersToolbar={
              <BookingFiltersToolbar
                filters={filters}
                onSearchChange={handleSearch}
                onStatusChange={handleStatusFilter}
                onPaymentStatusChange={handlePaymentStatusFilter}
                onResetFilters={handleResetFilters}
              />
            }
          />
        </div>
      </ManagementLayout>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedBooking(null);
          }}
          onBookingUpdated={handleBookingUpdated}
        />
      )}

      {/* Booking Reports Modal */}
      <BookingReportsModal
        booking={selectedBookingForReports}
        isOpen={!!selectedBookingForReports}
        onClose={() => setSelectedBookingForReports(null)}
      />
    </div>
  );
}
