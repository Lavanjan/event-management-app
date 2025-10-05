import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/permissions.decorator';
import { PermissionCheckService } from '../../modules/auth/permission-check.service';
import { User } from '../../database/entities';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionCheckService: PermissionCheckService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check each required permission using the new permission system
    for (const permission of requiredPermissions) {
      const permissionKey = `${permission.resource}.${permission.action}`;
      const result = await this.permissionCheckService.checkPermission(user, permissionKey);

      if (!result.hasPermission) {
        throw new ForbiddenException(
          `Insufficient permissions. Required permission: ${permissionKey}. Reason: ${result.reason}`
        );
      }
    }

    return true;
  }
}
