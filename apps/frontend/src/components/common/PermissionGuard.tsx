import React from 'react';
import { usePermissions, PermissionKey } from '../../hooks/usePermissions';

interface PermissionGuardProps {
  permission?: PermissionKey | PermissionKey[];
  requireAll?: boolean; // If true, requires all permissions. If false, requires any permission.
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PermissionGuard component that conditionally renders children based on user permissions
 * 
 * @param permission - Single permission or array of permissions to check
 * @param requireAll - If true, user must have ALL permissions. If false, user needs ANY permission.
 * @param fallback - Component to render when permission check fails
 * @param children - Content to render when permission check passes
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  // If still loading permissions, don't render anything
  if (loading) {
    return null;
  }

  // If no permission specified, always render children
  if (!permission) {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (Array.isArray(permission)) {
    // Multiple permissions
    if (requireAll) {
      hasAccess = hasAllPermissions(permission);
    } else {
      hasAccess = hasAnyPermission(permission);
    }
  } else {
    // Single permission
    hasAccess = hasPermission(permission);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * Hook version for more complex permission logic
 */
export const usePermissionGuard = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, userPermissions, loading } = usePermissions();

  const canAccess = (
    permission: PermissionKey | PermissionKey[],
    requireAll: boolean = false
  ): boolean => {
    if (loading || !userPermissions) {
      return false;
    }

    if (Array.isArray(permission)) {
      return requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission);
    } else {
      return hasPermission(permission);
    }
  };

  return {
    canAccess,
    userPermissions,
    loading,
    isProductAdmin: userPermissions?.isProductAdmin || false,
  };
};

/**
 * Higher-order component for permission-based rendering
 */
export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  permission: PermissionKey | PermissionKey[],
  requireAll: boolean = false,
  fallback?: React.ReactNode
) => {
  return (props: P) => (
    <PermissionGuard permission={permission} requireAll={requireAll} fallback={fallback}>
      <Component {...props} />
    </PermissionGuard>
  );
};

export default PermissionGuard;
