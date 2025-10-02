import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Calendar, MapPin, Users, DollarSign, Clock } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { useCreateEvent } from '../../hooks/useEvents';
import { useToast } from '../../hooks/use-toast';

const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: 'Event name is required',
  }),
  description: z.string().trim(),
  location: z.string().trim().min(1, {
    message: 'Location/Venue is required',
  }),
  maxAttendees: z.number().min(1, {
    message: 'Maximum attendees must be at least 1',
  }),
  hourlyPrice: z.number().min(0).optional(),
  halfDayPrice: z.number().min(0).optional(),
  fullDayPrice: z.number().min(0).optional(),
  requiredAdvancePercentage: z.number().min(0).max(100),
  balancePaymentWindowDays: z.number().min(1),
  allowInventoryAllocation: z.boolean(),
});

interface CreateEventFormProps {
  onClose: () => void;
}

export default function CreateEventForm({ onClose }: CreateEventFormProps) {
  const { toast } = useToast();
  const createEvent = useCreateEvent();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      maxAttendees: 50,
      hourlyPrice: 0,
      halfDayPrice: 0,
      fullDayPrice: 0,
      requiredAdvancePercentage: 50,
      balancePaymentWindowDays: 7,
      allowInventoryAllocation: true,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (createEvent.isPending) return;

    createEvent.mutate(values, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Event created successfully',
        });
        onClose();
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to create event',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1 text-center sm:text-left">
            Create Event Type
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Create a reusable event type template (e.g., Wedding Ceremony, Birthday Party) with
            pricing tiers
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">Event Type Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Wedding Ceremony" className="!h-[48px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Location
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Convention Center" className="!h-[48px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your event..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="hourlyPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Hourly Price
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="500.00"
                        className="!h-[48px]"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="halfDayPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Half Day Price (4-6 hrs)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="2000.00"
                        className="!h-[48px]"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullDayPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Full Day Price (8-12 hrs)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="3500.00"
                        className="!h-[48px]"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="maxAttendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <Users className="inline w-4 h-4 mr-1" />
                      Max Attendees
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        className="!h-[48px]"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiredAdvancePercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Advance Payment %
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="!h-[48px]"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balancePaymentWindowDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Balance Payment Days
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        className="!h-[48px]"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allowInventoryAllocation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Allow Inventory Allocation
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Enable inventory items to be allocated to this event
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createEvent.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEvent.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createEvent.isPending ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
