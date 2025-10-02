import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import {
  CreditCard,
  Calendar,
  User,
  Mail,
  Phone,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  Edit,
} from 'lucide-react';
import { Booking, PaymentStatus } from '../../types';
import { usePaymentHistory, useSendPaymentReminder, useUpdatePaymentStatus } from '../../hooks/usePayments';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { useToast } from '../../hooks/use-toast';

interface PaymentDetailsModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function PaymentDetailsModal({ booking, isOpen, onClose, onRefresh }: PaymentDetailsModalProps) {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const { toast } = useToast();

  const { data: paymentHistory, isLoading: historyLoading } = usePaymentHistory(booking?.id || '');
  const sendReminder = useSendPaymentReminder();
  const updatePaymentStatus = useUpdatePaymentStatus();

  if (!booking) return null;

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

  const handleSendReminder = async () => {
    if (!booking) return;

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

  const handleStatusUpdate = async (newStatus: PaymentStatus) => {
    if (!booking) return;

    try {
      await updatePaymentStatus.mutateAsync({
        bookingId: booking.id,
        status: newStatus,
      });

      toast({
        title: 'Status Updated',
        description: `Payment status updated to ${newStatus}`,
      });

      setIsEditingStatus(false);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getDueDate = () => {
    if (booking.paymentStatus === PaymentStatus.PENDING && booking.advanceDueDate) {
      return booking.advanceDueDate;
    }
    if (booking.paymentStatus === PaymentStatus.ADVANCE_PAID && booking.balanceDueDate) {
      return booking.balanceDueDate;
    }
    return null;
  };

  const getDueAmount = () => {
    if (booking.paymentStatus === PaymentStatus.PENDING) {
      return booking.advanceAmount;
    }
    if (booking.paymentStatus === PaymentStatus.ADVANCE_PAID) {
      return booking.balanceAmount;
    }
    return 0;
  };

  const isOverdue = () => {
    const dueDate = getDueDate();
    return dueDate && new Date(dueDate) < new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details - {booking.customerName}
          </DialogTitle>
          <DialogDescription>
            View and manage payment information for booking #{booking.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{booking.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{booking.customerEmail}</span>
              </div>
              {booking.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.customerPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{booking.event?.name || 'Unknown Event'}</p>
                <p className="text-sm text-muted-foreground">{booking.event?.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {booking.startDate ? format(new Date(booking.startDate), 'PPP') : 'No date set'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Summary
              </div>
              <div className="flex items-center gap-2">
                {getPaymentStatusBadge(booking.paymentStatus)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingStatus(!isEditingStatus)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Status
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${Number(booking.totalAmount || 0).toFixed(2)}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Advance Amount</p>
                <p className="text-2xl font-bold">${Number(booking.advanceAmount || 0).toFixed(2)}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Balance Amount</p>
                <p className="text-2xl font-bold">${Number(booking.balanceAmount || 0).toFixed(2)}</p>
              </div>
            </div>

            {getDueDate() && (
              <div className={cn(
                "mt-4 p-3 rounded-lg border",
                isOverdue() ? "border-destructive bg-destructive/10" : "border-warning bg-warning/10"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {booking.paymentStatus === PaymentStatus.PENDING ? 'Advance' : 'Balance'} Payment Due
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Amount: ${Number(getDueAmount()).toFixed(2)} • 
                      Due: {format(new Date(getDueDate()!), 'PPP')}
                      {isOverdue() && <span className="text-destructive font-medium"> (Overdue)</span>}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendReminder}
                    disabled={sendReminder.isPending}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send Reminder
                  </Button>
                </div>
              </div>
            )}

            {isEditingStatus && (
              <div className="mt-4 p-4 border rounded-lg">
                <p className="font-medium mb-3">Update Payment Status</p>
                <div className="flex flex-wrap gap-2">
                  {Object.values(PaymentStatus).map((status) => (
                    <Button
                      key={status}
                      variant={booking.paymentStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusUpdate(status)}
                      disabled={updatePaymentStatus.isPending}
                    >
                      {status.replace('_', ' ').toLowerCase()}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <p className="text-center text-muted-foreground">Loading payment history...</p>
            ) : paymentHistory && paymentHistory.length > 0 ? (
              <div className="space-y-3">
                {paymentHistory.map((payment, index) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{payment.type} Payment</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.processedAt ? format(new Date(payment.processedAt), 'PPP') : 'Processing...'}
                        {payment.reference && ` • Ref: ${payment.reference}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${payment.amount.toFixed(2)}</p>
                      <Badge variant={payment.status === 'completed' ? 'success' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No payment history available</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
