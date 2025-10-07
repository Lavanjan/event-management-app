import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  MasterPermission,
  OrganizationPermission,
  RolePermission,
  Organization,
  User,
  UserPermission,
  OrganizationPackage,
  FeaturePackage
} from '../../database/entities';
import { MasterPermissionsService } from './master-permissions.service';
import { EnhancedPermissionCheckService } from './enhanced-permission-check.service';
import { OrganizationPermissionsService } from '../organizations/organization-permissions.service';
import { ComprehensivePermissionService } from './comprehensive-permission.service';

import { PermissionsController } from './permissions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MasterPermission,
      OrganizationPermission,
      RolePermission,
      Organization,
      User,
      UserPermission,
      OrganizationPackage,
      FeaturePackage
    ]),
  ],
  providers: [
    MasterPermissionsService,
    EnhancedPermissionCheckService,
    OrganizationPermissionsService,
    ComprehensivePermissionService
  ],
  controllers: [PermissionsController],
  exports: [
    MasterPermissionsService,
    EnhancedPermissionCheckService,
    OrganizationPermissionsService,
    ComprehensivePermissionService
  ],
})
export class PermissionsModule {}
