import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { useCreatePayment, useBookingsWithOutstandingBalance } from '../../hooks/usePayments';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Loader2, CreditCard, DollarSign } from 'lucide-react';

interface Booking {
  id: string;
  eventName: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

interface ProcessPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bookingId?: string;
}

interface PaymentFormData {
  bookingId: string;
  paymentMethod: string;
  amount: number;
  description: string;
  notes: string;
  dueDate: string;
}

export const ProcessPaymentModal: React.FC<ProcessPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bookingId,
}) => {
  const { toast } = useToast();
  const { currency: currencyFromContext, formatAmount } = useCurrency();

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    bookingId: bookingId || '',
    paymentMethod: '',
    amount: 0,
    description: '',
    notes: '',
    dueDate: '',
  });

  // Use hooks for data fetching and mutations
  const { data: bookingsData } = useBookingsWithOutstandingBalance();
  const createPaymentMutation = useCreatePayment();

  // Handle nested data structure: { success: true, data: { data: [...] } }
  const bookings = Array.isArray(bookingsData?.data?.data) ? bookingsData.data.data :
                   Array.isArray(bookingsData?.data) ? bookingsData.data :
                   Array.isArray(bookingsData) ? bookingsData : [];

  useEffect(() => {
    if (isOpen && bookingId) {
      setFormData(prev => ({ ...prev, bookingId }));
    }
  }, [isOpen, bookingId]);

  useEffect(() => {
    if (formData.bookingId && Array.isArray(bookings)) {
      const booking = bookings.find((b: any) => b.id === formData.bookingId);
      setSelectedBooking(booking || null);
      if (booking && formData.amount === 0) {
        setFormData(prev => ({
          ...prev,
          amount: booking.balanceAmount || 0,
          description: `Payment for ${booking.event?.name || 'Event'}`,
        }));
      }
    }
  }, [formData.bookingId, bookings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bookingId || !formData.paymentMethod || formData.amount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedBooking && formData.amount > (selectedBooking as any).balanceAmount) {
      toast({
        title: 'Validation Error',
        description: 'Payment amount cannot exceed remaining balance.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createPaymentMutation.mutateAsync({
        bookingId: formData.bookingId,
        paymentType: 'payment',
        paymentMethod: formData.paymentMethod as any,
        amount: formData.amount,
        currency: currencyFromContext,
        description: formData.description,
        metadata: {
          notes: formData.notes,
          dueDate: formData.dueDate,
        },
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      // Error handling is done by the mutation hook
    }
  };

  const handleInputChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrencyAmount = (amount: number) => {
    return formatAmount(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Process Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="booking">Booking *</Label>
              <Select
                value={formData.bookingId}
                onValueChange={(value) => handleInputChange('bookingId', value)}
                {...(!!bookingId ? { disabled: true } : {})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select booking" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(bookings) && bookings.map((booking: any) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      <div>
                        <div className="font-medium">{booking.event?.name || 'Unknown Event'}</div>
                        <div className="text-sm text-gray-500">
                          {booking.customerName} - Outstanding: {formatCurrencyAmount(booking.balanceAmount || 0)}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  {(!Array.isArray(bookings) || bookings.length === 0) && (
                    <SelectItem value="">
                      No bookings with outstanding balance
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => handleInputChange('paymentMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
              {selectedBooking && (
                <div className="text-sm text-gray-500">
                  Outstanding: {formatCurrencyAmount((selectedBooking as any).balanceAmount)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Payment description"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this payment"
              rows={3}
            />
          </div>

          {selectedBooking && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Booking Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Event:</span>
                  <div className="font-medium">{selectedBooking.eventName}</div>
                </div>
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <div className="font-medium">{selectedBooking.customerName}</div>
                </div>
                <div>
                  <span className="text-gray-500">Total Amount:</span>
                  <div className="font-medium">{formatCurrencyAmount((selectedBooking as any).totalAmount)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Paid Amount:</span>
                  <div className="font-medium">{formatCurrencyAmount((selectedBooking as any).totalAmount - (selectedBooking as any).balanceAmount)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Outstanding:</span>
                  <div className="font-medium text-orange-600">{formatCurrencyAmount((selectedBooking as any).balanceAmount)}</div>
                </div>
                <div>
                  <span className="text-gray-500">After Payment:</span>
                  <div className="font-medium text-green-600">
                    {formatCurrencyAmount((selectedBooking as any).balanceAmount - formData.amount)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPaymentMutation.isPending}>
              {createPaymentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Process Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
