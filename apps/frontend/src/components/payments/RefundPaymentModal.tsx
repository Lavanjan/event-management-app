import React, { useState } from 'react';
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
import { Card, CardContent } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { Loader2, RefreshCw, DollarSign, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  description: string;
  booking?: {
    eventName: string;
    customerName: string;
  };
}

interface RefundPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payment: Payment;
}

interface RefundFormData {
  amount: number;
  reason: string;
  notes: string;
}

export const RefundPaymentModal: React.FC<RefundPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  payment,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RefundFormData>({
    amount: payment.amount,
    reason: '',
    notes: '',
  });

  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for the refund.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.amount <= 0 || formData.amount > payment.amount) {
      toast({
        title: 'Validation Error',
        description: 'Refund amount must be between $0.01 and the original payment amount.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/payments/${payment.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process refund');
      }

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Refund processed successfully.',
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process refund. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RefundFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrencyAmount = (amount: number) => {
    // @ts-ignore
    return formatAmount(amount, payment.currency);
  };

  const isFullRefund = formData.amount === payment.amount;
  const refundPercentage = (formData.amount / payment.amount) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Process Refund
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action will process a refund for the selected payment. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="pt-6">
              <h4 className="font-medium mb-4">Original Payment Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Payment Amount:</span>
                  <div className="font-medium">{formatCurrencyAmount(payment.amount)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Payment Method:</span>
                  <div className="font-medium">
                    {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                {payment.booking && (
                  <>
                    <div>
                      <span className="text-gray-500">Event:</span>
                      <div className="font-medium">{payment.booking.eventName}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <div className="font-medium">{payment.booking.customerName}</div>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <span className="text-gray-500">Description:</span>
                  <div className="font-medium">{payment.description || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Refund Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={payment.amount}
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Maximum refund: {formatCurrencyAmount(payment.amount)}</span>
                <span>{refundPercentage.toFixed(1)}% of original payment</span>
              </div>
              {isFullRefund && (
                <div className="text-sm text-orange-600 font-medium">
                  This is a full refund
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Refund *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder="e.g., Customer cancellation, Event cancelled, Duplicate payment"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information about this refund"
                rows={3}
              />
            </div>
          </div>

          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <h4 className="font-medium mb-4">Refund Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Original Payment:</span>
                  <span className="font-medium">{formatCurrencyAmount(payment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refund Amount:</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrencyAmount(formData.amount)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Net Payment:</span>
                  <span className={payment.amount - formData.amount === 0 ? 'text-gray-500' : 'text-green-600'}>
                    {formatCurrencyAmount(payment.amount - formData.amount)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {isFullRefund 
                    ? 'The payment will be marked as fully refunded'
                    : 'The payment will be marked as partially refunded'
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              variant="destructive"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Process Refund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
