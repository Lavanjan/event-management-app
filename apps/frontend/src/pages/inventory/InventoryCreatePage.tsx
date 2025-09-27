import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Package, Save, DollarSign, Hash } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { InputField, TextareaField, SelectField } from '../../components/forms/FormField';
import { LoadingSpinner } from '../../components/forms/LoadingSpinner';
import { useCreateInventoryItem, useInventoryCategories } from '../../hooks/useInventory';

const inventorySchema = z.object({
  name: z.string().min(1, 'Item name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU too long'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  minimumQuantity: z.number().min(0, 'Minimum quantity cannot be negative').default(0),
  unitPrice: z.number().min(0, 'Price cannot be negative'),
  metadata: z.record(z.string()).optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

const defaultCategories = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'audio-visual', label: 'Audio/Visual' },
  { value: 'decorations', label: 'Decorations' },
  { value: 'catering', label: 'Catering Equipment' },
  { value: 'linens', label: 'Linens & Textiles' },
  { value: 'other', label: 'Other' },
];

export function InventoryCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createInventoryItem = useCreateInventoryItem();
  const { data: categories, isLoading: categoriesLoading } = useInventoryCategories();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      minimumQuantity: 0,
      quantity: 0,
      unitPrice: 0,
    },
  });

  const onSubmit = async (data: InventoryFormData) => {
    try {
      setIsSubmitting(true);
      await createInventoryItem.mutateAsync(data);
      navigate('/inventory');
    } catch (error) {
      console.error('Failed to create inventory item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combine default categories with existing ones
  const categoryOptions = React.useMemo(() => {
    const existingCategories = categories?.map(cat => ({ value: cat, label: cat })) || [];
    const allCategories = [...defaultCategories];

    // Add existing categories that aren't in defaults
    existingCategories.forEach(cat => {
      if (!allCategories.find(def => def.value === cat.value)) {
        allCategories.push(cat);
      }
    });

    return allCategories;
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/inventory')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add Inventory Item</h1>
          <p className="text-muted-foreground">
            Add a new item to your inventory
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
                  <Package className="mr-2 h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Enter the basic details for your inventory item
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Item Name"
                  placeholder="Enter item name"
                  registration={register('name')}
                  error={errors.name?.message}
                  required
                />

                <TextareaField
                  label="Description"
                  placeholder="Describe the item"
                  registration={register('description')}
                  error={errors.description?.message}
                  rows={3}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="SKU"
                    placeholder="Enter SKU code"
                    registration={register('sku')}
                    error={errors.sku?.message}
                    required
                    description="Unique identifier for this item"
                  />

                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        label="Category"
                        placeholder="Select category"
                        options={categoryOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        error={errors.category?.message}
                        required
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quantity & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hash className="mr-2 h-5 w-5" />
                  Quantity & Pricing
                </CardTitle>
                <CardDescription>
                  Set quantities and pricing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Current Quantity"
                    type="number"
                    placeholder="0"
                    registration={register('quantity', { valueAsNumber: true })}
                    error={errors.quantity?.message}
                    required
                    description="Available quantity"
                  />

                  <InputField
                    label="Minimum Quantity"
                    type="number"
                    placeholder="0"
                    registration={register('minimumQuantity', { valueAsNumber: true })}
                    error={errors.minimumQuantity?.message}
                    description="Alert when below this level"
                  />

                  <InputField
                    label="Unit Price"
                    type="number"
                    placeholder="0.00"
                    registration={register('unitPrice', { valueAsNumber: true })}
                    error={errors.unitPrice?.message}
                    required
                    description="Price per unit"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
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
                      Creating Item...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Item
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/inventory')}
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
                  <strong>SKU Guidelines:</strong>
                  <ul className="mt-1 text-muted-foreground list-disc list-inside">
                    <li>Use unique codes</li>
                    <li>Keep it short and memorable</li>
                    <li>Consider using prefixes by category</li>
                  </ul>
                </div>
                <div className="text-sm">
                  <strong>Minimum Quantity:</strong>
                  <p className="mt-1 text-muted-foreground">
                    Set this to get alerts when stock runs low
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
