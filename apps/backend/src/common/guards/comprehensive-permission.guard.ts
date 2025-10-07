import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ComprehensivePermissionService } from '../../modules/permissions/comprehensive-permission.service';

export const PERMISSIONS_KEY = 'permissions';
export const REQUIRE_ALL_PERMISSIONS_KEY = 'requireAllPermissions';

/**
 * Decorator to require specific permissions
 * @param permissions - Array of permission keys required
 * @param requireAll - Whether all permissions are required (default: false, meaning any permission is sufficient)
 */
export const RequirePermissions = (permissions: string[], requireAll = false) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    const setMetadata = (key: string, value: any) => {
      if (descriptor) {
        Reflect.defineMetadata(key, value, descriptor.value);
      } else {
        Reflect.defineMetadata(key, value, target);
      }
    };

    setMetadata(PERMISSIONS_KEY, permissions);
    setMetadata(REQUIRE_ALL_PERMISSIONS_KEY, requireAll);
  };
};

/**
 * Comprehensive Permission Guard
 * 
 * This guard implements the three-tier permission system:
 * 1. Package-level features (what organization has access to)
 * 2. Role-based permissions (what user's role allows)
 * 3. User-specific overrides (individual grants/denies)
 * 
 * Usage:
 * @RequirePermissions(['inventory.read'])
 * @RequirePermissions(['users.create', 'users.update'], true) // requires ALL permissions
 */
@Injectable()
export class ComprehensivePermissionGuard implements CanActivate {
  private readonly logger = new Logger(ComprehensivePermissionGuard.name);

  constructor(
    private reflector: Reflector,
    private comprehensivePermissionService: ComprehensivePermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const requireAll = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ALL_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    ) || false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const session = request.session;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!user.organizationId) {
      throw new UnauthorizedException('User organization not found');
    }

    try {
      // Use session permissions for better performance and consistency
      // Session permissions are calculated during login using the comprehensive permission service
      const sessionPermissions = session?.permissions || [];

      // Normalize permission formats - convert colon format to dot format for consistency
      const normalizedSessionPermissions = sessionPermissions.map(perm =>
        perm.includes(':') ? perm.replace(':', '.') : perm
      );
      const normalizedRequiredPermissions = requiredPermissions.map(perm =>
        perm.includes(':') ? perm.replace(':', '.') : perm
      );



      // Check permissions based on requireAll flag using normalized permissions
      const hasPermission = requireAll
        ? this.hasAllPermissions(normalizedSessionPermissions, normalizedRequiredPermissions)
        : this.hasAnyPermission(normalizedSessionPermissions, normalizedRequiredPermissions);

      if (!hasPermission) {
        const missingPermissions = normalizedRequiredPermissions.filter(
          perm => !normalizedSessionPermissions.includes(perm)
        );

        this.logger.warn(
          `Access denied for user ${user.id}. Required: [${normalizedRequiredPermissions.join(', ')}], ` +
          `Session has: [${normalizedSessionPermissions.join(', ')}], ` +
          `Missing: [${missingPermissions.join(', ')}], RequireAll: ${requireAll}`
        );

        throw new ForbiddenException(
          `Insufficient permissions. Required permission${normalizedRequiredPermissions.length > 1 ? 's' : ''}: ${normalizedRequiredPermissions.join(', ')}`
        );
      }

      // Log successful permission check for debugging
      this.logger.debug(
        `Permission check passed for user ${user.id}. Required: [${normalizedRequiredPermissions.join(', ')}]`
      );

      // Attach permission info to request for potential use in controllers
      request.userPermissions = { permissions: normalizedSessionPermissions };

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Error checking permissions for user ${user.id}:`, error);
      throw new ForbiddenException('Permission check failed');
    }
  }

  private hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  private hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }
}

/**
 * Simplified permission decorator for single permission
 */
export const RequirePermission = (permission: string) => RequirePermissions([permission]);

/**
 * Decorator for admin-only endpoints
 */
export const RequireAdmin = () => RequirePermissions(['admin.access']);

/**
 * Decorator for organization admin endpoints
 */
export const RequireOrgAdmin = () => RequirePermissions(['organization.admin']);

/**
 * Decorator for product admin endpoints
 */
export const RequireProductAdmin = () => RequirePermissions(['product.admin']);

/**
 * Module-specific permission decorators
 */
export const RequireInventoryRead = () => RequirePermission('inventory.read');
export const RequireInventoryWrite = () => RequirePermissions(['inventory.create', 'inventory.update'], true);
export const RequireInventoryDelete = () => RequirePermission('inventory.delete');

export const RequireEventsRead = () => RequirePermission('events.read');
export const RequireEventsWrite = () => RequirePermissions(['events.create', 'events.update'], true);
export const RequireEventsDelete = () => RequirePermission('events.delete');

export const RequireBookingsRead = () => RequirePermission('bookings.read');
export const RequireBookingsWrite = () => RequirePermissions(['bookings.create', 'bookings.update'], true);
export const RequireBookingsCancel = () => RequirePermission('bookings.cancel');

export const RequireUsersRead = () => RequirePermission('users.read');
export const RequireUsersWrite = () => RequirePermissions(['users.create', 'users.update'], true);
export const RequireUsersDelete = () => RequirePermission('users.delete');

export const RequireFinancialRead = () => RequirePermission('financial.read');
export const RequireFinancialTransactions = () => RequirePermission('financial.transactions');
export const RequireFinancialPayouts = () => RequirePermission('financial.payouts');

export const RequireSettingsRead = () => RequirePermission('settings.read');
export const RequireSettingsWrite = () => RequirePermission('settings.update');
export const RequireSettingsIntegrations = () => RequirePermission('settings.integrations');

export const RequireDocumentsRead = () => RequirePermission('documents.read');
export const RequireDocumentsWrite = () => RequirePermissions(['documents.create', 'documents.update'], true);
export const RequireDocumentsDelete = () => RequirePermission('documents.delete');
