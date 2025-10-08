import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Package, DollarSign, Hash, AlertTriangle, Scale } from 'lucide-react';
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
import { useInventoryCategories } from '../../hooks/useInventoryCategories';
import { useToast } from '../../hooks/use-toast';

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
];

interface CreateInventoryFormProps {
  onClose: () => void;
}

export default function CreateInventoryForm({ onClose }: CreateInventoryFormProps) {
  const { toast } = useToast();
  const createInventoryItem = useCreateInventoryItem();
  const { categories, isLoading: categoriesLoading } = useInventoryCategories();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      unitPrice: 0,
      quantity: 0,
      quantityUnit: 'pieces',
      sku: '',
      categoryId: '',
      brand: '',
      lowStockThreshold: 5,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (createInventoryItem.isPending) return;

    const inventoryData = {
      name: values.name,
      description: values.description || undefined,
      unitPrice: values.unitPrice,
      quantity: values.quantity,
      quantityUnit: values.quantityUnit,
      sku: values.sku || undefined,
      categoryId: values.categoryId || undefined,
      brand: values.brand || undefined,
      lowStockThreshold: values.lowStockThreshold,
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
                name="categoryId"
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
                        <SelectItem value="">No Category</SelectItem>
                        {categoriesLoading ? (
                          <SelectItem value="" disabled {...({} as any)}>Loading categories...</SelectItem>
                        ) : (
                          categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Brand
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., IKEA, Samsung"
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
                      placeholder="0.00"
                      className="!h-[48px]"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        step="0.001"
                        placeholder="0"
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
                name="quantityUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <Scale className="inline w-4 h-4 mr-1" />
                      Unit
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="!h-[48px]">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {quantityUnits.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
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
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      <AlertTriangle className="inline w-4 h-4 mr-1" />
                      Low Stock Alert
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder="5"
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
