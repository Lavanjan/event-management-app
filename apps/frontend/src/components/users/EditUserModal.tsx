import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { useToast } from '../../hooks/use-toast';
import { useUpdateUser } from '../../hooks/useUsers';
import { api } from '../../services/api';
import { User, Role } from '../../types';
import { Loader2, User as UserIcon, Mail, Phone, Shield } from 'lucide-react';

const editUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  isActive: z.boolean(),
  roleIds: z.array(z.string()).optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditUserModal({ user, isOpen, onClose, onSuccess }: EditUserModalProps) {
  const { toast } = useToast();
  const updateUser = useUpdateUser();
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (user && isOpen) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: (user as any).phone || '',
        isActive: user.isActive,
        roleIds: user.roles?.map(role => role.id) || [],
      });
      loadAvailableRoles();
    }
  }, [user, isOpen, reset]);

  const loadAvailableRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await api.get('/enhanced-roles');
      const roles = response.data.data || response.data || [];
      setAvailableRoles(roles.filter((role: Role) => role.isActive));
    } catch (error) {
      console.error('Failed to load roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available roles.',
        variant: 'destructive',
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return;

    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          // @ts-ignore
          phone: data.phone,
          isActive: data.isActive,
          roleIds: data.roleIds,
        }
      });

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Edit User: {user.firstName} {user.lastName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Enter phone number (optional)"
              />
            </div>
          </div>

          {/* Role Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Role Assignment
            </h3>
            
            <div className="space-y-2">
              <Label>Assigned Roles</Label>
              {loadingRoles ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading roles...
                </div>
              ) : (
                <Select
                  value={watch('roleIds')?.[0] || ''}
                  onValueChange={(value) => setValue('roleIds', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Account Status</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? 'User can access the system' : 'User access is disabled'}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
