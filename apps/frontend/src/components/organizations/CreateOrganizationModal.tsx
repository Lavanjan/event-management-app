import { useState, useEffect, useCallback } from 'react';
import { Building2, Package, DollarSign, Loader2, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { organizationService } from '../../services/organizationService';
import { featurePackageService, FeaturePackage } from '../../services/featurePackageService';
import { useToast } from '../../hooks/use-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getSupportedCurrencies } from '../../utils/currency';

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface CreateOrganizationFormData {
  name: string;
  slug: string;
  description: string;
  currency: string;
  admin: {
    email: string;
    firstName: string;
    lastName: string;
    autoGeneratePassword: boolean;
    requiresVerification: boolean;
  };
  selectedPackage: string; // Single feature package ID (license model)
}

export function CreateOrganizationModal({ open, onOpenChange, onSuccess }: CreateOrganizationModalProps) {
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<FeaturePackage[]>([]);
  const [formData, setFormData] = useState<CreateOrganizationFormData>({
    name: '',
    slug: '',
    description: '',
    currency: 'LKR', // Default to LKR
    admin: {
      email: '',
      firstName: '',
      lastName: '',
      autoGeneratePassword: true,
      requiresVerification: true,
    },
    selectedPackage: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load available feature packages when modal opens
  useEffect(() => {
    if (open) {
      loadFeaturePackages();
    }
  }, [open]);

  const loadFeaturePackages = async () => {
    try {
      setLoadingPackages(true);
      const packages = await featurePackageService.getActiveFeaturePackages();
      setAvailablePackages(packages);
    } catch (error) {
      console.error('Failed to load feature packages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load feature packages.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('admin.')) {
      const adminField = field.replace('admin.', '');
      let processedValue: any = value;

      // Handle boolean fields
      if (adminField === 'autoGeneratePassword' || adminField === 'requiresVerification') {
        processedValue = value === 'true';
      }

      setFormData(prev => ({
        ...prev,
        admin: {
          ...prev.admin,
          [adminField]: processedValue,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }

    // Auto-generate slug from name
    if (field === 'name' && value) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePackageToggle = useCallback((packageId: string) => {
    setFormData(prev => {
      const newSelectedPackage = prev.selectedPackage === packageId ? '' : packageId;
      return {
        ...prev,
        selectedPackage: newSelectedPackage
      };
    });
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Organization slug is required';
    }

    if (!formData.admin.email.trim()) {
      newErrors['admin.email'] = 'Admin email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin.email)) {
      newErrors['admin.email'] = 'Please enter a valid email address';
    }

    if (!formData.admin.firstName.trim()) {
      newErrors['admin.firstName'] = 'Admin first name is required';
    }

    if (!formData.admin.lastName.trim()) {
      newErrors['admin.lastName'] = 'Admin last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Create organization
      const organizationResponse = await organizationService.createOrganization(formData);
      const organizationId = (organizationResponse as any).data?.id || organizationResponse.id;

      // Assign selected feature package
      if (formData.selectedPackage && organizationId && user?.id) {
        try {
          await featurePackageService.assignPackageToOrganization({
            organizationId,
            featurePackageId: formData.selectedPackage,
            assignedBy: user.id,
          });
        } catch (packageError) {
          console.error('Failed to assign feature packages:', packageError);
          toast({
            title: 'Warning',
            description: 'Organization created but some feature packages could not be assigned.',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Success',
        description: `Organization created successfully${formData.selectedPackage ? ' with feature package assigned' : ''}.`,
      });

      // Reset form
      setFormData({
        name: '',
        slug: '',
        description: '',
        currency: 'LKR', // Default to LKR
        admin: {
          email: '',
          firstName: '',
          lastName: '',
          autoGeneratePassword: true,
          requiresVerification: true,
        },
        selectedPackage: '',
      });
      setErrors({});

      // Close modal and refresh list
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      
      if (error.response?.data?.message) {
        toast({
          title: 'Error',
          description: error.response.data.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create organization. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Create New Organization</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Organization Details</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter organization name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Organization Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="organization-slug"
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter organization description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency *</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {getSupportedCurrencies().map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center space-x-2">
                        <span>{currency.symbol}</span>
                        <span>{currency.code}</span>
                        <span className="text-muted-foreground">- {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This will be used for all pricing and financial calculations in the organization.
              </p>
            </div>
          </div>

          {/* Admin Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Organization Admin</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin.firstName">First Name *</Label>
                <Input
                  id="admin.firstName"
                  value={formData.admin.firstName}
                  onChange={(e) => handleInputChange('admin.firstName', e.target.value)}
                  placeholder="Enter first name"
                  className={errors['admin.firstName'] ? 'border-red-500' : ''}
                />
                {errors['admin.firstName'] && <p className="text-sm text-red-500">{errors['admin.firstName']}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin.lastName">Last Name *</Label>
                <Input
                  id="admin.lastName"
                  value={formData.admin.lastName}
                  onChange={(e) => handleInputChange('admin.lastName', e.target.value)}
                  placeholder="Enter last name"
                  className={errors['admin.lastName'] ? 'border-red-500' : ''}
                />
                {errors['admin.lastName'] && <p className="text-sm text-red-500">{errors['admin.lastName']}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin.email">Email Address *</Label>
              <Input
                id="admin.email"
                type="email"
                value={formData.admin.email}
                onChange={(e) => handleInputChange('admin.email', e.target.value)}
                placeholder="admin@organization.com"
                className={errors['admin.email'] ? 'border-red-500' : ''}
              />
              {errors['admin.email'] && <p className="text-sm text-red-500">{errors['admin.email']}</p>}
            </div>

            {/* Admin Options */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium">Admin Account Options</h4>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="admin.autoGeneratePassword"
                  checked={formData.admin.autoGeneratePassword}
                  onChange={(e) => handleInputChange('admin.autoGeneratePassword', e.target.checked.toString())}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="admin.autoGeneratePassword" className="text-sm">
                  Auto-generate password and send via email
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="admin.requiresVerification"
                  checked={formData.admin.requiresVerification}
                  onChange={(e) => handleInputChange('admin.requiresVerification', e.target.checked.toString())}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="admin.requiresVerification" className="text-sm">
                  Require email verification before account activation
                </Label>
              </div>

              <p className="text-xs text-muted-foreground">
                {formData.admin.requiresVerification
                  ? "Admin will receive a verification email with OTP before they can access their account."
                  : "Admin account will be immediately active after creation."
                }
              </p>
            </div>
          </div>

          {/* Feature Packages */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <h3 className="text-lg font-medium">Feature Packages</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Select feature packages to assign to this organization. These determine what features and permissions will be available.
            </p>

            {loadingPackages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading feature packages...</span>
              </div>
            ) : availablePackages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No feature packages available</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {availablePackages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`cursor-pointer transition-all ${
                      formData.selectedPackage === pkg.id
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handlePackageToggle(pkg.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-4 w-4 rounded-sm border flex items-center justify-center ${
                            formData.selectedPackage === pkg.id
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-gray-300'
                          }`}>
                            {formData.selectedPackage === pkg.id && <Check className="h-3 w-3" />}
                          </div>
                          <CardTitle className="text-base">{pkg.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          {pkg.price > 0 ? `$${pkg.price}` : 'Free'}
                          <Badge variant="outline" className="ml-1 text-xs">
                            {pkg.billingCycle}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {pkg.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {pkg.features.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{pkg.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {formData.selectedPackage && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Package selected: {availablePackages.find(pkg => pkg.id === formData.selectedPackage)?.name}
                </p>
                <p className="text-xs text-blue-700">
                  This package will be assigned to the organization after creation.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                formData.selectedPackage
                  ? 'Creating & Assigning Package...'
                  : 'Creating...'
              ) : 'Create Organization'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
