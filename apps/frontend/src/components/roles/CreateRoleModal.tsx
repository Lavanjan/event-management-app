import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '../../hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { Badge } from '../ui/badge';
import { api } from '../../services/api';
import { FormModal } from '../common/Modal';

interface Permission {
  permissionKey: string;
  name: string;
  description: string;
  category: string;
  module: string;
  action: string;
  enabled: boolean;
}

interface GroupedPermissions {
  [category: string]: Permission[];
}

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
  });

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadAvailablePermissions();
    }
  }, [isOpen]);

  const loadAvailablePermissions = async () => {
    setLoadingPermissions(true);
    try {
      const response = await api.get('/enhanced-roles/available-permissions');
      if (response.data.success) {
        setAvailablePermissions(response.data.data.permissions);
        setGroupedPermissions(response.data.data.groupedPermissions);
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

    if (formData.permissions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one permission.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/enhanced-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create role');
      }

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Role created successfully.',
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create role. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RoleFormData, value: string | string[]) => {
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
      // Add all permissions from this category
      const newPermissions = [...formData.permissions];
      categoryPermissions.forEach(permKey => {
        if (!newPermissions.includes(permKey)) {
          newPermissions.push(permKey);
        }
      });
      setFormData(prev => ({ ...prev, permissions: newPermissions }));
    } else {
      // Remove all permissions from this category
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
    <FormModal
      open={isOpen}
      onOpenChange={onClose}
      title="Create New Role"
      description="Create a new role and assign permissions"
      size="4xl"
      onSubmit={handleSubmit}
      isSubmitting={loading}
      submitLabel="Create Role"
      submitDisabled={loadingPermissions}
    >
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

    </FormModal>
  );
};
