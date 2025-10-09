import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Save,
  Loader2,
  Settings,
  Bell,
  Palette,
  Monitor,
  Globe,
  Clock,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useUserProfile, useUpdateUserProfile, useUserPreferences, useUpdateUserPreferences } from '../../hooks/useSettings';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { format } from 'date-fns';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

const preferencesSchema = z.object({
  themeMode: z.enum(['light', 'dark', 'system']),
  language: z.string(),
  dateFormat: z.string(),
  timeFormat: z.enum(['12h', '24h']),
  timezone: z.string(),
  enableDesktopNotifications: z.boolean(),
  enableEmailNotifications: z.boolean(),
  enableSmsNotifications: z.boolean(),
  enableSoundNotifications: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
];

const dateFormats = [
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (12/31/2023)' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (31/12/2023)' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (2023-12-31)' },
  { value: 'MMM dd, yyyy', label: 'MMM DD, YYYY (Dec 31, 2023)' },
  { value: 'dd MMM yyyy', label: 'DD MMM YYYY (31 Dec 2023)' },
];

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (EST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEST)' },
  { value: 'Asia/Colombo', label: 'Sri Lanka Time (SLST)' },
];

export function UserProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: preferences, isLoading: preferencesLoading } = useUserPreferences();
  const updateProfile = useUpdateUserProfile();
  const updatePreferences = useUpdateUserPreferences();

  // Check if user can edit profile (only admins can edit their own profile)
  const canEditProfile = user?.userType === 'product_admin' || user?.userType === 'organization_admin';

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      themeMode: 'light',
      language: 'en',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
      timezone: 'Asia/Colombo',
      enableDesktopNotifications: true,
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      enableSoundNotifications: true,
    },
  });

  // Update forms when data is loaded
  useEffect(() => {
    if (profile) {
      profileForm.setValue('firstName', profile.firstName);
      profileForm.setValue('lastName', profile.lastName);
    }
  }, [profile, profileForm]);

  useEffect(() => {
    if (preferences) {
      Object.entries(preferences).forEach(([key, value]) => {
        if (value !== undefined && key in preferencesForm.getValues()) {
          preferencesForm.setValue(key as keyof PreferencesFormData, value);
        }
      });
    }
  }, [preferences, preferencesForm]);

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  const onPreferencesSubmit = (data: PreferencesFormData) => {
    updatePreferences.mutate(data);
  };

  if (profileLoading || preferencesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                {canEditProfile ? 'Update your personal information' : 'View your personal information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{profile.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">User Type</Label>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{profile.userType?.replace('_', ' ') || 'Unknown'}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Member Since</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {profile.createdAt ? format(new Date(profile.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  {profile.lastLogin && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Last Login</Label>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {profile.lastLogin ? format(new Date(profile.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {canEditProfile ? (
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        {...profileForm.register('firstName')}
                        error={profileForm.formState.errors.firstName?.message}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        {...profileForm.register('lastName')}
                        error={profileForm.formState.errors.lastName?.message}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!profileForm.formState.isDirty || updateProfile.isPending}
                      className="min-w-[120px]"
                    >
                      {updateProfile.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">First Name</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{profile?.firstName || 'Not set'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Last Name</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{profile?.lastName || 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <Shield className="inline h-4 w-4 mr-1" />
                      Profile editing is restricted. Contact your administrator to update your profile information.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roles */}
          {profile?.roles && profile.roles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Assigned Roles
                </CardTitle>
                <CardDescription>
                  Roles assigned to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.roles.map((role) => (
                    <Badge key={role.id} variant="secondary">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="themeMode">Theme Mode</Label>
                  <Select
                    value={preferencesForm.watch('themeMode')}
                    onValueChange={(value) => preferencesForm.setValue('themeMode', value as 'light' | 'dark' | 'system')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!preferencesForm.formState.isDirty || updatePreferences.isPending}
                className="min-w-[120px]"
              >
                {updatePreferences.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
