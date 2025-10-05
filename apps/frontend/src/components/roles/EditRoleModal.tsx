import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '../../hooks/use-toast';
import { Loader2, Shield, Search } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';

interface Permission {
  permissionKey: string;
  name: string;
  description: string;
  category: string;
  module: string;
  action: string;
  enabled: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  permissionKeys: string[];
}

interface GroupedPermissions {
  [category: string]: Permission[];
}

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role;
}

interface RoleFormData {
  name: string;
  description: string;
  isActive: boolean;
  permissions: string[];
}

export const EditRoleModal: React.FC<EditRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  role,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<RoleFormData>({
    name: role.name,
    description: role.description || '',
    isActive: role.isActive,
    permissions: role.permissionKeys || [],
  });

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadAvailablePermissions();
      setFormData({
        name: role.name,
        description: role.description || '',
        isActive: role.isActive,
        permissions: role.permissionKeys || [],
      });
    }
  }, [isOpen, role]);

  const loadAvailablePermissions = async () => {
    setLoadingPermissions(true);
    try {
      const response = await fetch('/api/roles/enhanced/available-permissions', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load available permissions');
      }

      const result = await response.json();
      if (result.success) {
        setAvailablePermissions(result.data.permissions);
        setGroupedPermissions(result.data.groupedPermissions);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available permissions.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a role name.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/roles/enhanced/${role.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Role updated successfully.',
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RoleFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionToggle = (permissionKey: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionKey],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permissionKey),
      }));
    }
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const categoryPermissions = groupedPermissions[category]?.map(p => p.permissionKey) || [];
    
    if (checked) {
      const newPermissions = [...formData.permissions];
      categoryPermissions.forEach(permKey => {
        if (!newPermissions.includes(permKey)) {
          newPermissions.push(permKey);
        }
      });
      setFormData(prev => ({ ...prev, permissions: newPermissions }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !categoryPermissions.includes(p)),
      }));
    }
  };

  const isCategorySelected = (category: string) => {
    const categoryPermissions = groupedPermissions[category]?.map(p => p.permissionKey) || [];
    return categoryPermissions.length > 0 && categoryPermissions.every(p => formData.permissions.includes(p));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = groupedPermissions[category]?.map(p => p.permissionKey) || [];
    const selectedCount = categoryPermissions.filter(p => formData.permissions.includes(p)).length;
    return selectedCount > 0 && selectedCount < categoryPermissions.length;
  };

  const filteredPermissions = availablePermissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as GroupedPermissions);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Edit Role: {role.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Event Manager, Finance Admin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>

            <div className="col-span-full space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of this role"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Permissions</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {formData.permissions.length} selected
                </Badge>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            {loadingPermissions ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-gray-500 mt-2">Loading permissions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(filteredGroupedPermissions).map(([category, permissions]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Checkbox
                            checked={isCategorySelected(category)}
                            onCheckedChange={(checked) => handleCategoryToggle(category, checked as boolean)}
                            className={isCategoryPartiallySelected(category) ? 'data-[state=checked]:bg-orange-500' : ''}
                          />
                          {category}
                        </CardTitle>
                        <Badge variant="secondary">
                          {permissions.filter(p => formData.permissions.includes(p.permissionKey)).length} / {permissions.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permissions.map((permission) => (
                          <div key={permission.permissionKey} className="flex items-start space-x-3">
                            <Checkbox
                              checked={formData.permissions.includes(permission.permissionKey)}
                              onCheckedChange={(checked) => 
                                handlePermissionToggle(permission.permissionKey, checked as boolean)
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{permission.name}</div>
                              <div className="text-xs text-gray-500">{permission.description}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                {permission.module}.{permission.action}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingPermissions}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
