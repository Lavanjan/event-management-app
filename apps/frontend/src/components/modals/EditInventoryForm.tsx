import { useEffect } from 'react';
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
import { useUpdateInventoryItem } from '../../hooks/useInventory';
// @ts-ignore
import { useInventoryCategories } from '../../hooks/useInventoryCategories';
import { useToast } from '../../hooks/use-toast';
import { InventoryItem } from '../../types';

const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: 'Item name is required',
  }),
  description: z.string().trim().optional(),
  unitPrice: z.number().min(0, {
    message: 'Unit price must be 0 or greater',
  }),
  quantity: z.number().min(0, {
    message: 'Quantity must be 0 or greater',
  }),
  quantityUnit: z.string().min(1, {
    message: 'Quantity unit is required',
  }),
  sku: z.string().trim().optional(),
  categoryId: z.string().optional(),
  brand: z.string().trim().optional(),
  lowStockThreshold: z.number().min(0, {
    message: 'Low stock threshold must be 0 or greater',
  }),
});

// Quantity units for different types of items
// @ts-ignore
const quantityUnits = [
  { value: 'pieces', label: 'Pieces' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'mg', label: 'Milligrams (mg)' },
  { value: 'litre', label: 'Litres (L)' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'meter', label: 'Meters (m)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'mm', label: 'Millimeters (mm)' },
  { value: 'sqm', label: 'Square Meters (m²)' },
  { value: 'cubic_meter', label: 'Cubic Meters (m³)' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'pair', label: 'Pair' },
  { value: 'set', label: 'Set' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'roll', label: 'Roll' },
  { value: 'sheet', label: 'Sheet' },
  'linens',
];

interface EditInventoryFormProps {
  item: InventoryItem;
  onClose: () => void;
}

export default function EditInventoryForm({ item, onClose }: EditInventoryFormProps) {
  const { toast } = useToast();
  const updateInventoryItem = useUpdateInventoryItem();

  // @ts-ignore
  const categories = ['electronics', 'furniture', 'clothing', 'books', 'sports', 'other'];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      unitPrice: 0,
      quantity: 0,
      sku: '',
      categoryId: '',
      lowStockThreshold: 5,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name || '',
        description: item.description || '',
        unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
        quantity: item.quantity || 0,
        sku: item.metadata?.sku || '',
        categoryId: item.metadata?.categoryId || '',
        lowStockThreshold: item.metadata?.lowStockThreshold || 5,
      });
    }
  }, [item, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (updateInventoryItem.isPending) return;

    const inventoryData = {
      name: values.name,
      description: values.description,
      unitPrice: values.unitPrice,
      quantity: values.quantity,
      sku: values.sku,
      categoryId: values.categoryId,
      lowStockThreshold: values.lowStockThreshold || 5,
    };

    updateInventoryItem.mutate(
      { id: item.id, data: inventoryData },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Inventory item updated successfully',
          });
          onClose();
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Failed to update inventory item',
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
            Edit Inventory Item
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Update the inventory item details
          </p>
        </div>
        
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit as any)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
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
                control={form.control as any}
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
              control={form.control as any}
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
                control={form.control as any}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Category
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                control={form.control as any}
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
                // @ts-ignore
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
                // @ts-ignore
                control={form.control}
                // @ts-ignore
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
                disabled={updateInventoryItem.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateInventoryItem.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {updateInventoryItem.isPending ? 'Updating...' : 'Update Item'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
