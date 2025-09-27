import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Building2, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Users,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { organizationService, Organization } from '../../services/organizationService';
import { useToast } from '../../hooks/use-toast';
import { LoadingSpinner } from '../../components/ui/loading-spinner';

export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrganization();
    }
  }, [id]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const org = await organizationService.getOrganization(id!);
      setOrganization(org);
    } catch (error) {
      console.error('Failed to load organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organization details. Please try again.',
        variant: 'destructive',
      });
      navigate('/organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (action: 'activate' | 'suspend' | 'deactivate') => {
    if (!organization) return;

    try {
      let updatedOrg: Organization;
      switch (action) {
        case 'activate':
          updatedOrg = await organizationService.activateOrganization(organization.id);
          break;
        case 'suspend':
          updatedOrg = await organizationService.suspendOrganization(organization.id);
          break;
        case 'deactivate':
          updatedOrg = await organizationService.deactivateOrganization(organization.id);
          break;
      }

      setOrganization(updatedOrg);
      toast({
        title: 'Success',
        description: `Organization ${action}d successfully.`,
      });
    } catch (error) {
      console.error(`Failed to ${action} organization:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} organization. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive || status === 'inactive') {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (status === 'suspended') {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">Organization not found</h2>
        <p className="text-muted-foreground mb-4">
          The organization you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/organizations')}>
          Back to Organizations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/organizations')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-muted-foreground" />
              <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
              {getStatusBadge(organization.status, organization.isActive)}
            </div>
            <p className="text-muted-foreground">
              Organization details and management
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link to={`/organizations/${organization.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {organization.status !== 'active' && (
                <DropdownMenuItem onClick={() => handleStatusChange('activate')}>
                  Activate Organization
                </DropdownMenuItem>
              )}
              {organization.status === 'active' && (
                <DropdownMenuItem onClick={() => handleStatusChange('suspend')}>
                  Suspend Organization
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleStatusChange('deactivate')}>
                Deactivate Organization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{organization.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Slug</label>
                  <p className="text-sm font-mono">{organization.slug}</p>
                </div>
              </div>
              
              {organization.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{organization.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {organization.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm">{organization.email}</p>
                    </div>
                  </div>
                )}
                
                {organization.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-sm">{organization.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {organization.website && (
                <div className="flex items-center space-x-2">
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
            </CardContent>
          </Card>

          {/* Address Information */}
          {(organization.address || organization.city || organization.state || organization.country) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {organization.address && <p className="text-sm">{organization.address}</p>}
                  <p className="text-sm">
                    {[organization.city, organization.state, organization.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {organization.country && <p className="text-sm">{organization.country}</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Quick Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(organization.status, organization.isActive)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {new Date(organization.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">
                  {new Date(organization.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to={`/users?organization=${organization.id}`}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to={`/events?organization=${organization.id}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  View Events
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to={`/organizations/${organization.id}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Organization Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
