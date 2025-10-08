import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/use-toast';
import { FeaturePackage } from '../../services/featurePackageService';
import { api } from '../../services/api';
import { FormModal } from '../common/Modal';
import { TextField, TextareaField, SelectField, MultiSelectField, CheckboxField } from '../common/FormField';

interface EditFeaturePackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  featurePackage: FeaturePackage | null;
}

interface MasterPermission {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  module: string;
  action: string;
  isActive: boolean;
}

export function EditFeaturePackageModal({ open, onOpenChange, onSuccess, featurePackage }: EditFeaturePackageModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<MasterPermission[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    features: [] as string[],
    price: 0,
    billingCycle: 'monthly' as 'monthly' | 'yearly' | 'one-time',
    isActive: true,
    sortOrder: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && featurePackage) {
      setFormData({
        name: featurePackage.name,
        description: featurePackage.description || '',
        features: featurePackage.features || [],
        price: featurePackage.price,
        billingCycle: featurePackage.billingCycle,
        isActive: featurePackage.isActive,
        sortOrder: featurePackage.sortOrder,
      });
      loadMasterPermissions();
    }
  }, [open, featurePackage]);

  const loadMasterPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const response = await api.get('/permissions');
      setAvailablePermissions(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to load master permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available permissions.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // @ts-ignore
  const handleFeatureToggle = (permissionKey: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(permissionKey)
        ? prev.features.filter(key => key !== permissionKey)
        : [...prev.features, permissionKey]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Package name is required';
    }

    if (formData.features.length === 0) {
      newErrors.features = 'At least one feature must be selected';
    }

    if (formData.price < 0) {
      newErrors.price = 'Price must be non-negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !featurePackage) {
      return;
    }

    try {
      setLoading(true);
      await api.put(`/feature-packages/${featurePackage.id}`, formData);
      
      toast({
        title: 'Success',
        description: 'Feature package updated successfully.',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to update feature package:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update feature package.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open || !featurePackage) return null;

  // Group permissions by category
  // @ts-ignore
  const permissionsByCategory = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, MasterPermission[]>);

  // Prepare options for form fields
  const billingCycleOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'one-time', label: 'One-time' },
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
  ];

  const permissionOptions = availablePermissions.map(permission => ({
    value: permission.key,
    label: `${permission.module}.${permission.action} - ${permission.description}`,
  }));

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Feature Package"
      description="Update the feature package details and permissions"
      size="xl"
      onSubmit={handleSubmit}
      isSubmitting={loading}
      submitLabel="Update Package"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Package Name"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            placeholder="e.g., Professional Event Management"
            required
            error={errors.name}
          />

          <TextField
            label="Price"
            type="number"
            value={formData.price.toString()}
            onChange={(value) => handleInputChange('price', parseFloat(value) || 0)}
            placeholder="0.00"
            required
            error={errors.price}
          />

          <SelectField
            label="Billing Cycle"
            value={formData.billingCycle}
            onChange={(value) => handleInputChange('billingCycle', value)}
            options={billingCycleOptions}
          />
          <SelectField
            label="Currency"
            value={(formData as any).currency}
            onChange={(value) => handleInputChange('currency', value)}
            options={currencyOptions}
          />

          <TextField
            label="Sort Order"
            type="number"
            value={formData.sortOrder.toString()}
            onChange={(value) => handleInputChange('sortOrder', parseInt(value) || 0)}
            placeholder="0"
            description="Lower numbers appear first"
          />
        </div>

        <TextareaField
          label="Description"
          value={formData.description}
          onChange={(value) => handleInputChange('description', value)}
          placeholder="Describe what this package includes..."
          rows={3}
        />

        {/* Features Selection */}
        <MultiSelectField
          label="Features/Permissions"
          value={formData.features}
          onChange={(value) => handleInputChange('features', value)}
          options={permissionOptions}
          placeholder="Select permissions for this package"
          searchPlaceholder="Search permissions..."
          emptyText="No permissions available"
          disabled={loadingPermissions}
          error={errors.features}
          required
          description="Select the permissions that will be included in this feature package"
        />

        <CheckboxField
          label="Active (available for assignment)"
          checked={formData.isActive}
          onChange={(checked) => handleInputChange('isActive', checked)}
          description="When enabled, this package can be assigned to organizations"
        />
      </div>
    </FormModal>
  );
}
