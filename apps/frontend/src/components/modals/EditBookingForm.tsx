import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { User, Mail, Phone, Calendar, DollarSign, FileText } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useUpdateBooking } from '../../hooks/useBookings';
import { useEventList } from '../../hooks/useEvents';
import { useToast } from '../../hooks/use-toast';
import { Booking } from '../../types';

const formSchema = z.object({
  eventId: z.string().min(1, {
    message: 'Event is required',
  }),
  customerName: z.string().trim().min(1, {
    message: 'Customer name is required',
  }),
  customerEmail: z.string().email({
    message: 'Valid email is required',
  }),
  customerPhone: z.string().trim().min(1, {
    message: 'Phone number is required',
  }),
  totalAmount: z.number().min(0, {
    message: 'Total amount must be 0 or greater',
  }),
  advanceAmount: z.number().min(0, {
    message: 'Advance amount must be 0 or greater',
  }),
  notes: z.string().trim(),
});

interface EditBookingFormProps {
  booking: Booking;
  onClose: () => void;
}

export default function EditBookingForm({ booking, onClose }: EditBookingFormProps) {
  const { toast } = useToast();
  const updateBooking = useUpdateBooking();
  const { data: eventsData } = useEventList({ limit: 100 });
  const events = eventsData?.data || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      totalAmount: 0,
      advanceAmount: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (booking) {
      form.reset({
        eventId: booking.eventId || '',
        customerName: booking.customerName || '',
        customerEmail: booking.customerEmail || '',
        customerPhone: booking.customerPhone || '',
        totalAmount: parseFloat(booking.totalAmount?.toString() || '0'),
        advanceAmount: parseFloat(booking.advanceAmount?.toString() || '0'),
        notes: booking.notes || '',
      });
    }
  }, [booking, form]);

  const watchedTotalAmount = form.watch('totalAmount');
  const watchedAdvanceAmount = form.watch('advanceAmount');

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (updateBooking.isPending) return;

    const bookingData = {
      ...values,
      balanceAmount: values.totalAmount - values.advanceAmount,
    };

    updateBooking.mutate(
      { id: booking.id, data: bookingData },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Booking updated successfully',
          });
          onClose();
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Failed to update booking',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1 text-center sm:text-left">
            Edit Booking
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Update the booking details and customer information
          </p>
        </div>
        
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="eventId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Event
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="!h-[48px]">
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name} - {new Date(event.startDate).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <User className="inline w-4 h-4 mr-1" />
                      Customer Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="!h-[48px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Customer Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        className="!h-[48px]"
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
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Customer Phone
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+1 (555) 123-4567"
                      className="!h-[48px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Total Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="!h-[48px]"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="advanceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Advance Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max={watchedTotalAmount}
                        step="0.01"
                        className="!h-[48px]"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchedTotalAmount > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-medium">${watchedTotalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance Amount:</span>
                    <span className="font-medium">${watchedAdvanceAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>Balance Amount:</span>
                    <span className="font-medium">${(watchedTotalAmount - watchedAdvanceAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                    <FileText className="inline w-4 h-4 mr-1" />
                    Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or requirements..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateBooking.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateBooking.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {updateBooking.isPending ? 'Updating...' : 'Update Booking'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
