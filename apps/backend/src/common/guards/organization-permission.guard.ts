import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationPermissionsService } from '../../modules/organizations/organization-permissions.service';
import { User, UserType } from '../../database/entities';

export const ORGANIZATION_PERMISSION_KEY = 'organizationPermission';

/**
 * Decorator to require specific organization permission
 */
export const RequireOrganizationPermission = (permission: string) =>
  SetMetadata(ORGANIZATION_PERMISSION_KEY, permission);

@Injectable()
export class OrganizationPermissionGuard implements CanActivate {
  private readonly logger = new Logger(OrganizationPermissionGuard.name);

  constructor(
    private reflector: Reflector,
    private organizationPermissionsService: OrganizationPermissionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      ORGANIZATION_PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermission) {
      // No permission required, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Product admins have access to everything
    if (user.userType === UserType.PRODUCT_ADMIN) {
      this.logger.debug(`Product admin ${user.email} granted access to ${requiredPermission}`);
      return true;
    }

    // Organization admins and users need to check permissions
    if (
      user.userType === UserType.ORGANIZATION_ADMIN ||
      user.userType === UserType.ORGANIZATION_USER
    ) {
      if (!user.organizationId) {
        throw new ForbiddenException('User does not belong to an organization');
      }

      try {
        const hasPermission = await this.organizationPermissionsService.hasPermission(
          user.organizationId,
          requiredPermission
        );

        if (!hasPermission) {
          this.logger.warn(
            `User ${user.email} from organization ${user.organizationId} denied access to ${requiredPermission}`
          );
          throw new ForbiddenException(
            `Insufficient permissions. Required permission: ${requiredPermission}`
          );
        }

        this.logger.debug(
          `User ${user.email} from organization ${user.organizationId} granted access to ${requiredPermission}`
        );
        return true;
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }
        this.logger.error(
          `Error checking permission ${requiredPermission} for user ${user.email}:`,
          error
        );
        throw new ForbiddenException('Error checking permissions');
      }
    }

    throw new ForbiddenException('Invalid user type');
  }
}
