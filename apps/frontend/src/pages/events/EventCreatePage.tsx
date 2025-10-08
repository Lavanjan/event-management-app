import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { InputField, TextareaField, SelectField } from '../../components/forms/FormField';
import { LoadingSpinner } from '../../components/forms/LoadingSpinner';
import { useCreateEvent, useEventTemplates } from '../../hooks/useEvents';
import { format } from 'date-fns';

const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().min(1, 'Location is required'),
  type: z.string().min(1, 'Event type is required'),
  maxCapacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  basePrice: z.number().min(0, 'Price cannot be negative').optional(),
  requiredAdvancePercentage: z.number().min(0).max(100).default(50),
  balancePaymentWindowDays: z.number().min(0).default(7),
  allowInventoryAllocation: z.boolean().default(true),
  isTemplate: z.boolean().default(false),
  status: z.enum(['draft', 'active', 'cancelled']).default('draft'),
});

type EventFormData = z.infer<typeof eventSchema>;

const eventTypes = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'birthday', label: 'Birthday Party' },
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'exhibition', label: 'Exhibition' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
];

export function EventCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEvent = useCreateEvent();
  const { data: templates, isLoading: templatesLoading } = useEventTemplates();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      requiredAdvancePercentage: 50,
      balancePaymentWindowDays: 7,
      allowInventoryAllocation: true,
      isTemplate: false,
      status: 'draft',
    },
  });

  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');

  const onSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);

      // Convert string dates to Date objects
      const eventData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        maxCapacity: data.maxCapacity || undefined,
        basePrice: data.basePrice || undefined,
      };

      await createEvent.mutateAsync(eventData);
      navigate('/events');
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setValue('name', `${template.name} - ${format(new Date(), 'MMM dd, yyyy')}`);
      setValue('description', template.description || '');
      setValue('type', (template as any).type || '');
      setValue('maxCapacity', template.maxAttendees || 0);
      setValue('basePrice', template.fullDayPrice || 0);
      setValue('requiredAdvancePercentage', template.requiredAdvancePercentage);
      setValue('balancePaymentWindowDays', template.balancePaymentWindowDays);
      setValue('allowInventoryAllocation', template.allowInventoryAllocation);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/events')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Event</h1>
          <p className="text-muted-foreground">
            Set up a new event with all the necessary details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Enter the basic details for your event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Event Name"
                  placeholder="Enter event name"
                  registration={register('name')}
                  error={errors.name?.message}
                  required
                />

                <TextareaField
                  label="Description"
                  placeholder="Describe your event"
                  registration={register('description')}
                  error={errors.description?.message}
                  rows={3}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        label="Event Type"
                        placeholder="Select event type"
                        options={eventTypes}
                        value={field.value}
                        onValueChange={field.onChange}
                        error={errors.type?.message}
                        required
                      />
                    )}
                  />

                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        label="Status"
                        placeholder="Select status"
                        options={statusOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        error={errors.status?.message}
                        required
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Date & Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Date & Location
                </CardTitle>
                <CardDescription>
                  Set the event schedule and venue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Start Date"
                    type="datetime-local"
                    registration={register('startDate')}
                    error={errors.startDate?.message}
                    required
                  />

                  <InputField
                    label="End Date"
                    type="datetime-local"
                    registration={register('endDate')}
                    error={errors.endDate?.message}
                    required
                  />
                </div>

                <InputField
                  label="Location"
                  placeholder="Enter event location"
                  registration={register('location')}
                  error={errors.location?.message}
                  required
                />
              </CardContent>
            </Card>

            {/* Capacity & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Capacity & Pricing
                </CardTitle>
                <CardDescription>
                  Set event capacity and base pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Maximum Capacity"
                    type="number"
                    placeholder="Enter max attendees"
                    registration={register('maxCapacity', { valueAsNumber: true })}
                    error={errors.maxCapacity?.message}
                    description="Leave empty for unlimited capacity"
                  />

                  <InputField
                    label="Base Price"
                    type="number"
                    placeholder="0.00"
                    registration={register('basePrice', { valueAsNumber: true })}
                    error={errors.basePrice?.message}
                    description="Base price per person (optional)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Payment Settings
                </CardTitle>
                <CardDescription>
                  Configure payment terms and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Required Advance Percentage"
                    type="number"
                    placeholder="50"
                    registration={register('requiredAdvancePercentage', { valueAsNumber: true })}
                    error={errors.requiredAdvancePercentage?.message}
                    description="Percentage of total amount required as advance"
                  />

                  <InputField
                    label="Balance Payment Window (Days)"
                    type="number"
                    placeholder="7"
                    registration={register('balancePaymentWindowDays', { valueAsNumber: true })}
                    error={errors.balancePaymentWindowDays?.message}
                    description="Days before event when balance is due"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowInventoryAllocation"
                    {...register('allowInventoryAllocation')}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="allowInventoryAllocation" className="text-sm font-medium">
                    Allow inventory allocation for bookings
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isTemplate"
                    {...register('isTemplate')}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="isTemplate" className="text-sm font-medium">
                    Save as template for future events
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating Event...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Event
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/events')}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Event Templates */}
            {!templatesLoading && templates && templates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Templates</CardTitle>
                  <CardDescription>
                    Use a template to quickly set up your event
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {templates.slice(0, 5).map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateSelect(template.id)}
                        className="w-full p-3 text-left border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{(template as any).type || 'Event'}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Event Preview */}
            {watchStartDate && watchEndDate && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <strong>Duration:</strong>{' '}
                    {Math.ceil(
                      (new Date(watchEndDate).getTime() - new Date(watchStartDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{' '}
                    day(s)
                  </div>
                  <div className="text-sm">
                    <strong>Start:</strong> {format(new Date(watchStartDate), 'PPP p')}
                  </div>
                  <div className="text-sm">
                    <strong>End:</strong> {format(new Date(watchEndDate), 'PPP p')}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
