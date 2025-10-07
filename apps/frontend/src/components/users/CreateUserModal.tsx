import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/use-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { api } from '../../services/api';
import { FormModal } from '../common/Modal';
import { TextField, SelectField, CheckboxField, MultiSelectField } from '../common/FormField';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  organizationId?: string; // If provided, user will be created for this organization
}

interface Role {
  id: string;
  name: string;
  description: string;
  scope: 'GLOBAL' | 'ORGANIZATION';
  isSystemRole: boolean;
  isActive: boolean;
}

interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  userType: 'ORGANIZATION_ADMIN' | 'ORGANIZATION_USER';
  organizationId: string;
  roleIds: string[];
  autoGeneratePassword: boolean;
  requiresVerification: boolean;
}

export function CreateUserModal({ open, onOpenChange, onSuccess, organizationId }: CreateUserModalProps) {
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    firstName: '',
    lastName: '',
    userType: 'ORGANIZATION_USER',
    organizationId: organizationId || user?.organizationId || '',
    roleIds: [],
    autoGeneratePassword: true,
    requiresVerification: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadAvailableRoles();
      // Reset form when modal opens
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        userType: 'ORGANIZATION_USER',
        organizationId: organizationId || user?.organizationId || '',
        roleIds: [],
        autoGeneratePassword: true,
        requiresVerification: true,
      });
      setErrors({});
    }
  }, [open, organizationId, user?.organizationId]);

  const loadAvailableRoles = async () => {
    try {
      setLoadingRoles(true);
      // Use the enhanced roles endpoint to get organization-specific roles
      const response = await api.get('/enhanced-roles');
      const roles = response.data.data || response.data || [];
      // Filter to show only active organization roles (system roles are already filtered by the backend)
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

  const handleInputChange = (field: keyof CreateUserData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.organizationId) {
      newErrors.organizationId = 'Organization is required';
    }

    if (formData.roleIds.length === 0) {
      newErrors.roleIds = 'At least one role must be selected';
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
      
      // Create user
      const userData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        userType: formData.userType,
        organizationId: formData.organizationId,
        autoGeneratePassword: formData.autoGeneratePassword,
        requiresVerification: formData.requiresVerification,
      };

      const userResponse = await api.post('/users', userData);
      const createdUser = userResponse.data.data || userResponse.data;

      // Assign roles to user
      if (formData.roleIds.length > 0) {
        await Promise.all(
          formData.roleIds.map(roleId =>
            api.post('/users/assign-role', {
              userId: createdUser.id,
              roleId: roleId,
            })
          )
        );
      }

      toast({
        title: 'Success',
        description: `User created successfully${formData.autoGeneratePassword ? ' with auto-generated password' : ''}.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to create user:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create user.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Prepare options for form fields
  const userTypeOptions = [
    { value: 'ORGANIZATION_USER', label: 'Organization User' },
    { value: 'ORGANIZATION_ADMIN', label: 'Organization Admin' },
  ];

  const roleOptions = availableRoles.map(role => ({
    value: role.id,
    label: role.name,
    disabled: !role.isActive,
  }));

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create User"
      description="Create a new user account and assign roles"
      size="lg"
      onSubmit={handleSubmit}
      isSubmitting={loading}
      submitLabel="Create User"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="First Name"
            value={formData.firstName}
            onChange={(value) => handleInputChange('firstName', value)}
            placeholder="John"
            required
            error={errors.firstName}
          />

          <TextField
            label="Last Name"
            value={formData.lastName}
            onChange={(value) => handleInputChange('lastName', value)}
            placeholder="Doe"
            required
            error={errors.lastName}
          />

          <div className="md:col-span-2">
            <TextField
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(value) => handleInputChange('email', value)}
              placeholder="john.doe@example.com"
              required
              error={errors.email}
            />
          </div>
        </div>

          <SelectField
            label="User Type"
            value={formData.userType}
            onChange={(value) => handleInputChange('userType', value)}
            options={userTypeOptions}
            required
          />
        </div>

        {/* Role Assignment */}
        <MultiSelectField
          label="Assign Roles"
          value={formData.roleIds}
          onChange={(value) => handleInputChange('roleIds', value)}
          options={roleOptions}
          placeholder="Select roles for this user"
          searchPlaceholder="Search roles..."
          emptyText="No roles available"
          disabled={loadingRoles}
          error={errors.roleIds}
          required
        />

        {/* Password and Verification Options */}
        <div className="space-y-4">
          <CheckboxField
            label="Auto-generate password"
            checked={formData.autoGeneratePassword}
            onChange={(checked) => handleInputChange('autoGeneratePassword', checked)}
            description="If enabled, a secure password will be generated automatically"
          />

          <CheckboxField
            label="Require email verification"
            checked={formData.requiresVerification}
            onChange={(checked) => handleInputChange('requiresVerification', checked)}
            description="User will need to verify their email before accessing the system"
          />
        </div>
    </FormModal>
  );
}
