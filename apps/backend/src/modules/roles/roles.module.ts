import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesController } from './roles.controller';
import { EnhancedRoleController } from './enhanced-role.controller';
import { RolesService } from './roles.service';
import { EnhancedRoleService } from './enhanced-role.service';
import { Role } from '../../database/entities/role.entity';
import { Permission } from '../../database/entities/permission.entity';
import { RolePermission } from '../../database/entities/role-permission.entity';
import { MasterPermission } from '../../database/entities/master-permission.entity';
import { OrganizationPermission } from '../../database/entities/organization-permission.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission, MasterPermission, OrganizationPermission]), AuthModule],
  controllers: [RolesController, EnhancedRoleController],
  providers: [RolesService, EnhancedRoleService],
  exports: [RolesService, EnhancedRoleService],
})
export class RolesModule {}
