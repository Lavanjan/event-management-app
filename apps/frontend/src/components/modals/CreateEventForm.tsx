
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Calendar, MapPin, Users, DollarSign, Clock } from 'lucide-react';
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
import { Checkbox } from '../ui/checkbox';
import { useCreateEvent } from '../../hooks/useEvents';
import { useToast } from '../../hooks/use-toast';

const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: 'Event name is required',
  }),
  description: z.string().trim(),
  location: z.string().trim().min(1, {
    message: 'Location is required',
  }),
  startDate: z.string().min(1, {
    message: 'Start date is required',
  }),
  endDate: z.string().min(1, {
    message: 'End date is required',
  }),
  maxAttendees: z.number().min(1, {
    message: 'Maximum attendees must be at least 1',
  }),
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
      startDate: '',
      endDate: '',
      maxAttendees: 50,
      requiredAdvancePercentage: 50,
      balancePaymentWindowDays: 30,
      allowInventoryAllocation: true,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (createEvent.isPending) return;

    const eventData = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
    };

    createEvent.mutate(eventData, {
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
            Create Event
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Create a new event with all the necessary details and settings
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
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Event Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Annual Conference 2024"
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Location
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Convention Center"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                    Description
                  </FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Start Date & Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
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
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <Clock className="inline w-4 h-4 mr-1" />
                      End Date & Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="!h-[48px]"
                        {...field}
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
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
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
