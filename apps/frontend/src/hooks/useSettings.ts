import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, OrganizationSettings, UserPreferences } from '../services/settingsService';
import { useToast } from './use-toast';

export const SETTINGS_QUERY_KEYS = {
  all: ['settings'] as const,
  organization: () => [...SETTINGS_QUERY_KEYS.all, 'organization'] as const,
  preferences: () => [...SETTINGS_QUERY_KEYS.all, 'preferences'] as const,
  profile: () => [...SETTINGS_QUERY_KEYS.all, 'profile'] as const,
  userProfile: (userId: string) => [...SETTINGS_QUERY_KEYS.all, 'profile', userId] as const,
};

// Organization Settings
export function useOrganizationSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.organization(),
    queryFn: () => settingsService.getOrganizationSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (settings: Partial<OrganizationSettings>) =>
      settingsService.updateOrganizationSettings(settings),
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEYS.organization(), data);
      toast({
        title: 'Success',
        description: 'Organization settings updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update organization settings',
        variant: 'destructive',
      });
    },
  });
}

// User Preferences
export function useUserPreferences() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.preferences(),
    queryFn: () => settingsService.getUserPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (preferences: Partial<UserPreferences>) =>
      settingsService.updateUserPreferences(preferences),
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEYS.preferences(), data);
      toast({
        title: 'Success',
        description: 'Preferences updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update preferences',
        variant: 'destructive',
      });
    },
  });
}

// User Profile
export function useUserProfile() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.profile(),
    queryFn: () => settingsService.getUserProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (profile: { firstName?: string; lastName?: string }) =>
      settingsService.updateUserProfile(profile),
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEYS.profile(), data);
      // Also invalidate auth user data since name might have changed
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });
}

// Admin functions
export function useUserProfileById(userId: string) {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.userProfile(userId),
    queryFn: () => settingsService.getUserProfileById(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUserProfileById() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, profile }: { userId: string; profile: { firstName?: string; lastName?: string } }) =>
      settingsService.updateUserProfileById(userId, profile),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEYS.userProfile(variables.userId), data);
      queryClient.invalidateQueries({ queryKey: ['users'] }); // Refresh user lists
      toast({
        title: 'Success',
        description: 'User profile updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update user profile',
        variant: 'destructive',
      });
    },
  });
}
