import React from 'react';
import { RolePermissionsManager } from '../../components/permissions/RolePermissionsManager';
import { RequirePermissions } from '../../components/common/PermissionGate';

export const RoleManagementPage: React.FC = () => {
  return (
    <RequirePermissions
      permissions={['roles.read']}
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Insufficient Permissions</h3>
            <p className="mt-1 text-sm text-gray-500">
              You need role management permissions to access this page.
            </p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RolePermissionsManager />
          </div>
        </div>
      </div>
    </RequirePermissions>
  );
};
