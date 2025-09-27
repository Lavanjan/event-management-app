import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { REQUIRE_USER_TYPE_KEY } from '../../modules/auth/decorators/user-type.decorator';
import { User, UserType } from '../../database/entities';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredUserTypes = this.reflector.getAllAndOverride<UserType[]>(REQUIRE_USER_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or user types are required, allow access
    if (!requiredRoles && !requiredUserTypes) {
      return true;
    }

    const { user }: { user: User } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check user type requirements first (higher priority)
    if (requiredUserTypes && requiredUserTypes.length > 0) {
      const hasUserType = requiredUserTypes.includes(user.userType);
      if (!hasUserType) {
        throw new ForbiddenException(
          `Access denied. Required user type: ${requiredUserTypes.join(', ')}`
        );
      }
    }

    // Check role requirements
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some(role =>
        user.roles?.some(userRole => userRole.name === role)
      );

      if (!hasRole) {
        throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
      }
    }

    return true;
  }
}
