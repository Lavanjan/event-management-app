import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterPermission, OrganizationPermission, RolePermission, Organization, User } from '../../database/entities';
import { MasterPermissionsService } from './master-permissions.service';
import { EnhancedPermissionCheckService } from './enhanced-permission-check.service';
import { OrganizationPermissionsService } from '../organizations/organization-permissions.service';
import { PermissionsController } from './permissions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MasterPermission, OrganizationPermission, RolePermission, Organization, User]),
  ],
  providers: [MasterPermissionsService, EnhancedPermissionCheckService, OrganizationPermissionsService],
  controllers: [PermissionsController],
  exports: [MasterPermissionsService, EnhancedPermissionCheckService, OrganizationPermissionsService],
})
export class PermissionsModule {}
