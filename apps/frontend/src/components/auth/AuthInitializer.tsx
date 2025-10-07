import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { loginSuccess, logout } from '../../store/slices/authSlice';
import secureAuthService from '../../services/secureAuthService';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, hasLoggedOut } = useSelector((state: RootState) => state.auth);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('AuthInitializer: Starting auth initialization');
        console.log('AuthInitializer: Current auth state:', { isAuthenticated, user: !!user, hasLoggedOut });

        // If user has explicitly logged out, don't try to restore session
        if (hasLoggedOut) {
          console.log('AuthInitializer: User has logged out, skipping session check');
          setIsInitializing(false);
          return;
        }

        // If we think we're authenticated, verify the session
        if (isAuthenticated) {
          console.log('AuthInitializer: Verifying existing session');
          const currentUser = await secureAuthService.getCurrentUser();
          
          if (currentUser?.success && currentUser.user) {
            console.log('AuthInitializer: Session valid, updating user data');
            
            // Convert the secure auth user to the expected User type
            const user = {
              id: currentUser.user.id,
              email: currentUser.user.email,
              firstName: currentUser.user.firstName,
              lastName: currentUser.user.lastName,
              userType: currentUser.user.userType,
              organizationId: currentUser.user.organizationId,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              roles: currentUser.user.roles.map(roleName => ({
                id: roleName,
                name: roleName,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                permissions: currentUser.user.permissions.map(perm => {
                  const [resource, action] = perm.split(':');
                  return {
                    id: perm,
                    name: `${action} ${resource}`,
                    resource,
                    action,
                    description: `${action} ${resource}`,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                }),
              })),
            };

            dispatch(loginSuccess({
              user,
              accessToken: 'session-based',
              refreshToken: 'session-based',
            }));
          } else {
            console.log('AuthInitializer: Session invalid, logging out');
            dispatch(logout());
          }
        } else {
          console.log('AuthInitializer: Not authenticated, checking for session');
          // Even if not authenticated in Redux, check if there's a valid session
          const currentUser = await secureAuthService.getCurrentUser();
          
          if (currentUser?.success && currentUser.user) {
            console.log('AuthInitializer: Found valid session, logging in');
            
            const user = {
              id: currentUser.user.id,
              email: currentUser.user.email,
              firstName: currentUser.user.firstName,
              lastName: currentUser.user.lastName,
              userType: currentUser.user.userType,
              organizationId: currentUser.user.organizationId,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              roles: currentUser.user.roles.map(roleName => ({
                id: roleName,
                name: roleName,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                permissions: currentUser.user.permissions.map(perm => {
                  const [resource, action] = perm.split(':');
                  return {
                    id: perm,
                    name: `${action} ${resource}`,
                    resource,
                    action,
                    description: `${action} ${resource}`,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                }),
              })),
            };

            dispatch(loginSuccess({
              user,
              accessToken: 'session-based',
              refreshToken: 'session-based',
            }));
          }
        }
      } catch (error) {
        console.error('AuthInitializer: Error during initialization:', error);
        // If there's an error, clear the auth state
        dispatch(logout());
      } finally {
        setIsInitializing(false);
        console.log('AuthInitializer: Initialization complete');
      }
    };

    initializeAuth();
  }, []); // Only run once on mount

  // Show loading spinner while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
