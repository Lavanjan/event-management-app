import { createParamDecorator, ExecutionContext, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { User, UserType } from '../../database/entities';
import { validate as uuidValidate } from 'uuid';

const logger = new Logger('CurrentOrganization');

export const CurrentOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      logger.error('User not authenticated in CurrentOrganization decorator');
      throw new ForbiddenException('User not authenticated');
    }

    logger.debug(`CurrentOrganization decorator called for user: ${user.email}, userType: ${user.userType}, organizationId: ${user.organizationId}`);

    let organizationId: string;

    // Product admins can access any organization via query parameter
    if (user.userType === UserType.PRODUCT_ADMIN) {
      organizationId = request.query.organizationId || request.params.organizationId;
      if (!organizationId) {
        logger.error(`Product admin ${user.email} attempted to access organization-scoped resource without organizationId`);
        throw new ForbiddenException('Organization ID must be specified for product admin access');
      }
    } else {
      // Organization admins and users can only access their own organization
      if (!user.organizationId) {
        logger.error(`User ${user.email} (${user.userType}) is not associated with any organization. User ID: ${user.id}`);
        throw new ForbiddenException('User is not associated with any organization');
      }
      organizationId = user.organizationId;
    }

    // Validate that the organizationId is a valid UUID
    if (!organizationId || !uuidValidate(organizationId)) {
      logger.error(`Invalid organization ID format: ${organizationId} for user ${user.email}`);
      throw new BadRequestException('Validation failed (uuid is expected)');
    }

    logger.debug(`CurrentOrganization decorator returning organizationId: ${organizationId} for user: ${user.email}`);
    return organizationId;
  },
);
