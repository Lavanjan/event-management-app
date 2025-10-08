import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
// @ts-ignore
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../../hooks/use-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Organization, organizationService } from '../../services/organizationService';
import { featurePackageService, FeaturePackage, OrganizationPackage } from '../../services/featurePackageService';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Package, DollarSign, Loader2, Plus, Trash2 } from 'lucide-react';

interface EditOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
  onSuccess: () => void;
}

interface EditOrganizationForm {
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  status: string;
}

export function EditOrganizationModal({ open, onOpenChange, organization, onSuccess }: EditOrganizationModalProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EditOrganizationForm>({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    status: 'active',
  });
  const { toast } = useToast();

  // Feature package state
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<FeaturePackage[]>([]);
  const [currentPackages, setCurrentPackages] = useState<OrganizationPackage[]>([]);
  const [packagesChanged, setPackagesChanged] = useState(false);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        country: organization.country || '',
        zipCode: (organization as any).zipCode || '',
        status: organization.status || 'active',
      });
    }
  }, [organization]);

  // Load feature packages when modal opens
  useEffect(() => {
    if (open && organization) {
      loadFeaturePackages();
      loadCurrentPackages();
    }
  }, [open, organization]);

  const loadFeaturePackages = async () => {
    try {
      setLoadingPackages(true);
      const packages = await featurePackageService.getAllFeaturePackages();
      setAvailablePackages(packages.filter(pkg => pkg.isActive));
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

  const loadCurrentPackages = async () => {
    try {
      const packages = await featurePackageService.getOrganizationPackages(organization.id);
      setCurrentPackages(packages);
    } catch (error) {
      console.error('Failed to load current packages:', error);
    }
  };

  const handlePackageToggle = async (packageId: string) => {
    const isCurrentlyAssigned = currentPackages.some(pkg => pkg.featurePackageId === packageId);

    try {
      if (isCurrentlyAssigned) {
        // Remove package (this will leave organization with no package)
        await featurePackageService.removePackageFromOrganization(organization.id, packageId);
        setCurrentPackages([]);
        toast({
          title: 'Success',
          description: 'Feature package removed successfully.',
        });
      } else {
        // Assign package (this will replace any existing package due to license model)
        const newPackage = await featurePackageService.assignPackageToOrganization({
          organizationId: organization.id,
          featurePackageId: packageId,
          assignedBy: user?.id || '',
        });
        setCurrentPackages([newPackage]); // Only one package allowed
        toast({
          title: 'Success',
          description: 'Feature package assigned successfully. Previous package (if any) has been replaced.',
        });
      }
      setPackagesChanged(true);
    } catch (error) {
      console.error('Failed to toggle package:', error);
      toast({
        title: 'Error',
        description: 'Failed to update feature package assignment.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await organizationService.updateOrganization(organization.id, {
        name: formData.name,
        description: formData.description || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
        // @ts-ignore
        zipCode: formData.zipCode || undefined,
        status: formData.status as any,
      });

      toast({
        title: 'Success',
        description: 'Organization updated successfully.',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Failed to update organization:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update organization. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EditOrganizationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Organization Details</TabsTrigger>
              <TabsTrigger value="packages" className="relative">
                Feature Packages
                {packagesChanged && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full"></div>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="packages" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <h3 className="text-lg font-medium">Feature Packages</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage feature packages assigned to this organization. Changes are applied immediately.
            </p>

            {loadingPackages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading feature packages...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Currently Assigned Packages */}
                <div>
                  <h4 className="text-md font-medium mb-3">Currently Assigned</h4>
                  {currentPackages.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No feature packages assigned</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {currentPackages.map((orgPkg) => (
                        <Card key={orgPkg.id} className="border-green-200 bg-green-50">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base">{orgPkg.featurePackage?.name || 'Unknown Package'}</CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePackageToggle(orgPkg.featurePackageId)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {orgPkg.featurePackage?.description && (
                              <p className="text-sm text-muted-foreground mb-2">{orgPkg.featurePackage.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                {(orgPkg.featurePackage?.price || 0) > 0 ? `$${orgPkg.featurePackage.price}` : 'Free'}
                                <Badge variant="outline" className="ml-1 text-xs">
                                  {orgPkg.featurePackage?.billingCycle || 'monthly'}
                                </Badge>
                              </div>
                              <Badge variant="default" className="text-xs">Active</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Packages */}
                <div>
                  <h4 className="text-md font-medium mb-3">Available Packages</h4>
                  {availablePackages.filter(pkg => !currentPackages.some(current => current.featurePackageId === pkg.id)).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>All available packages are already assigned</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {availablePackages
                        .filter(pkg => !currentPackages.some(current => current.featurePackageId === pkg.id))
                        .map((pkg) => (
                          <Card key={pkg.id} className="cursor-pointer hover:shadow-md transition-all">
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base">{pkg.name}</CardTitle>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePackageToggle(pkg.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              {pkg.description && (
                                <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>
                              )}
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                {pkg.price > 0 ? `$${pkg.price}` : 'Free'}
                                <Badge variant="outline" className="ml-1 text-xs">
                                  {pkg.billingCycle}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
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
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              Update Organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
