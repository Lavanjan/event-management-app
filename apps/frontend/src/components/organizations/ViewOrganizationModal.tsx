import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Building2, Mail, Phone, Globe, Calendar, Users, MapPin } from 'lucide-react';
import { Organization } from '../../services/organizationService';

interface ViewOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
}

export function ViewOrganizationModal({ open, onOpenChange, organization }: ViewOrganizationModalProps) {
  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive || status === 'inactive') {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (status === 'suspended') {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="warning">Pending</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                  <p className="text-sm font-medium">{organization.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(organization.status, organization.isActive)}
                  </div>
                </div>
              </div>

              {organization.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{organization.description}</p>
                </div>
              )}

              {organization.slug && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Slug</label>
                  <p className="text-sm mt-1 font-mono bg-muted px-2 py-1 rounded">{organization.slug}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {organization.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm">{organization.email}</p>
                    </div>
                  </div>
                )}

                {organization.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-sm">{organization.phone}</p>
                    </div>
                  </div>
                )}

                {organization.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Website</label>
                      <a 
                        href={organization.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {organization.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          {(organization.address || organization.city || organization.state || organization.country || organization.zipCode) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Address Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="space-y-1">
                    {organization.address && <p className="text-sm">{organization.address}</p>}
                    <p className="text-sm">
                      {[organization.city, organization.state, organization.zipCode].filter(Boolean).join(', ')}
                    </p>
                    {organization.country && <p className="text-sm">{organization.country}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-sm">{new Date(organization.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="text-sm">{new Date(organization.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization ID</label>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{organization.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          {organization.settings && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(organization.settings).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm">
                        {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
