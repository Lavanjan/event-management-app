import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { User, Mail, Phone, Calendar, DollarSign, FileText, Clock, Package, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { useCreateBooking } from '../../hooks/useBookings';
import { useEventList } from '../../hooks/useEvents';
import { useInventoryList } from '../../hooks/useInventory';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useToast } from '../../hooks/use-toast';
import { Event } from '../../types';

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

interface CreateBookingFormProps {
  onClose: () => void;
}

export default function CreateBookingForm({ onClose }: CreateBookingFormProps) {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const createBooking = useCreateBooking();
  const { data: eventsData } = useEventList({ limit: 100 });
  const { data: inventoryData } = useInventoryList({ limit: 100 });
  const events = eventsData?.data || [];
  const inventoryItems = inventoryData?.data || [];

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [useCustomAdvance, setUseCustomAdvance] = useState(false);
  const [inventoryAllocations, setInventoryAllocations] = useState<
    Array<{ inventoryItemId: string; quantity: number; unitPrice: number; name: string }>
  >([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [inventoryQuantity, setInventoryQuantity] = useState(1);

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

  const watchedEventId = form.watch('eventId');
  const watchedDurationType = form.watch('durationType');
  const watchedDurationHours = form.watch('durationHours');
  const watchedAdvanceAmount = form.watch('advanceAmount');
  const watchedUseCustomAdvance = form.watch('useCustomAdvance');

  // Update selected event when eventId changes
  useEffect(() => {
    if (watchedEventId) {
      const event = events.find(e => e.id === watchedEventId);
      setSelectedEvent(event || null);
    } else {
      setSelectedEvent(null);
    }
  }, [watchedEventId, events]);

  // Calculate total amount when event or duration changes (NOT inventory)
  // Inventory is tracked separately and becomes an expense after booking
  useEffect(() => {
    if (!selectedEvent) {
      setTotalAmount(0);
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

    // Total amount is ONLY the event booking fee (inventory is NOT included)
    const total = Number(basePrice);
    setTotalAmount(total);

    // Auto-calculate advance amount based on event's required percentage (only if not using custom)
    if (!watchedUseCustomAdvance && selectedEvent.requiredAdvancePercentage) {
      const autoAdvance = (total * Number(selectedEvent.requiredAdvancePercentage)) / 100;
      form.setValue('advanceAmount', autoAdvance);
    }
  }, [selectedEvent, watchedDurationType, watchedDurationHours, watchedUseCustomAdvance, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (createBooking.isPending) return;

    // Validate booking date is provided
    if (!values.bookingDate) {
      toast({
        title: 'Error',
        description: 'Booking date is required',
        variant: 'destructive',
      });
      return;
    }

    // Calculate startDate based on booking type
    let startDate: string;
    let endDate: string;

    if (values.durationType === 'hourly') {
      // For hourly: combine bookingDate and startTime
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
      // Create ISO 8601 format with timezone
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
      // Calculate end date for hourly bookings
      const endDateTime = new Date(dateTime.getTime() + values.durationHours * 60 * 60 * 1000);
      endDate = endDateTime.toISOString();
    } else if (values.durationType === 'half_day') {
      // For half day: backend will calculate based on slot
      if (!values.halfDaySlot) {
        toast({
          title: 'Error',
          description: 'Please select morning or evening slot',
          variant: 'destructive',
        });
        return;
      }
      // Create ISO 8601 format with timezone
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
      endDate = dateTime.toISOString(); // Backend will recalculate
    } else {
      // For full day: backend will set to 00:00
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
      endDate = dateTime.toISOString(); // Backend will recalculate
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
      notes: values.notes,
      inventoryAllocations: inventoryAllocations.map(allocation => ({
        inventoryItemId: allocation.inventoryItemId,
        quantity: allocation.quantity,
      })),
    };

    console.log('Submitting booking data:', bookingData);

    createBooking.mutate(bookingData, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Booking created successfully. Confirmation email sent to customer.',
        });
        onClose();
      },
      onError: (error: any) => {
        console.error('Booking creation error:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to create booking',
          variant: 'destructive',
        });
      },
    });
  };

  const addInventoryAllocation = () => {
    if (!selectedInventoryId || inventoryQuantity <= 0) return;

    const item = inventoryItems.find(i => i.id === selectedInventoryId);
    if (!item) return;

    const existing = inventoryAllocations.find(a => a.inventoryItemId === selectedInventoryId);
    if (existing) {
      setInventoryAllocations(
        inventoryAllocations.map(a =>
          a.inventoryItemId === selectedInventoryId
            ? { ...a, quantity: a.quantity + inventoryQuantity }
            : a
        )
      );
    } else {
      setInventoryAllocations([
        ...inventoryAllocations,
        {
          inventoryItemId: selectedInventoryId,
          quantity: inventoryQuantity,
          unitPrice: item.unitPrice || 0,
          name: item.name,
        },
      ]);
    }

    setSelectedInventoryId('');
    setInventoryQuantity(1);
  };

  const removeInventoryAllocation = (itemId: string) => {
    setInventoryAllocations(inventoryAllocations.filter(a => a.inventoryItemId !== itemId));
  };

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1 text-center sm:text-left">
            Create Booking
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Create a new booking for an event with customer details
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
                      Event Type
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
                            {event.name} {event.location && `- ${event.location}`}
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
                          <RadioGroupItem value="hourly" id="create-hourly" />
                          <Label htmlFor="create-hourly" className="cursor-pointer font-normal">
                            Hour Basis - Flexible hourly booking
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="half_day" id="create-half-day" />
                          <Label htmlFor="create-half-day" className="cursor-pointer font-normal">
                            Half Day - Morning (08:00-12:00) or Evening (13:00-17:00)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="full_day" id="create-full-day" />
                          <Label htmlFor="create-full-day" className="cursor-pointer font-normal">
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
                    <FormItem className="space-y-3">
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
                            <RadioGroupItem value="morning" id="morning" />
                            <Label htmlFor="morning" className="cursor-pointer flex-1 font-normal">
                              <div className="font-medium">Morning Slot</div>
                              <div className="text-xs text-muted-foreground">
                                08:00 AM - 12:00 PM
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                            <RadioGroupItem value="evening" id="evening" />
                            <Label htmlFor="evening" className="cursor-pointer flex-1 font-normal">
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

            {/* Inventory Allocation - Always show if event is selected */}
            {selectedEvent && (
              <div className="space-y-3">
                <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                  <Package className="inline w-4 h-4 mr-1" />
                  Inventory Allocation (Optional)
                </FormLabel>

                <div className="flex gap-2">
                  <Select value={selectedInventoryId} onValueChange={setSelectedInventoryId}>
                    <SelectTrigger className="!h-[48px] flex-1">
                      <SelectValue placeholder="Select inventory item" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {formatAmount(item.unitPrice || 0)} ({item.availableQuantity} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    min="1"
                    value={inventoryQuantity}
                    onChange={e => setInventoryQuantity(parseInt(e.target.value) || 1)}
                    placeholder="Qty"
                    className="!h-[48px] w-24"
                  />

                  <Button type="button" onClick={addInventoryAllocation} className="!h-[48px]">
                    Add
                  </Button>
                </div>

                {inventoryAllocations.length > 0 && (
                  <div className="border rounded-lg p-3 space-y-2">
                    {inventoryAllocations.map(allocation => (
                      <div
                        key={allocation.inventoryItemId}
                        className="flex justify-between items-center p-2 bg-muted rounded"
                      >
                        <div className="flex-1">
                          <span className="font-medium">{allocation.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            x{allocation.quantity} @ {formatAmount(allocation.unitPrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatAmount(Number(allocation.quantity) * Number(allocation.unitPrice))}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInventoryAllocation(allocation.inventoryItemId)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pricing Summary */}
            {totalAmount > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Event Booking Fee:</span>
                    <span className="font-medium text-green-600">
                      {formatAmount(Number(totalAmount))}
                    </span>
                  </div>
                  {inventoryAllocations.length > 0 && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Inventory Allocated:</span>
                        <span className="font-medium">
                          {formatAmount(inventoryAllocations
                            .reduce((sum, a) => sum + Number(a.quantity) * Number(a.unitPrice), 0))}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        * Inventory costs will be tracked as expenses after booking
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Total Amount Display (Read-only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Total Amount
                </FormLabel>
                <Input
                  type="text"
                  value={formatAmount(Number(totalAmount || 0))}
                  disabled
                  className="!h-[48px] bg-muted font-semibold"
                />
              </div>
            </div>

            {/* Advance Payment Option */}
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

            {/* Advance Amount */}
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
                      Auto-calculated: {formatAmount(
                        (Number(totalAmount) * Number(selectedEvent.requiredAdvancePercentage)) /
                        100
                      )} ({selectedEvent.requiredAdvancePercentage}%)
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Balance Amount Display */}
            {totalAmount > 0 && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Balance Amount:</span>
                  <span className="text-lg font-bold">
                    {formatAmount(Number(totalAmount) - Number(watchedAdvanceAmount || 0))}
                  </span>
                </div>
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

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createBooking.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBooking.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createBooking.isPending ? 'Creating...' : 'Create Booking'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
