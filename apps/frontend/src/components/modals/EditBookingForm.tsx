import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { useUpdateBooking } from '../../hooks/useBookings';
import { useEventList } from '../../hooks/useEvents';
import { useToast } from '../../hooks/use-toast';
import { Booking, Event } from '../../types';

const formSchema = z.object({
  eventId: z.string().min(1, { message: 'Event is required' }),
  customerName: z.string().trim().min(1, { message: 'Customer name is required' }),
  customerEmail: z.string().email({ message: 'Valid email is required' }),
  customerPhone: z.string().trim().min(1, { message: 'Phone number is required' }),
  bookingDate: z.string().min(1, { message: 'Booking date is required' }),
  startTime: z.string().optional(),
  durationType: z.enum(['hourly', 'half_day', 'full_day'], {
    required_error: 'Duration type is required',
  }),
  durationHours: z.number().min(1).optional(),
  halfDaySlot: z.enum(['morning', 'evening']).optional(),
  advanceAmount: z.number().min(0, { message: 'Advance amount must be 0 or greater' }),
  useCustomAdvance: z.boolean().optional(),
  notes: z.string().trim().optional(),
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

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [originalTotalAmount, setOriginalTotalAmount] = useState<number>(0);
  const [originalAdvanceAmount, setOriginalAdvanceAmount] = useState<number>(0);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [useCustomAdvance, setUseCustomAdvance] = useState(false);
  const [newAdvanceAmount, setNewAdvanceAmount] = useState<number>(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      bookingDate: '',
      startTime: '',
      durationType: 'full_day',
      durationHours: undefined,
      halfDaySlot: undefined,
      advanceAmount: 0,
      useCustomAdvance: false,
      notes: '',
    },
  });

  // Initialize form with booking data
  useEffect(() => {
    if (booking) {
      // Extract date and time from startDate
      const startDate = new Date(booking.startDate);
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const hours = String(startDate.getHours()).padStart(2, '0');
      const minutes = String(startDate.getMinutes()).padStart(2, '0');

      const bookingDate = `${year}-${month}-${day}`;
      const startTime = `${hours}:${minutes}`;

      form.reset({
        eventId: booking.eventId || '',
        customerName: booking.customerName || '',
        customerEmail: booking.customerEmail || '',
        customerPhone: booking.customerPhone || '',
        bookingDate: bookingDate,
        startTime: startTime,
        durationType: (booking.durationType as 'hourly' | 'half_day' | 'full_day') || 'full_day',
        durationHours: booking.durationHours || undefined,
        halfDaySlot: (booking as any).halfDaySlot || undefined,
        advanceAmount: Number(booking.advanceAmount || 0),
        useCustomAdvance: false,
        notes: booking.notes || '',
      });

      setTotalAmount(Number(booking.totalAmount || 0));
      setOriginalTotalAmount(Number(booking.totalAmount || 0));
      setOriginalAdvanceAmount(Number(booking.advanceAmount || 0));
    }
  }, [booking, form]);

  // Watch form values
  const watchedEventId = form.watch('eventId');
  const watchedDurationType = form.watch('durationType');
  const watchedDurationHours = form.watch('durationHours');
  const watchedUseCustomAdvance = form.watch('useCustomAdvance');
  const watchedAdvanceAmount = form.watch('advanceAmount');

  // Update selected event when eventId changes
  useEffect(() => {
    if (watchedEventId && events.length > 0) {
      const event = events.find(e => e.id === watchedEventId);
      setSelectedEvent(event || null);
    } else {
      setSelectedEvent(null);
    }
  }, [watchedEventId, events]);

  // Calculate total amount when event or duration changes
  useEffect(() => {
    if (!selectedEvent) {
      setTotalAmount(0);
      setNewAdvanceAmount(0);
      return;
    }

    let basePrice = 0;

    if (watchedDurationType === 'hourly' && watchedDurationHours) {
      basePrice = Number(selectedEvent.hourlyPrice || 0) * Number(watchedDurationHours);
    } else if (watchedDurationType === 'half_day') {
      basePrice = Number(selectedEvent.halfDayPrice || 0);
    } else if (watchedDurationType === 'full_day') {
      basePrice = Number(selectedEvent.fullDayPrice || 0);
    }

    const total = Number(basePrice);
    setTotalAmount(total);

    // Calculate new advance amount based on current settings
    if (!watchedUseCustomAdvance && selectedEvent.requiredAdvancePercentage) {
      const autoAdvance = (total * Number(selectedEvent.requiredAdvancePercentage)) / 100;
      setNewAdvanceAmount(autoAdvance);
      form.setValue('advanceAmount', autoAdvance);
    } else {
      // For custom advance, use the current form value
      setNewAdvanceAmount(Number(watchedAdvanceAmount || 0));
    }
  }, [selectedEvent, watchedDurationType, watchedDurationHours, watchedUseCustomAdvance, form]);

  // Update new advance amount when custom advance amount changes
  useEffect(() => {
    if (watchedUseCustomAdvance) {
      setNewAdvanceAmount(Number(watchedAdvanceAmount || 0));
    }
  }, [watchedAdvanceAmount, watchedUseCustomAdvance]);

  // Calculate refund amount when amounts change
  useEffect(() => {
    // Calculate refund based on the difference between what was paid and what should be paid
    const totalPaidOriginal = originalAdvanceAmount;
    const totalShouldPayNew = newAdvanceAmount;

    if (totalPaidOriginal > totalShouldPayNew) {
      // Customer paid more than needed for new booking, refund the difference
      setRefundAmount(totalPaidOriginal - totalShouldPayNew);
    } else {
      setRefundAmount(0);
    }
  }, [originalAdvanceAmount, newAdvanceAmount]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (updateBooking.isPending) return;

    // Validate booking date is provided
    if (!values.bookingDate) {
      toast({
        title: 'Error',
        description: 'Booking date is required',
        variant: 'destructive',
      });
      return;
    }

    // Calculate startDate and endDate based on booking type
    let startDate: string;
    let endDate: string;

    if (values.durationType === 'hourly') {
      if (!values.startTime) {
        toast({
          title: 'Error',
          description: 'Start time is required for hourly bookings',
          variant: 'destructive',
        });
        return;
      }
      if (!values.durationHours || values.durationHours <= 0) {
        toast({
          title: 'Error',
          description: 'Duration hours is required for hourly bookings',
          variant: 'destructive',
        });
        return;
      }
      const dateTime = new Date(`${values.bookingDate}T${values.startTime}:00`);
      if (isNaN(dateTime.getTime())) {
        toast({
          title: 'Error',
          description: 'Invalid date or time format',
          variant: 'destructive',
        });
        return;
      }
      startDate = dateTime.toISOString();
      const endDateTime = new Date(dateTime.getTime() + values.durationHours * 60 * 60 * 1000);
      endDate = endDateTime.toISOString();
    } else if (values.durationType === 'half_day') {
      if (!values.halfDaySlot) {
        toast({
          title: 'Error',
          description: 'Please select morning or evening slot',
          variant: 'destructive',
        });
        return;
      }
      const dateTime = new Date(`${values.bookingDate}T00:00:00`);
      if (isNaN(dateTime.getTime())) {
        toast({
          title: 'Error',
          description: 'Invalid date format',
          variant: 'destructive',
        });
        return;
      }
      startDate = dateTime.toISOString();
      endDate = dateTime.toISOString();
    } else {
      const dateTime = new Date(`${values.bookingDate}T00:00:00`);
      if (isNaN(dateTime.getTime())) {
        toast({
          title: 'Error',
          description: 'Invalid date format',
          variant: 'destructive',
        });
        return;
      }
      startDate = dateTime.toISOString();
      endDate = dateTime.toISOString();
    }

    const bookingData = {
      eventId: values.eventId,
      customerName: values.customerName,
      customerEmail: values.customerEmail,
      customerPhone: values.customerPhone,
      startDate,
      endDate,
      durationType: values.durationType,
      durationHours: values.durationHours,
      halfDaySlot: values.halfDaySlot,
      advanceAmount: values.advanceAmount,
      useCustomAdvance: values.useCustomAdvance,
      notes: values.notes,
    };

    console.log('Updating booking with data:', bookingData);

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
          console.error('Booking update error:', error);
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
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Event Selection - Half Width */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectValue placeholder="Select an event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {events.map(event => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name} - {event.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Customer Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Customer Information</h3>

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
                        <Input placeholder="John Doe" className="!h-[48px]" {...field} />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input placeholder="+1 (555) 123-4567" className="!h-[48px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Booking Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Booking Details</h3>

              {/* Duration Type */}
              <FormField
                control={form.control}
                name="durationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <Clock className="inline w-4 h-4 mr-1" />
                      Duration Type
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hourly" id="edit-hourly" />
                          <Label htmlFor="edit-hourly" className="cursor-pointer font-normal">
                            Hour Basis - Flexible hourly booking
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="half_day" id="edit-half-day" />
                          <Label htmlFor="edit-half-day" className="cursor-pointer font-normal">
                            Half Day - Morning (08:00-12:00) or Evening (13:00-17:00)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="full_day" id="edit-full-day" />
                          <Label htmlFor="edit-full-day" className="cursor-pointer font-normal">
                            Full Day - Entire day (00:00-23:59)
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dynamic Fields Based on Duration Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bookingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                        <Calendar className="inline w-4 h-4 mr-1" />
                        Booking Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" className="!h-[48px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedDurationType === 'hourly' && (
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                          <Clock className="inline w-4 h-4 mr-1" />
                          Start Time
                        </FormLabel>
                        <FormControl>
                          <Input type="time" className="!h-[48px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {watchedDurationType === 'hourly' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="durationHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                          <Clock className="inline w-4 h-4 mr-1" />
                          Duration (Hours)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Enter number of hours"
                            className="!h-[48px]"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {watchedDurationType === 'half_day' && (
                <FormField
                  control={form.control}
                  name="halfDaySlot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                        <Clock className="inline w-4 h-4 mr-1" />
                        Time Slot
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                            <RadioGroupItem value="morning" id="edit-morning" />
                            <Label
                              htmlFor="edit-morning"
                              className="cursor-pointer flex-1 font-normal"
                            >
                              <div className="font-medium">Morning Slot</div>
                              <div className="text-xs text-muted-foreground">
                                08:00 AM - 12:00 PM
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                            <RadioGroupItem value="evening" id="edit-evening" />
                            <Label
                              htmlFor="edit-evening"
                              className="cursor-pointer flex-1 font-normal"
                            >
                              <div className="font-medium">Evening Slot</div>
                              <div className="text-xs text-muted-foreground">
                                01:00 PM - 05:00 PM
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedDurationType === 'full_day' && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Full day booking covers the entire day from 12:00 AM to 11:59 PM
                  </p>
                </div>
              )}
            </div>

            {/* Pricing Summary */}
            {selectedEvent && totalAmount > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Pricing Summary</h3>
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Original Total:</span>
                      <span className="font-medium">${Number(originalTotalAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Total:</span>
                      <span className="font-medium text-green-600">
                        ${Number(totalAmount).toFixed(2)}
                      </span>
                    </div>
                    {refundAmount > 0 && (
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">Refund Amount:</span>
                        <span className="font-medium text-blue-600">
                          ${Number(refundAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground italic pt-2">
                      * Inventory costs are tracked separately as expenses
                    </p>
                  </div>
                </div>

                {refundAmount > 0 && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                      A refund of ${Number(refundAmount).toFixed(2)} will be processed due to the
                      price reduction.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Advance Payment Options */}
            {selectedEvent && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Advance Payment Options</h3>

                <div className="space-y-3">
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                    <DollarSign className="inline w-4 h-4 mr-1" />
                    Advance Payment Option
                  </FormLabel>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!watchedUseCustomAdvance}
                        onChange={() => {
                          setUseCustomAdvance(false);
                          form.setValue('useCustomAdvance', false);
                          // Recalculate auto advance
                          if (selectedEvent?.requiredAdvancePercentage) {
                            const autoAdvance =
                              (Number(totalAmount) * Number(selectedEvent.requiredAdvancePercentage)) /
                              100;
                            form.setValue('advanceAmount', autoAdvance);
                            setNewAdvanceAmount(autoAdvance);
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span>Use Event Default ({selectedEvent?.requiredAdvancePercentage || 0}%)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={watchedUseCustomAdvance}
                        onChange={() => {
                          setUseCustomAdvance(true);
                          form.setValue('useCustomAdvance', true);
                        }}
                        className="w-4 h-4"
                      />
                      <span>Custom Amount</span>
                    </label>
                  </div>
                </div>

                {/* New Advance Amount */}
                <FormField
                  control={form.control}
                  name="advanceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                        <DollarSign className="inline w-4 h-4 mr-1" />
                        New Advance Amount
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max={Number(totalAmount)}
                          step="0.01"
                          className="!h-[48px]"
                          disabled={!watchedUseCustomAdvance}
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                      {!watchedUseCustomAdvance && selectedEvent && (
                        <p className="text-xs text-muted-foreground">
                          Auto-calculated: $
                          {(
                            (Number(totalAmount) * Number(selectedEvent.requiredAdvancePercentage)) /
                            100
                          ).toFixed(2)}{' '}
                          ({selectedEvent.requiredAdvancePercentage}%)
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {/* Balance Amount Display */}
                {selectedEvent && totalAmount > 0 && (
                  <div className="p-3 bg-accent rounded-lg">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>New Total Amount:</span>
                        <span className="font-medium">${Number(totalAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Advance Amount:</span>
                        <span className="font-medium text-green-600">
                          ${Number(newAdvanceAmount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-medium">New Balance Due:</span>
                        <span className="font-medium text-orange-600">
                          ${Math.max(0, Number(totalAmount) - Number(newAdvanceAmount)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Information */}
            {selectedEvent && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Payment Information</h3>

                {/* Original Payment Details */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Original Booking</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-medium">${Number(originalTotalAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Advance Paid:</span>
                      <span className="font-medium text-green-600">
                        ${Number(originalAdvanceAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Balance Due (Original):</span>
                      <span className="font-medium text-orange-600">
                        ${Math.max(0, Number(originalTotalAmount) - Number(originalAdvanceAmount)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* New Payment Details */}
                <div className="p-4 bg-accent rounded-lg border-2 border-primary/20">
                  <h4 className="text-sm font-medium mb-3 text-primary">Updated Booking</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>New Total Amount:</span>
                      <span className="font-medium text-primary">
                        ${Number(totalAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Advance Required:</span>
                      <span className="font-medium text-blue-600">
                        ${Number(newAdvanceAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Balance Due:</span>
                      <span className="font-medium text-orange-600">
                        ${Math.max(0, Number(totalAmount) - Number(newAdvanceAmount)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Comparison */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-300 rounded-lg">
                  <h4 className="text-sm font-medium mb-3 text-yellow-800 dark:text-yellow-200">
                    💰 Payment Comparison
                  </h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Already Paid (Advance):</span>
                      <span className="font-medium text-green-600">
                        ${Number(originalAdvanceAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Should Pay (New Advance):</span>
                      <span className="font-medium text-blue-600">
                        ${Number(newAdvanceAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">
                        {Number(originalAdvanceAmount) > Number(newAdvanceAmount) ? 'Refund Due:' :
                         Number(originalAdvanceAmount) < Number(newAdvanceAmount) ? 'Additional Payment:' :
                         'No Change:'}
                      </span>
                      <span className={`font-medium text-lg ${
                        Number(originalAdvanceAmount) > Number(newAdvanceAmount) ? 'text-blue-600' :
                        Number(originalAdvanceAmount) < Number(newAdvanceAmount) ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        ${Math.abs(Number(originalAdvanceAmount) - Number(newAdvanceAmount)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Refund Information */}
                {refundAmount > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-300 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">
                      💰 Refund Required
                    </h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between font-medium text-blue-800 dark:text-blue-200">
                        <span>Refund Amount:</span>
                        <span className="text-lg">${Number(refundAmount).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                        <p>• Customer paid ${Number(originalAdvanceAmount).toFixed(2)} advance originally</p>
                        <p>• New advance requirement is ${Number(newAdvanceAmount).toFixed(2)}</p>
                        <p>• Refund of ${Number(refundAmount).toFixed(2)} should be processed</p>
                        <p>• Customer will still owe ${Math.max(0, Number(totalAmount) - Number(newAdvanceAmount)).toFixed(2)} as balance</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Advance Payment Required */}
                {Number(newAdvanceAmount) > Number(originalAdvanceAmount) && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-300 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 text-orange-800 dark:text-orange-200">
                      💳 Additional Advance Payment Required
                    </h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between font-medium text-orange-800 dark:text-orange-200">
                        <span>Additional Advance Due:</span>
                        <span className="text-lg">
                          ${(Number(newAdvanceAmount) - Number(originalAdvanceAmount)).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-300 space-y-1">
                        <p>• New total amount: ${Number(totalAmount).toFixed(2)}</p>
                        <p>• New advance requirement: ${Number(newAdvanceAmount).toFixed(2)}</p>
                        <p>• Customer already paid: ${Number(originalAdvanceAmount).toFixed(2)}</p>
                        <p>• Additional advance needed: ${(Number(newAdvanceAmount) - Number(originalAdvanceAmount)).toFixed(2)}</p>
                        <p>• Remaining balance after full advance: ${Math.max(0, Number(totalAmount) - Number(newAdvanceAmount)).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Payment Change */}
                {Number(newAdvanceAmount) === Number(originalAdvanceAmount) && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border-2 border-green-300 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 text-green-800 dark:text-green-200">
                      ✅ No Advance Payment Change
                    </h4>
                    <div className="text-sm space-y-1">
                      <p className="text-green-600 dark:text-green-300">
                        The advance payment amount remains the same: ${Number(originalAdvanceAmount).toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300">
                        New balance due: ${Math.max(0, Number(totalAmount) - Number(newAdvanceAmount)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                    <FileText className="inline w-4 h-4 mr-1" />
                    Notes (Optional)
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
