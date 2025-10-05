import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { 
  Shield, 
  Search, 
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Filter,
  Users,
  Settings,
  FileText,
  CreditCard,
  Calendar,
  Package,
  BarChart3
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { useUpdateRolePermissions } from '../../hooks/useRoles';

interface Permission {
  id: string;
  permissionKey: string;
  name: string;
  description: string;
  category: string;
  module: string;
  action: string;
  isSystemPermission: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  scope: string;
  isActive: boolean;
  permissionKeys: string[];
}

interface ManageRolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  onPermissionsUpdated?: () => void;
}

const categoryIcons: Record<string, React.ComponentType<any>> = {
  'User Management': Users,
  'Role Management': Shield,
  'Event Management': Calendar,
  'Booking Management': Calendar,
  'Payment Management': CreditCard,
  'Document Management': FileText,
  'Inventory Management': Package,
  'Financial Management': BarChart3,
  'System Administration': Settings,
};

export const ManageRolePermissionsModal: React.FC<ManageRolePermissionsModalProps> = ({
  isOpen,
  onClose,
  role,
  onPermissionsUpdated,
}) => {
  const { toast } = useToast();
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions();
  const updateRolePermissionsMutation = useUpdateRolePermissions();
  
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selected permissions when role changes
  useEffect(() => {
    if (role?.permissionKeys) {
      setSelectedPermissions(new Set(role.permissionKeys));
    }
  }, [role]);

  // Filter permissions based on search and category
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = 
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.permissionKey.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group permissions by category
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Get unique categories
  const categories = Array.from(new Set(permissions.map(p => p.category))).sort();

  const handlePermissionToggle = (permissionKey: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionKey)) {
      newSelected.delete(permissionKey);
    } else {
      newSelected.add(permissionKey);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSelectAllInCategory = (category: string) => {
    const categoryPermissions = groupedPermissions[category] || [];
    const newSelected = new Set(selectedPermissions);
    
    const allSelected = categoryPermissions.every(p => newSelected.has(p.permissionKey));
    
    if (allSelected) {
      // Deselect all in category
      categoryPermissions.forEach(p => newSelected.delete(p.permissionKey));
    } else {
      // Select all in category
      categoryPermissions.forEach(p => newSelected.add(p.permissionKey));
    }
    
    setSelectedPermissions(newSelected);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateRolePermissionsMutation.mutateAsync({
        roleId: role.id,
        permissionKeys: Array.from(selectedPermissions)
      });

      toast({
        title: 'Permissions Updated',
        description: `Successfully updated permissions for role "${role.name}"`,
      });

      onPermissionsUpdated?.();
      onClose();
    } catch (error) {
      console.error('Failed to update role permissions:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update role permissions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = () => {
    const currentPermissions = new Set(role.permissionKeys || []);
    if (currentPermissions.size !== selectedPermissions.size) return true;
    
    for (const permission of selectedPermissions) {
      if (!currentPermissions.has(permission)) return true;
    }
    return false;
  };

  if (permissionsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions for "{role.name}"
          </DialogTitle>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 py-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              size="sm"
            >
              All Categories
            </Button>
            {categories.slice(0, 3).map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Permission Summary */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                {selectedPermissions.size} permissions selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">
                {permissions.length} total available
              </span>
            </div>
          </div>
          {hasChanges() && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Unsaved Changes
            </Badge>
          )}
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
            const IconComponent = categoryIcons[category] || Shield;
            const selectedInCategory = categoryPermissions.filter(p => selectedPermissions.has(p.permissionKey)).length;
            const allSelected = selectedInCategory === categoryPermissions.length;
            const someSelected = selectedInCategory > 0 && selectedInCategory < categoryPermissions.length;

            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <IconComponent className="h-5 w-5" />
                      {category}
                      <Badge variant="secondary">
                        {selectedInCategory}/{categoryPermissions.length}
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAllInCategory(category)}
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryPermissions.map(permission => (
                      <div
                        key={permission.permissionKey}
                        className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedPermissions.has(permission.permissionKey)}
                          onCheckedChange={() => handlePermissionToggle(permission.permissionKey)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium">{permission.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {permission.action}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {permission.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {permission.permissionKey}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasChanges() ? 'You have unsaved changes' : 'No changes made'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges() || isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
