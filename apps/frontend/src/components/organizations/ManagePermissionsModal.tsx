import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import { Organization } from '../../services/organizationService';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Shield, Users, Calendar, DollarSign, Settings, BarChart3, Package } from 'lucide-react';

interface ManagePermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
  onSuccess: () => void;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  permissions: Permission[];
}

export function ManagePermissionsModal({ open, onOpenChange, organization, onSuccess }: ManagePermissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<PermissionCategory[]>([]);
  const { toast } = useToast();

  // Category icons mapping
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      dashboard: <BarChart3 className="h-4 w-4" />,
      events: <Calendar className="h-4 w-4" />,
      bookings: <Users className="h-4 w-4" />,
      financial: <DollarSign className="h-4 w-4" />,
      users: <Users className="h-4 w-4" />,
      settings: <Settings className="h-4 w-4" />,
      inventory: <Package className="h-4 w-4" />,
    };
    return iconMap[category] || <Settings className="h-4 w-4" />;
  };

  useEffect(() => {
    if (open && organization) {
      loadPermissions();
    }
  }, [open, organization]);

  const loadPermissions = async () => {
    if (!organization) return;

    setLoading(true);
    try {
      // Load permissions from API
      const response = await fetch(`http://localhost:3001/api/organizations/${organization.id}/permissions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Loaded permissions from API:', result);

        if (result.success && result.data && result.data.permissions) {
          const { data } = result;

          // Group permissions by category
          const permissionsByCategory: Record<string, any[]> = {};
          data.permissions.forEach((perm: any) => {
            if (!permissionsByCategory[perm.category]) {
              permissionsByCategory[perm.category] = [];
            }
            permissionsByCategory[perm.category].push(perm);
          });

          console.log('Permissions by category:', permissionsByCategory);

          // Convert to our permission categories format using only API data
          const loadedPermissions: PermissionCategory[] = Object.keys(permissionsByCategory).map(categoryKey => {
            const categoryPermissions = permissionsByCategory[categoryKey];
            const categoryName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);

            return {
              id: categoryKey,
              name: categoryName,
              description: `Manage ${categoryName.toLowerCase()} related permissions`,
              icon: getCategoryIcon(categoryKey),
              permissions: categoryPermissions.map((perm: any) => ({
                id: perm.id,
                name: perm.name,
                description: perm.description,
                category: perm.category,
                enabled: Boolean(perm.enabled)
              }))
            };
          });

          console.log('Final loaded permissions from API:', loadedPermissions);

          // Debug specific permission that's causing issues
          const dashboardCategory = loadedPermissions.find(cat => cat.id === 'dashboard');
          if (dashboardCategory) {
            const reportsPermission = dashboardCategory.permissions.find((p: any) => p.id === 'dashboard.reports');
            if (reportsPermission) {
              console.log('Dashboard reports permission final state:', reportsPermission);
            }
          }

          setPermissions(loadedPermissions);
        } else {
          console.log('No permissions data in response');
          setPermissions([]);
        }
      } else {
        console.error('Failed to load permissions:', response.status, response.statusText);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (categoryId: string, permissionId: string, enabled: boolean) => {
    setPermissions(prev => 
      prev.map(category => 
        category.id === categoryId 
          ? {
              ...category,
              permissions: category.permissions.map(permission =>
                permission.id === permissionId 
                  ? { ...permission, enabled }
                  : permission
              )
            }
          : category
      )
    );
  };

  const handleCategoryToggle = (categoryId: string, enabled: boolean) => {
    setPermissions(prev => 
      prev.map(category => 
        category.id === categoryId 
          ? {
              ...category,
              permissions: category.permissions.map(permission => ({ ...permission, enabled }))
            }
          : category
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert permissions to the format expected by the API
      const permissionsToSave = permissions.flatMap(category =>
        category.permissions.map(permission => ({
          id: permission.id,
          name: permission.name,
          description: permission.description,
          category: permission.category, // Use the permission's category field
          enabled: permission.enabled,
        }))
      );

      // Call the API to update permissions
      const response = await fetch(`http://localhost:3001/api/organizations/${organization.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ permissions: permissionsToSave }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }

      toast({
        title: 'Success',
        description: 'Permissions updated successfully.',
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to save permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to save permissions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getEnabledCount = (category: PermissionCategory) => {
    return category.permissions.filter(p => p.enabled).length;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions - {organization.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {permissions.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {category.icon}
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge variant="outline">
                      {getEnabledCount(category)}/{category.permissions.length} enabled
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`category-${category.id}`} className="text-sm">
                      Enable All
                    </Label>
                    <Switch
                      id={`category-${category.id}`}
                      checked={category.permissions.every(p => p.enabled)}
                      onCheckedChange={(checked) => handleCategoryToggle(category.id, checked)}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{permission.name}</h4>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{permission.id}</code>
                        </div>
                        <p className="text-sm text-muted-foreground">{permission.description}</p>
                      </div>
                      <Switch
                        checked={Boolean(permission.enabled)}
                        onCheckedChange={(checked) => {
                          console.log(`Toggle ${permission.id}: current=${permission.enabled} (type=${typeof permission.enabled}), Boolean=${Boolean(permission.enabled)}, new=${checked}`);
                          handlePermissionToggle(category.id, permission.id, checked);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <LoadingSpinner size="sm" className="mr-2" />}
            Save Permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
