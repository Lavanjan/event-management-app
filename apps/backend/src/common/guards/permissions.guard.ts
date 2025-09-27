import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/permissions.decorator';
import { SecureSession } from '../../modules/auth/secure-auth.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user }: { user: SecureSession } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasPermission = requiredPermissions.every(permission => {
      const permissionString = `${permission.resource}:${permission.action}`;
      return user.permissions.includes(permissionString);
    });

    if (!hasPermission) {
      const permissionStrings = requiredPermissions.map(p => `${p.action} on ${p.resource}`);
      throw new ForbiddenException(
        `Access denied. Required permissions: ${permissionStrings.join(', ')}`
      );
    }

    return true;
  }
}
