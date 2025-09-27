import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User, UserType } from '../../database/entities';

export const CurrentOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Product admins can access any organization via query parameter
    if (user.userType === UserType.PRODUCT_ADMIN) {
      const organizationId = request.query.organizationId || request.params.organizationId;
      if (organizationId) {
        return organizationId;
      }
      // If no organization specified for product admin, they can't access organization-scoped resources
      throw new ForbiddenException('Organization ID must be specified for product admin access');
    }

    // Organization admins and users can only access their own organization
    if (!user.organizationId) {
      throw new ForbiddenException('User is not associated with any organization');
    }

    return user.organizationId;
  },
);
