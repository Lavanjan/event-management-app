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
  TrendingDown,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { DataTable } from '../../components/ui/data-table';
import { DataTableFacetedFilter } from '../../components/ui/data-table-faceted-filter';
import { BookingStatus, PaymentStatus, Booking } from '../../types';
import { format } from 'date-fns';
import { useBookingList, useStartBooking, useCompleteBooking } from '../../hooks/useBookings';
import CreateBookingDialog from '../../components/modals/CreateBookingDialog';
import EditBookingDialog from '../../components/modals/EditBookingDialog';
import { BookingDetailsModal } from '../../components/modals/BookingDetailsModal';
import { BookingReportsModal } from '../../components/modals/BookingReportsModal';
import { useToast } from '../../hooks/use-toast';

interface BookingFilters {
  page: number;
  limit: number;
  search?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

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
  onCompleteEvent: (booking: Booking) => void
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
          <div className="font-medium">{formatCurrency(booking.totalAmount)}</div>
          <div className="text-sm text-muted-foreground">
            Advance: {formatCurrency(booking.advanceAmount)}
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
  const { toast } = useToast();
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
  const totalPages = bookingData ? Math.ceil(bookingData.total / filters.limit) : 0;
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
    handleCompleteEvent
  ), []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Booking Management</h1>
          <p className="text-muted-foreground">Manage customer bookings and track payments</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <CreateBookingDialog onBookingCreated={handleBookingUpdated} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{bookingData?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    bookings.reduce((sum: number, booking: Booking) => {
                      const amount = typeof booking.totalAmount === 'string'
                        ? parseFloat(booking.totalAmount)
                        : booking.totalAmount;
                      return sum + (isNaN(amount) ? 0 : amount);
                    }, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b =>
                    (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.STARTED) &&
                    new Date(b.startDate) > new Date()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Started Today</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => {
                    const today = new Date();
                    const startDate = new Date(b.startDate);
                    return b.status === BookingStatus.STARTED &&
                           startDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => b.status === BookingStatus.COMPLETED).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            Manage and track all customer bookings with advanced filtering and search capabilities.
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
        </CardContent>
      </Card>

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
