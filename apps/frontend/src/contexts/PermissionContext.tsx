import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { permissionService } from '../services/permissionService';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface PermissionContextType {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
  organizationId?: string;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ 
  children, 
  organizationId 
}) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useSelector((state: RootState) => state.auth);

  const refreshPermissions = async () => {
    if (!user || !organizationId) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userPermissions = await permissionService.getUserPermissions();
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshPermissions();
  }, [user, organizationId]);

  const hasPermission = (permission: string): boolean => {
    // Product admin has all permissions
    if (user?.userType === 'product_admin') {
      return true;
    }
    
    return permissions.includes(permission);
  };

  const value: PermissionContextType = {
    permissions,
    hasPermission,
    isLoading,
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// Higher-order component for permission-based rendering
interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
