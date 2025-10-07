import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../../store';
import { useThreeTierPermissions } from '../../hooks/useThreeTierPermissions';

interface PermissionRouteProps {
  children: React.ReactNode;
  permission: string;
  fallback?: string;
}

export function PermissionRoute({ children, permission, fallback = '/dashboard' }: PermissionRouteProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const { hasPermission, isLoading } = useThreeTierPermissions();

  // If still loading permissions, show loading spinner - DO NOT allow access
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check permission using the three-tier system
  if (!hasPermission(permission)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
