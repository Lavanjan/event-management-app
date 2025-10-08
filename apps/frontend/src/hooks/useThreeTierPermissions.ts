// @ts-ignore
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { featurePackageService } from '../services/featurePackageService';
import { userPermissionService } from '../services/userPermissionService';

export interface ThreeTierPermissionData {
  userId: string;
  organizationId: string;
  userType: string;
  isProductAdmin: boolean;
  
  // Level 1: Package Features
  packageFeatures: string[];
  organizationPackages: any[];
  
  // Level 2: Role Permissions
  rolePermissions: string[];
  
  // Level 3: User Overrides
  userOverrides: {
    grants: string[];
    denies: string[];
  };
  
  // Final computed permissions
  effectivePermissions: string[];
  
  // Permission evaluation details
  permissionEvaluation: {
    source: string;
    description: string;
  };
}

export const useThreeTierPermissions = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();



  // Fetch current user's three-tier permissions
  const {
    data: permissionData,
    isLoading: isLoadingPermissions,
    error: permissionError,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: ['threeTierPermissions', user?.id],
    queryFn: async (): Promise<ThreeTierPermissionData> => {
      const response = await fetch('/api/auth/permissions', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const result = await response.json();
      const data = result.data;

      // Transform the API response to match our expected structure
      return {
        userId: data.userId,
        organizationId: data.organizationId,
        userType: data.userType,
        isProductAdmin: data.isProductAdmin,
        packageFeatures: data.availableFeatures || [],
        organizationPackages: [],
        rolePermissions: data.rolePermissions?.permissions || [],
        userOverrides: {
          grants: data.userOverrides?.grants?.map((g: any) => g.permissionKey) || [],
          denies: data.userOverrides?.denies?.map((d: any) => d.permissionKey) || [],
        },
        effectivePermissions: data.effectivePermissions?.permissions || [],
        permissionEvaluation: data.permissionEvaluation || { source: 'unknown', description: 'No evaluation data' },
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Only retry once
    retryDelay: 1000, // 1 second delay
  });

  // Fetch organization's available features
  const {
    data: organizationFeatures,
    isLoading: isLoadingFeatures,
    error: featuresError,
  } = useQuery({
    queryKey: ['organizationFeatures', user?.organizationId],
    queryFn: () => featurePackageService.getCurrentOrganizationFeatures(),
    enabled: !!user?.organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Only retry once
    retryDelay: 1000, // 1 second delay
    placeholderData: [], // Provide empty array as fallback
  });

  // Fetch organization's packages
  const {
    data: organizationPackages,
    isLoading: isLoadingPackages,
    error: packagesError,
  } = useQuery({
    queryKey: ['organizationPackages', user?.organizationId],
    queryFn: () => featurePackageService.getCurrentOrganizationPackages(),
    enabled: !!user?.organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Only retry once
    retryDelay: 1000, // 1 second delay
    placeholderData: [], // Provide empty array as fallback
  });

  // Permission checking functions
  const hasPermission = (permissionKey: string): boolean => {
    // Handle special permission keys
    if (permissionKey === 'isProductAdmin') {
      return permissionData?.isProductAdmin || false;
    }
    if (permissionKey === 'isOrganizationAdmin') {
      return isOrganizationAdmin();
    }
    return permissionData?.effectivePermissions?.includes(permissionKey) || false;
  };

  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    return permissionKeys.some(key => hasPermission(key));
  };

  const hasAllPermissions = (permissionKeys: string[]): boolean => {
    return permissionKeys.every(key => hasPermission(key));
  };

  const hasFeature = (featureKey: string): boolean => {
    return organizationFeatures?.includes(featureKey) || false;
  };

  const isProductAdmin = (): boolean => {
    return permissionData?.isProductAdmin || false;
  };

  const isOrganizationAdmin = (): boolean => {
    return permissionData?.userType === 'organization_admin' || false;
  };

  // Permission management mutations
  const grantPermissionMutation = useMutation({
    mutationFn: ({ userId, permissionKey, reason }: { userId: string; permissionKey: string; reason?: string }) =>
      userPermissionService.grantPermission(userId, permissionKey, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threeTierPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['userPermissions'] });
    },
  });

  const denyPermissionMutation = useMutation({
    mutationFn: ({ userId, permissionKey, reason }: { userId: string; permissionKey: string; reason?: string }) =>
      userPermissionService.denyPermission(userId, permissionKey, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threeTierPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['userPermissions'] });
    },
  });

  const removePermissionOverrideMutation = useMutation({
    mutationFn: ({ userId, permissionKey }: { userId: string; permissionKey: string }) =>
      userPermissionService.removePermissionOverride(userId, permissionKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threeTierPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['userPermissions'] });
    },
  });

  return {
    // Data
    permissionData,
    organizationFeatures,
    organizationPackages,
    
    // Loading states - only consider loading if no errors occurred
    isLoading: (isLoadingPermissions && !permissionError) ||
               (isLoadingFeatures && !featuresError) ||
               (isLoadingPackages && !packagesError),
    isLoadingPermissions,
    isLoadingFeatures,
    isLoadingPackages,

    // Error states
    permissionError,
    featuresError,
    packagesError,
    
    // Permission checking functions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasFeature,
    isProductAdmin,
    isOrganizationAdmin,
    
    // Permission management functions
    grantPermission: grantPermissionMutation.mutate,
    denyPermission: denyPermissionMutation.mutate,
    removePermissionOverride: removePermissionOverrideMutation.mutate,
    
    // Mutation states
    isGrantingPermission: grantPermissionMutation.isPending,
    isDenyingPermission: denyPermissionMutation.isPending,
    isRemovingOverride: removePermissionOverrideMutation.isPending,
    
    // Refetch function
    refetchPermissions,
  };
};
