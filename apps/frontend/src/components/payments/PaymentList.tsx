import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { DataTable } from '../common/DataTable';
import { useToast } from '../../hooks/use-toast';
import { usePayments } from '../../hooks/usePayments';
import { useCurrency } from '../../contexts/CurrencyContext';
import { 
  Filter,
  Eye,
  RefreshCw,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ProcessPaymentModal } from './ProcessPaymentModal';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import { RefundPaymentModal } from './RefundPaymentModal';

import { Payment, PaymentFilters } from '../../services/paymentService';

export const PaymentList: React.FC = () => {
  const [filters, setFilters] = useState<Partial<PaymentFilters>>({
    search: '',
    // @ts-ignore
    status: '',
    // @ts-ignore
    paymentMethod: '',
    // @ts-ignore
    paymentType: '',
    bookingId: '',
    startDate: '',
    endDate: '',
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // @ts-ignore
  const { toast } = useToast();
  const { formatAmount: formatCurrencyAmount } = useCurrency();

  // Use the payments hook
  // @ts-ignore
  const { data: paymentsData, isLoading: loading, error, refetch } = usePayments(filters);
  const payments = paymentsData?.data || [];
  const pagination = paymentsData?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRefresh = () => {
    refetch();
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      pending: 'secondary',
      processing: 'secondary',
      failed: 'destructive',
      cancelled: 'destructive',
      refunded: 'outline',
      partially_refunded: 'outline',
    };

    return (
      <Badge variant={variants[status.toLowerCase()] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  // @ts-ignore
  const formatAmount = (amount: number, currency?: string) => {
    // Use organization currency if no specific currency provided
    return formatCurrencyAmount(amount);
  };

  const columns = [
    {
      accessorKey: 'transactionId',
      header: 'Transaction ID',
      cell: ({ row }: any) => (
        <div className="font-mono text-sm">
          {row.original.transactionId || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'booking',
      header: 'Booking',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.booking?.eventName || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.original.booking?.customerName || 'N/A'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Method',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          {row.original.paymentMethod.replace('_', ' ').toUpperCase()}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: any) => (
        <div className="font-medium">
          {formatAmount(row.original.amount, row.original.currency)}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.original.status)}
          {getStatusBadge(row.original.status)}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: any) => (
        <div className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPayment(row.original);
              setShowDetailsModal(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.original.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPayment(row.original);
                setShowRefundModal(true);
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search payments..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.paymentMethod}
              onValueChange={(value) => handleFilterChange('paymentMethod', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Methods</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  search: '',
                  // @ts-ignore
                  status: '',
                  // @ts-ignore
                  paymentMethod: '',
                  // @ts-ignore
                  paymentType: '',
                  bookingId: '',
                  page: 1,
                  limit: 20,
                });
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={payments}
        isLoading={loading}
        totalCount={pagination.total}
        pageCount={pagination.totalPages}
        currentPage={pagination.page}
        pageSize={pagination.limit}
        onPageChange={handlePageChange}
        onRefresh={handleRefresh}
        title="Payments"
        description="Manage payment transactions"
        searchKey="description"
        searchPlaceholder="Search payments..."
      />

      {showProcessModal && (
        <ProcessPaymentModal
          isOpen={showProcessModal}
          onClose={() => setShowProcessModal(false)}
          onSuccess={() => {
            refetch();
            setShowProcessModal(false);
          }}
        />
      )}

      {showDetailsModal && selectedPayment && (
        <PaymentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          payment={selectedPayment as any}
        />
      )}

      {showRefundModal && selectedPayment && (
        <RefundPaymentModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          payment={selectedPayment as any}
          onSuccess={() => {
            refetch();
            setShowRefundModal(false);
          }}
        />
      )}
    </div>
  );
};
