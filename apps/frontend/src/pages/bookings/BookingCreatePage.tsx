import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Calendar,
  User,
  Package,
  DollarSign,
  Save,
  Plus,
  Trash2,
  Calculator
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { InputField, TextareaField, SelectField } from '../../components/forms/FormField';
import { LoadingSpinner, PageLoading } from '../../components/forms/LoadingSpinner';
import { useCreateBooking } from '../../hooks/useBookings';
import { useEventList } from '../../hooks/useEvents';
import { useInventoryList } from '../../hooks/useInventory';
import { format } from 'date-fns';

const bookingSchema = z.object({
  eventId: z.string().min(1, 'Event is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().optional(),
  numberOfAttendees: z.number().min(1, 'At least 1 attendee required'),
  specialRequests: z.string().optional(),
  inventoryItems: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().min(1),
  })).optional(),
  customItems: z.array(z.object({
    name: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface InventorySelection {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  availableQuantity: number;
}

interface CustomItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export function BookingCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get('eventId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<InventorySelection[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const createBooking = useCreateBooking();
  const { data: eventsData, isLoading: eventsLoading } = useEventList({ limit: 100 });
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryList({ limit: 100 });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      eventId: preselectedEventId || '',
      numberOfAttendees: 1,
      inventoryItems: [],
      customItems: [],
    },
  });

  const watchEventId = watch('eventId');
  const watchAttendees = watch('numberOfAttendees');

  // Update selected event when eventId changes
  useEffect(() => {
    if (watchEventId && eventsData?.items) {
      const event = eventsData.items.find(e => e.id === watchEventId);
      setSelectedEvent(event);
    }
  }, [watchEventId, eventsData]);

  const eventOptions = eventsData?.items?.map(event => ({
    value: event.id,
    label: `${event.name} - ${format(new Date(event.startDate), 'MMM dd, yyyy')}`,
  })) || [];

  const availableInventory = inventoryData?.items?.filter(item =>
    item.quantity > 0 && !selectedInventory.find(sel => sel.itemId === item.id)
  ) || [];

  const addInventoryItem = (itemId: string) => {
    const item = inventoryData?.items?.find(i => i.id === itemId);
    if (item) {
      setSelectedInventory(prev => [...prev, {
        itemId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: item.unitPrice,
        availableQuantity: item.quantity,
      }]);
    }
  };

  const updateInventoryQuantity = (itemId: string, quantity: number) => {
    setSelectedInventory(prev =>
      prev.map(item =>
        item.itemId === itemId
          ? { ...item, quantity: Math.min(quantity, item.availableQuantity) }
          : item
      )
    );
  };

  const removeInventoryItem = (itemId: string) => {
    setSelectedInventory(prev => prev.filter(item => item.itemId !== itemId));
  };

  const addCustomItem = () => {
    const newItem: CustomItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      unitPrice: 0,
    };
    setCustomItems(prev => [...prev, newItem]);
  };

  const updateCustomItem = (id: string, field: keyof CustomItem, value: string | number) => {
    setCustomItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeCustomItem = (id: string) => {
    setCustomItems(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const inventoryTotal = selectedInventory.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice), 0
    );
    const customTotal = customItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice), 0
    );
    const baseTotal = selectedEvent?.basePrice ? selectedEvent.basePrice * watchAttendees : 0;
    const subtotal = baseTotal + inventoryTotal + customTotal;
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    return { baseTotal, inventoryTotal, customTotal, subtotal, tax, total };
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);

      const bookingData = {
        ...data,
        inventoryItems: selectedInventory.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
        customItems: customItems.filter(item => item.name.trim()).map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      await createBooking.mutateAsync(bookingData);
      navigate('/bookings');
    } catch (error) {
      console.error('Failed to create booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (eventsLoading || inventoryLoading) {
    return <PageLoading message="Loading booking form..." />;
  }

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/bookings')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Booking</h1>
          <p className="text-muted-foreground">
            Create a new booking for an event
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event & Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Event & Customer Details
                </CardTitle>
                <CardDescription>
                  Select the event and enter customer information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="eventId"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      label="Event"
                      placeholder="Select an event"
                      options={eventOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      error={errors.eventId?.message}
                      required
                    />
                  )}
                />

                {selectedEvent && (
                  <div className="p-3 bg-accent rounded-lg">
                    <h4 className="font-medium">{selectedEvent.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedEvent.startDate), 'PPP p')} - {format(new Date(selectedEvent.endDate), 'PPP p')}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
                    {selectedEvent.basePrice && (
                      <p className="text-sm font-medium">Base Price: ${selectedEvent.basePrice} per person</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Customer Name"
                    placeholder="Enter customer name"
                    registration={register('customerName')}
                    error={errors.customerName?.message}
                    required
                  />

                  <InputField
                    label="Customer Email"
                    type="email"
                    placeholder="Enter customer email"
                    registration={register('customerEmail')}
                    error={errors.customerEmail?.message}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Customer Phone"
                    type="tel"
                    placeholder="Enter phone number"
                    registration={register('customerPhone')}
                    error={errors.customerPhone?.message}
                  />

                  <InputField
                    label="Number of Attendees"
                    type="number"
                    placeholder="1"
                    registration={register('numberOfAttendees', { valueAsNumber: true })}
                    error={errors.numberOfAttendees?.message}
                    required
                  />
                </div>

                <TextareaField
                  label="Special Requests"
                  placeholder="Any special requirements or notes"
                  registration={register('specialRequests')}
                  error={errors.specialRequests?.message}
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Inventory Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Inventory Items
                </CardTitle>
                <CardDescription>
                  Select inventory items for this booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Inventory Item */}
                <div className="flex items-center space-x-2">
                  <select
                    className="flex-1 px-3 py-2 border rounded-md bg-background"
                    onChange={(e) => {
                      if (e.target.value) {
                        addInventoryItem(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Select inventory item to add</option>
                    {availableInventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Available: {item.quantity}) - ${item.unitPrice}
                      </option>
                    ))}
                  </select>
                  <Button type="button" size="sm" onClick={() => {}}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Selected Inventory Items */}
                {selectedInventory.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Selected Items</h4>
                    {selectedInventory.map(item => (
                      <div key={item.itemId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium">{item.name}</h5>
                          <p className="text-sm text-muted-foreground">
                            ${item.unitPrice} per unit (Available: {item.availableQuantity})
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max={item.availableQuantity}
                            value={item.quantity}
                            onChange={(e) => updateInventoryQuantity(item.itemId, parseInt(e.target.value) || 1)}
                            className="w-20 px-2 py-1 border rounded text-center"
                          />
                          <span className="text-sm font-medium">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInventoryItem(item.itemId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Custom Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Custom Items
                  </span>
                  <Button type="button" size="sm" onClick={addCustomItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Item
                  </Button>
                </CardTitle>
                <CardDescription>
                  Add custom items or services not in inventory
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {customItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No custom items added. Click "Add Custom Item" to add services or items not in inventory.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {customItems.map(item => (
                      <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 border rounded-lg">
                        <div className="col-span-5">
                          <input
                            type="text"
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => updateCustomItem(item.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCustomItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border rounded-md text-center"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Price"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateCustomItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        <div className="col-span-2 text-right font-medium">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedEvent?.basePrice && (
                  <div className="flex justify-between">
                    <span>Base Price ({watchAttendees} attendees)</span>
                    <span>${totals.baseTotal.toFixed(2)}</span>
                  </div>
                )}

                {totals.inventoryTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Inventory Items</span>
                    <span>${totals.inventoryTotal.toFixed(2)}</span>
                  </div>
                )}

                {totals.customTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Custom Items</span>
                    <span>${totals.customTotal.toFixed(2)}</span>
                  </div>
                )}

                <hr />

                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tax (10%)</span>
                  <span>${totals.tax.toFixed(2)}</span>
                </div>

                <hr />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>

                {selectedEvent && (
                  <div className="mt-4 p-3 bg-accent rounded-lg">
                    <h4 className="font-medium text-sm">Payment Terms</h4>
                    <p className="text-xs text-muted-foreground">
                      Advance: ${(totals.total * (selectedEvent.requiredAdvancePercentage / 100)).toFixed(2)} ({selectedEvent.requiredAdvancePercentage}%)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance: ${(totals.total * (1 - selectedEvent.requiredAdvancePercentage / 100)).toFixed(2)} (due {selectedEvent.balancePaymentWindowDays} days before event)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedEvent}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Booking
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/bookings')}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <strong>Inventory Items:</strong>
                  <p className="mt-1 text-muted-foreground">
                    Items will be allocated when booking is confirmed
                  </p>
                </div>
                <div className="text-sm">
                  <strong>Custom Items:</strong>
                  <p className="mt-1 text-muted-foreground">
                    Use for services or items not in your inventory
                  </p>
                </div>
                <div className="text-sm">
                  <strong>Payment:</strong>
                  <p className="mt-1 text-muted-foreground">
                    Advance payment will be required to confirm the booking
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
