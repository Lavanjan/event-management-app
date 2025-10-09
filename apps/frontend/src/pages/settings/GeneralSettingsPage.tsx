import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Settings,
  Building,
  Globe,

  Save,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

import { useOrganizationSettings, useUpdateOrganizationSettings } from '../../hooks/useSettings';
import { useThreeTierPermissions } from '../../hooks/useThreeTierPermissions';

const settingsSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  defaultAdvancePercentage: z.number().min(0).max(100),
  defaultBalancePaymentWindowDays: z.number().min(1),
  enableEmailNotifications: z.boolean(),
  enableSmsNotifications: z.boolean(),
  enableAutoBookingConfirmation: z.boolean(),
  enableInventoryTracking: z.boolean(),
  enableFinancialReporting: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const currencies = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'CNY', label: 'Chinese Yuan (¥)' },
  { value: 'BRL', label: 'Brazilian Real (R$)' },
  { value: 'MXN', label: 'Mexican Peso ($)' },
  { value: 'LKR', label: 'Sri Lankan Rupee (Rs.)' },
];

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (EST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEST)' },
  { value: 'Asia/Colombo', label: 'Sri Lanka Time (SLST)' },
];

export function GeneralSettingsPage() {
  const { hasPermission } = useThreeTierPermissions();
  const { data: settings, isLoading } = useOrganizationSettings();
  const updateSettings = useUpdateOrganizationSettings();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: '',
      description: '',
      website: '',
      phone: '',
      address: '',
      currency: 'LKR',
      timezone: 'Asia/Colombo',
      defaultAdvancePercentage: 25,
      defaultBalancePaymentWindowDays: 7,
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      enableAutoBookingConfirmation: true,
      enableInventoryTracking: true,
      enableFinancialReporting: true,
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      Object.entries(settings).forEach(([key, value]) => {
        if (value !== undefined) {
          setValue(key as keyof SettingsFormData, value);
        }
      });
    }
  }, [settings, setValue]);

  const onSubmit = (data: SettingsFormData) => {
    updateSettings.mutate(data);
  };

  if (!hasPermission('organizations.update')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access organization settings.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization's general settings and preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organization Information
            </CardTitle>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  {...register('displayName')}
                  className={errors.displayName ? 'border-red-500' : ''}
                />
                {errors.displayName && (
                  <p className="text-sm text-red-500 mt-1">{errors.displayName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Brief description of your organization"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...register('website')}
                  placeholder="https://example.com"
                  className={errors.website ? 'border-red-500' : ''}
                />
                {errors.website && (
                  <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="Organization address"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Regional Settings
            </CardTitle>
            <CardDescription>
              Configure currency, timezone, and regional preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency *</Label>
                <Select
                  value={watch('currency')}
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone *</Label>
                <Select
                  value={watch('timezone')}
                  onValueChange={(value) => setValue('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isDirty || updateSettings.isPending}
            className="min-w-[120px]"
          >
            {updateSettings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
