import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, User, Mail, Phone, Shield, Key, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { useCreateUser } from '../../hooks/useUsers';
import { useRoles } from '../../hooks/useRoles';
import { useToast } from '../../hooks/use-toast';

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  phone: z.string().optional(),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
  isActive: z.boolean().default(true),
  autoGenerateCredentials: z.boolean().default(false),
  requiresVerification: z.boolean().default(false),
}).refine((data) => {
  // If auto-generate is false, password is required
  if (!data.autoGenerateCredentials && !data.password) {
    return false;
  }
  return true;
}, {
  message: "Password is required when not auto-generating credentials",
  path: ["password"],
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export function UserCreatePage() {
  const navigate = useNavigate();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [autoGenerateCredentials, setAutoGenerateCredentials] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);

  const { data: roles } = useRoles();
  const createUser = useCreateUser();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      isActive: true,
      roleIds: [],
      autoGenerateCredentials: false,
      requiresVerification: false,
    },
  });

  const onSubmit = async (data: CreateUserForm) => {
    try {
      await createUser.mutateAsync({
        ...data,
        roleIds: selectedRoles,
        autoGenerateCredentials,
        requiresVerification,
        sendEmail: true, // Always send email with credentials
      });

      toast({
        title: 'Success',
        description: 'User created successfully',
      });

      navigate('/users');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = (roleId: string) => {
    const newRoles = selectedRoles.includes(roleId)
      ? selectedRoles.filter(id => id !== roleId)
      : [...selectedRoles, roleId];

    setSelectedRoles(newRoles);
    setValue('roleIds', newRoles);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/users')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create User</h1>
          <p className="text-muted-foreground">
            Add a new user to the system
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Enter the user's personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName.message}</p>
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
                  <p className="text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Enter email address"
                  className="pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="Enter phone number"
                  className="pl-10"
                />
              </div>
            </div>

            {!autoGenerateCredentials && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="Enter password"
                    className="pl-10"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credential Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Credential Options
            </CardTitle>
            <CardDescription>
              Configure how user credentials are handled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoGenerateCredentials"
                checked={autoGenerateCredentials}
                onChange={(e) => {
                  setAutoGenerateCredentials(e.target.checked);
                  setValue('autoGenerateCredentials', e.target.checked);
                }}
                className="rounded border-gray-300"
              />
              <Label htmlFor="autoGenerateCredentials" className="flex-1">
                <div>
                  <div className="font-medium">Auto System-Generated Credentials</div>
                  <div className="text-sm text-muted-foreground">
                    System will automatically generate a secure password and send it via email
                  </div>
                </div>
              </Label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📧 Email Delivery</h4>
              <p className="text-sm text-blue-800">
                User credentials will be automatically sent to their email address securely.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verification Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Verification Options
            </CardTitle>
            <CardDescription>
              Configure email verification requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresVerification"
                checked={requiresVerification}
                onChange={(e) => {
                  setRequiresVerification(e.target.checked);
                  setValue('requiresVerification', e.target.checked);
                }}
                className="rounded border-gray-300"
              />
              <Label htmlFor="requiresVerification" className="flex-1">
                <div>
                  <div className="font-medium">Verification Needed</div>
                  <div className="text-sm text-muted-foreground">
                    User must verify their email address before account activation
                  </div>
                </div>
              </Label>
            </div>

            {requiresVerification && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Verification Process</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• User will receive an email with verification link and OTP code</li>
                  <li>• Account will remain inactive until verified</li>
                  <li>• User can verify via email link or by entering OTP code</li>
                  <li>• Organization Admin can also verify on behalf of the user</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Role Assignment
            </CardTitle>
            <CardDescription>
              Select the roles for this user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roles?.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`role-${role.id}`}
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => handleRoleChange(role.id)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`role-${role.id}`} className="flex-1">
                    <div>
                      <div className="font-medium">{role.name}</div>
                      {role.description && (
                        <div className="text-sm text-muted-foreground">
                          {role.description}
                        </div>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
              {errors.roleIds && (
                <p className="text-sm text-red-600">{errors.roleIds.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/users')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
}
