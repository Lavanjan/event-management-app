import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { api } from '../../services/api';
import { useCurrency } from '../../contexts/CurrencyContext';
import { 
  Eye, 
  CreditCard, 
  Calendar, 
  User, 
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface Payment {
  id: string;
  bookingId: string;
  paymentType: string;
  paymentMethod: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  notes: string;
  transactionId: string;
  externalPaymentId: string;
  createdAt: string;
  processedAt: string;
  dueDate: string;
  booking?: {
    id: string;
    eventName: string;
    customerName: string;
    customerEmail: string;
  };
  processor?: {
    id: string;
    name: string;
    email: string;
  };
}

interface PaymentTransaction {
  id: string;
  transactionType: string;
  previousStatus: string;
  newStatus: string;
  amountChange: number;
  description: string;
  reason: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<Payment | null>(null);

  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    if (isOpen && payment) {
      loadPaymentDetails();
      loadTransactionHistory();
    }
  }, [isOpen, payment]);

  const loadPaymentDetails = async () => {
    try {
      const response = await api.get(`/payments/${payment.id}`);
      if (response.data.success) {
        setPaymentDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error loading payment details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment details.',
        variant: 'destructive',
      });
    }
  };

  const loadTransactionHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/payments/${payment.id}/transactions`);
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transaction history.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrencyAmount = (amount: number, currency?: string) => {
    return formatAmount(amount, currency);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  const getTransactionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'payment_created':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'payment_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'payment_failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'refund_initiated':
      case 'refund_completed':
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const currentPayment = paymentDetails || payment;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Payment Details
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Payment Details</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status:</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(currentPayment.status)}
                      {getStatusBadge(currentPayment.status)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium text-lg">
                      {formatCurrencyAmount(currentPayment.amount, currentPayment.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Payment Method:</span>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {currentPayment.paymentMethod.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Payment Type:</span>
                    <span className="font-medium">
                      {currentPayment.paymentType.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Transaction ID:</span>
                    <span className="font-mono text-sm">
                      {currentPayment.transactionId || 'N/A'}
                    </span>
                  </div>
                  {currentPayment.externalPaymentId && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">External ID:</span>
                      <span className="font-mono text-sm">
                        {currentPayment.externalPaymentId}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium">
                      {formatDate(currentPayment.createdAt)}
                    </span>
                  </div>
                  {currentPayment.processedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Processed:</span>
                      <span className="font-medium">
                        {formatDate(currentPayment.processedAt)}
                      </span>
                    </div>
                  )}
                  {currentPayment.dueDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Due Date:</span>
                      <span className="font-medium">
                        {formatDate(currentPayment.dueDate)}
                      </span>
                    </div>
                  )}
                  {currentPayment.processor && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Processed By:</span>
                      <div className="text-right">
                        <div className="font-medium">{currentPayment.processor.name}</div>
                        <div className="text-sm text-gray-500">{currentPayment.processor.email}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {currentPayment.booking && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Booking Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Event:</span>
                      <span className="font-medium">{currentPayment.booking.eventName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Customer:</span>
                      <div className="text-right">
                        <div className="font-medium">{currentPayment.booking.customerName}</div>
                        <div className="text-sm text-gray-500">{currentPayment.booking.customerEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Booking ID:</span>
                      <span className="font-mono text-sm">{currentPayment.booking.id}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(currentPayment.description || currentPayment.notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentPayment.description && (
                      <div>
                        <span className="text-gray-500 block mb-1">Description:</span>
                        <p className="text-sm">{currentPayment.description}</p>
                      </div>
                    )}
                    {currentPayment.notes && (
                      <div>
                        <span className="text-gray-500 block mb-1">Notes:</span>
                        <p className="text-sm">{currentPayment.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading transaction history...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No transaction history available</div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="border-l-4 border-gray-200 pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTransactionTypeIcon(transaction.transactionType)}
                            <div>
                              <div className="font-medium">
                                {transaction.transactionType.replace('_', ' ').toUpperCase()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(transaction.createdAt)}
                              </div>
                            </div>
                          </div>
                          {transaction.amountChange && (
                            <div className="text-right">
                              <div className={`font-medium ${transaction.amountChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.amountChange > 0 ? '+' : ''}
                                {formatAmount(transaction.amountChange, currentPayment.currency)}
                              </div>
                            </div>
                          )}
                        </div>
                        {transaction.description && (
                          <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                        )}
                        {transaction.reason && (
                          <p className="text-sm text-gray-500 mt-1">Reason: {transaction.reason}</p>
                        )}
                        {transaction.user && (
                          <div className="text-xs text-gray-400 mt-1">
                            By: {transaction.user.name} ({transaction.user.email})
                          </div>
                        )}
                        {transaction.previousStatus && transaction.newStatus && (
                          <div className="text-xs text-gray-400 mt-1">
                            Status: {transaction.previousStatus} → {transaction.newStatus}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
