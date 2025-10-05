import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionCheckService } from '../../modules/auth/permission-check.service';
import { SIMPLE_PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { User } from '../../database/entities';

@Injectable()
export class SimplePermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionCheckService: PermissionCheckService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(SIMPLE_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check each required permission
    for (const permission of requiredPermissions) {
      const result = await this.permissionCheckService.checkPermission(user, permission);
      
      if (!result.hasPermission) {
        throw new ForbiddenException(`Insufficient permissions. Required permission: ${permission}`);
      }
    }

    return true;
  }
}
