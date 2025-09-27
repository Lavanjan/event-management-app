import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Shield, Save, Users, Settings } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { InputField, TextareaField } from '../../components/forms/FormField';
import { LoadingSpinner } from '../../components/forms/LoadingSpinner';
import { Checkbox } from '../../components/ui/checkbox';
import { useCreateRole, usePermissions } from '../../hooks/useRoles';

const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

type RoleFormData = z.infer<typeof roleSchema>;

const permissionCategories = [
  {
    name: 'User Management',
    permissions: ['users:create', 'users:read', 'users:update', 'users:delete'],
  },
  {
    name: 'Role Management',
    permissions: ['roles:create', 'roles:read', 'roles:update', 'roles:delete'],
  },
  {
    name: 'Inventory Management',
    permissions: ['inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete'],
  },
  {
    name: 'Event Management',
    permissions: ['events:create', 'events:read', 'events:update', 'events:delete'],
  },
  {
    name: 'Booking Management',
    permissions: ['bookings:create', 'bookings:read', 'bookings:update', 'bookings:delete'],
  },
  {
    name: 'Financial Management',
    permissions: ['expenses:manage', 'revenues:manage', 'reports:read'],
  },
  {
    name: 'System Administration',
    permissions: ['system:admin', 'settings:read', 'settings:update'],
  },
];

export function RoleCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRole = useCreateRole();
  const { data: availablePermissions } = usePermissions();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      isActive: true,
      permissions: [],
    },
  });

  const watchedPermissions = watch('permissions');

  const onSubmit = async (data: RoleFormData) => {
    try {
      setIsSubmitting(true);
      await createRole.mutateAsync(data);
      navigate('/roles');
    } catch (error) {
      console.error('Failed to create role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const currentPermissions = watchedPermissions || [];
    if (checked) {
      setValue('permissions', [...currentPermissions, permission]);
    } else {
      setValue('permissions', currentPermissions.filter(p => p !== permission));
    }
  };

  const handleCategoryToggle = (categoryPermissions: string[], checked: boolean) => {
    const currentPermissions = watchedPermissions || [];
    if (checked) {
      const newPermissions = [...new Set([...currentPermissions, ...categoryPermissions])];
      setValue('permissions', newPermissions);
    } else {
      setValue('permissions', currentPermissions.filter(p => !categoryPermissions.includes(p)));
    }
  };

  const isCategorySelected = (categoryPermissions: string[]) => {
    return categoryPermissions.every(permission => watchedPermissions?.includes(permission));
  };

  const isCategoryPartiallySelected = (categoryPermissions: string[]) => {
    return categoryPermissions.some(permission => watchedPermissions?.includes(permission)) &&
           !isCategorySelected(categoryPermissions);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/roles')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Role</h1>
          <p className="text-muted-foreground">
            Create a new role with specific permissions
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Enter the basic details for the role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Role Name"
                  placeholder="Enter role name"
                  registration={register('name')}
                  error={errors.name?.message}
                  required
                />

                <TextareaField
                  label="Description"
                  placeholder="Describe the role and its purpose"
                  registration={register('description')}
                  error={errors.description?.message}
                  rows={3}
                />

                <div className="flex items-center space-x-2">
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="isActive"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active role (users can be assigned to this role)
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Permissions
                </CardTitle>
                <CardDescription>
                  Select the permissions for this role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {permissionCategories.map((category) => (
                  <div key={category.name} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.name}`}
                        checked={isCategorySelected(category.permissions)}
                        onCheckedChange={(checked) => 
                          handleCategoryToggle(category.permissions, checked as boolean)
                        }
                        className={isCategoryPartiallySelected(category.permissions) ? 'data-[state=checked]:bg-orange-500' : ''}
                      />
                      <label 
                        htmlFor={`category-${category.name}`} 
                        className="text-sm font-medium"
                      >
                        {category.name}
                      </label>
                    </div>
                    <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {category.permissions.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission}
                            checked={watchedPermissions?.includes(permission) || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission, checked as boolean)
                            }
                          />
                          <label htmlFor={permission} className="text-sm text-muted-foreground">
                            {permission.replace(':', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {errors.permissions && (
                  <p className="text-sm text-destructive">{errors.permissions.message}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating Role...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Role
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/roles')}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Permission Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Permission Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Selected Permissions:</span>
                    <span className="font-medium">{watchedPermissions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Available:</span>
                    <span className="font-medium">
                      {permissionCategories.reduce((sum, cat) => sum + cat.permissions.length, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
