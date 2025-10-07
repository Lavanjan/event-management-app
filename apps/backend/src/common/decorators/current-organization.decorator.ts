import { createParamDecorator, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { User, UserType } from '../../database/entities';
import { validate as uuidValidate } from 'uuid';

export const CurrentOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    let organizationId: string;

    // Product admins can access any organization via query parameter
    if (user.userType === UserType.PRODUCT_ADMIN) {
      organizationId = request.query.organizationId || request.params.organizationId;
      if (!organizationId) {
        // If no organization specified for product admin, they can't access organization-scoped resources
        throw new ForbiddenException('Organization ID must be specified for product admin access');
      }
    } else {
      // Organization admins and users can only access their own organization
      if (!user.organizationId) {
        throw new ForbiddenException('User is not associated with any organization');
      }
      organizationId = user.organizationId;
    }

    // Validate that the organizationId is a valid UUID
    if (!uuidValidate(organizationId)) {
      throw new BadRequestException('Invalid organization ID format');
    }

    return organizationId;
  },
);
