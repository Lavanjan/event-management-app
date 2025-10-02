import { useState } from 'react';
import { Building2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { organizationService } from '../../services/organizationService';
import { useToast } from '../../hooks/use-toast';

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface CreateOrganizationFormData {
  name: string;
  slug: string;
  description: string;
  admin: {
    email: string;
    firstName: string;
    lastName: string;
    autoGeneratePassword: boolean;
    requiresVerification: boolean;
  };
}

export function CreateOrganizationModal({ open, onOpenChange, onSuccess }: CreateOrganizationModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOrganizationFormData>({
    name: '',
    slug: '',
    description: '',
    admin: {
      email: '',
      firstName: '',
      lastName: '',
      autoGeneratePassword: true,
      requiresVerification: true,
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      await organizationService.createOrganization(formData);

      toast({
        title: 'Success',
        description: 'Organization created successfully.',
      });

      // Reset form
      setFormData({
        name: '',
        slug: '',
        description: '',
        admin: {
          email: '',
          firstName: '',
          lastName: '',
        },
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
              {loading ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
