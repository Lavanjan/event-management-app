import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Package, DollarSign, Hash, AlertTriangle } from 'lucide-react';
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
import { useCreateInventoryItem } from '../../hooks/useInventory';
import { useToast } from '../../hooks/use-toast';

const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: 'Item name is required',
  }),
  description: z.string().trim(),
  unitPrice: z.number().min(0, {
    message: 'Unit price must be 0 or greater',
  }),
  quantity: z.number().min(0, {
    message: 'Quantity must be 0 or greater',
  }),
  sku: z.string().trim().min(1, {
    message: 'SKU is required',
  }),
  category: z.string().min(1, {
    message: 'Category is required',
  }),
  minimumQuantity: z.number().min(0, {
    message: 'Minimum quantity must be 0 or greater',
  }),
});

const categories = [
  'av_equipment',
  'catering',
  'decor',
  'flooring',
  'furniture',
  'lighting',
  'linens',
];

interface CreateInventoryFormProps {
  onClose: () => void;
}

export default function CreateInventoryForm({ onClose }: CreateInventoryFormProps) {
  const { toast } = useToast();
  const createInventoryItem = useCreateInventoryItem();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      unitPrice: 0,
      quantity: 0,
      sku: '',
      category: '',
      minimumQuantity: 5,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (createInventoryItem.isPending) return;

    const inventoryData = {
      name: values.name,
      description: values.description,
      unitPrice: values.unitPrice,
      quantity: values.quantity,
      sku: values.sku,
      category: values.category,
      minimumQuantity: values.minimumQuantity,
    };

    createInventoryItem.mutate(inventoryData, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Inventory item created successfully',
        });
        onClose();
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to create inventory item',
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
            Add Inventory Item
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Add a new item to your inventory with all the necessary details
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
                      <Package className="inline w-4 h-4 mr-1" />
                      Item Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Round Table (8-person)"
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
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <Hash className="inline w-4 h-4 mr-1" />
                      SKU
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="RT-8P-001"
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
                      placeholder="Describe the inventory item..."
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Category
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="!h-[48px]">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Unit Price
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Quantity
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
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
                name="minimumQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <AlertTriangle className="inline w-4 h-4 mr-1" />
                      Minimum Quantity
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        className="!h-[48px]"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createInventoryItem.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInventoryItem.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createInventoryItem.isPending ? 'Creating...' : 'Add Item'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
