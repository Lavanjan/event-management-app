import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../../store';
import { UserType } from '../../types';

interface PermissionRouteProps {
  children: React.ReactNode;
  permission: string;
  fallback?: string;
}

export function PermissionRoute({ children, permission, fallback = '/dashboard' }: PermissionRouteProps) {
  const { user } = useSelector((state: RootState) => state.auth);

  const hasPermission = (requiredPermission: string) => {
    if (!user) return false;

    // Product Admin has access to organizations, users, and dashboard
    if (user.userType === UserType.PRODUCT_ADMIN) {
      return requiredPermission === 'dashboard:read' || 
             requiredPermission.startsWith('organizations:') || 
             requiredPermission.startsWith('users:');
    }

    // Organization Admin has access to everything except organizations management
    if (user.userType === UserType.ORGANIZATION_ADMIN) {
      return !requiredPermission.startsWith('organizations:');
    }

    // Organization User has limited access
    if (user.userType === UserType.ORGANIZATION_USER) {
      return requiredPermission === 'dashboard:read' || 
             requiredPermission.startsWith('events:read') || 
             requiredPermission.startsWith('bookings:read');
    }

    return false;
  };

  if (!hasPermission(permission)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
