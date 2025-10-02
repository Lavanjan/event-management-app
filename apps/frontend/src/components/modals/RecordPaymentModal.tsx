import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { CreditCard, DollarSign, Calendar } from 'lucide-react';
import { Booking, PaymentStatus } from '../../types';
import { useRecordPayment } from '../../hooks/usePayments';
import { useToast } from '../../hooks/use-toast';

const paymentSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  type: z.enum(['advance', 'balance', 'refund']),
  method: z.enum(['cash', 'card', 'bank_transfer', 'check', 'online', 'other']),
  reference: z.string().optional(),
  notes: z.string().optional(),
  processedAt: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface RecordPaymentModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RecordPaymentModal({ booking, isOpen, onClose, onSuccess }: RecordPaymentModalProps) {
  const { toast } = useToast();
  const recordPayment = useRecordPayment();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: '',
      type: 'advance',
      method: 'cash',
      reference: '',
      notes: '',
      processedAt: new Date().toISOString().split('T')[0],
    },
  });

  React.useEffect(() => {
    if (booking && isOpen) {
      // Set default amount based on payment status
      let defaultAmount = '';
      let defaultType: 'advance' | 'balance' | 'refund' = 'advance';

      if (booking.paymentStatus === PaymentStatus.PENDING && booking.advanceAmount) {
        defaultAmount = booking.advanceAmount.toString();
        defaultType = 'advance';
      } else if (booking.paymentStatus === PaymentStatus.ADVANCE_PAID && booking.balanceAmount) {
        defaultAmount = booking.balanceAmount.toString();
        defaultType = 'balance';
      }

      form.reset({
        amount: defaultAmount,
        type: defaultType,
        method: 'cash',
        reference: '',
        notes: '',
        processedAt: new Date().toISOString().split('T')[0],
      });
    }
  }, [booking, isOpen, form]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!booking) return;

    try {
      await recordPayment.mutateAsync({
        bookingId: booking.id,
        amount: Number(data.amount),
        type: data.type,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
        processedAt: data.processedAt ? new Date(data.processedAt).toISOString() : new Date().toISOString(),
      });

      toast({
        title: 'Payment Recorded',
        description: `${data.type} payment of $${data.amount} has been recorded successfully.`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  };

  if (!booking) return null;

  const getPaymentTypeOptions = () => {
    const options = [];
    
    if (booking.paymentStatus === PaymentStatus.PENDING) {
      options.push({ value: 'advance', label: 'Advance Payment' });
    }
    
    if (booking.paymentStatus === PaymentStatus.ADVANCE_PAID) {
      options.push({ value: 'balance', label: 'Balance Payment' });
    }
    
    options.push({ value: 'refund', label: 'Refund' });
    
    return options;
  };

  const getSuggestedAmount = () => {
    if (booking.paymentStatus === PaymentStatus.PENDING) {
      return booking.advanceAmount;
    }
    if (booking.paymentStatus === PaymentStatus.ADVANCE_PAID) {
      return booking.balanceAmount;
    }
    return 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a new payment for {booking.customerName}'s booking
          </DialogDescription>
        </DialogHeader>

        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Booking Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold">${Number(booking.totalAmount || 0).toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Advance Due</p>
                <p className="text-lg font-bold">${Number(booking.advanceAmount || 0).toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Balance Due</p>
                <p className="text-lg font-bold">${Number(booking.balanceAmount || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm text-muted-foreground">
                Current Status: <span className="font-medium">{booking.paymentStatus.replace('_', ' ')}</span>
              </p>
              {getSuggestedAmount() > 0 && (
                <p className="text-sm text-muted-foreground">
                  Suggested Amount: <span className="font-medium">${Number(getSuggestedAmount()).toFixed(2)}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getPaymentTypeOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="online">Online Payment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="processedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Transaction ID, Check number, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this payment..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordPayment.isPending}>
                {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
