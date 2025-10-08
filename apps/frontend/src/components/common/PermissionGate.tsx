import React from 'react';
import { useThreeTierPermissions } from '../../hooks/useThreeTierPermissions';

interface PermissionGateProps {
  children: React.ReactNode;
  
  // Permission requirements
  permissions?: string | string[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
  
  // Feature requirements
  features?: string | string[];
  requireAllFeatures?: boolean;
  
  // Role requirements
  requireProductAdmin?: boolean;
  requireOrganizationAdmin?: boolean;
  
  // Fallback content
  fallback?: React.ReactNode;
  
  // Loading state
  showLoadingState?: boolean;
  loadingFallback?: React.ReactNode;
  
  // Custom validation function
  customValidation?: (permissionData: any) => boolean;
  
  className?: string;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions,
  requireAll = false,
  features,
  requireAllFeatures = false,
  requireProductAdmin = false,
  requireOrganizationAdmin = false,
  fallback = null,
  showLoadingState = true,
  loadingFallback,
  customValidation,
  className = '',
}) => {
  const {
    // @ts-ignore
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasFeature,
    isProductAdmin,
    isOrganizationAdmin,
    isLoading,
    permissionData,
  } = useThreeTierPermissions();

  // Show loading state if permissions are still loading
  if (isLoading && showLoadingState) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Check product admin requirement
  if (requireProductAdmin && !isProductAdmin()) {
    return <>{fallback}</>;
  }

  // Check organization admin requirement
  if (requireOrganizationAdmin && !isOrganizationAdmin()) {
    return <>{fallback}</>;
  }

  // Check permission requirements
  if (permissions) {
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
    
    if (requireAll) {
      if (!hasAllPermissions(permissionArray)) {
        return <>{fallback}</>;
      }
    } else {
      if (!hasAnyPermission(permissionArray)) {
        return <>{fallback}</>;
      }
    }
  }

  // Check feature requirements
  if (features) {
    const featureArray = Array.isArray(features) ? features : [features];
    
    if (requireAllFeatures) {
      if (!featureArray.every(feature => hasFeature(feature))) {
        return <>{fallback}</>;
      }
    } else {
      if (!featureArray.some(feature => hasFeature(feature))) {
        return <>{fallback}</>;
      }
    }
  }

  // Check custom validation
  if (customValidation && !customValidation(permissionData)) {
    return <>{fallback}</>;
  }

  // All checks passed, render children
  return <div className={className}>{children}</div>;
};

// Convenience components for common use cases
export const ProductAdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback, className }) => (
  <PermissionGate
    requireProductAdmin
    fallback={fallback}
    className={className}
  >
    {children}
  </PermissionGate>
);

export const OrganizationAdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback, className }) => (
  <PermissionGate
    requireOrganizationAdmin
    fallback={fallback}
    className={className}
  >
    {children}
  </PermissionGate>
);

export const RequirePermissions: React.FC<{
  children: React.ReactNode;
  permissions: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, permissions, requireAll = false, fallback, className }) => (
  <PermissionGate
    permissions={permissions}
    requireAll={requireAll}
    fallback={fallback}
    className={className}
  >
    {children}
  </PermissionGate>
);

export const RequireFeatures: React.FC<{
  children: React.ReactNode;
  features: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, features, requireAll = false, fallback, className }) => (
  <PermissionGate
    features={features}
    requireAllFeatures={requireAll}
    fallback={fallback}
    className={className}
  >
    {children}
  </PermissionGate>
);

// Hook for conditional rendering in components
export const usePermissionCheck = () => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasFeature,
    isProductAdmin,
    isOrganizationAdmin,
  } = useThreeTierPermissions();

  const canAccess = (requirements: {
    permissions?: string | string[];
    requireAll?: boolean;
    features?: string | string[];
    requireAllFeatures?: boolean;
    requireProductAdmin?: boolean;
    requireOrganizationAdmin?: boolean;
  }) => {
    const {
      permissions,
      requireAll = false,
      features,
      requireAllFeatures = false,
      requireProductAdmin = false,
      requireOrganizationAdmin = false,
    } = requirements;

    // Check product admin requirement
    if (requireProductAdmin && !isProductAdmin()) {
      return false;
    }

    // Check organization admin requirement
    if (requireOrganizationAdmin && !isOrganizationAdmin()) {
      return false;
    }

    // Check permission requirements
    if (permissions) {
      const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
      
      if (requireAll) {
        if (!hasAllPermissions(permissionArray)) {
          return false;
        }
      } else {
        if (!hasAnyPermission(permissionArray)) {
          return false;
        }
      }
    }

    // Check feature requirements
    if (features) {
      const featureArray = Array.isArray(features) ? features : [features];
      
      if (requireAllFeatures) {
        if (!featureArray.every(feature => hasFeature(feature))) {
          return false;
        }
      } else {
        if (!featureArray.some(feature => hasFeature(feature))) {
          return false;
        }
      }
    }

    return true;
  };

  return {
    canAccess,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasFeature,
    isProductAdmin,
    isOrganizationAdmin,
  };
};
