import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  resource: string;
  action: string;
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Simple string-based permission decorator
export const SIMPLE_PERMISSIONS_KEY = 'simple_permissions';
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(SIMPLE_PERMISSIONS_KEY, permissions);
