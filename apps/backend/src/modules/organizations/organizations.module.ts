import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationPermissionsService } from './organization-permissions.service';
import { Organization, User, Role, OrganizationPermission } from '../../database/entities';
import { EmailModule } from '../email/email.module';
import { EmailUtil } from '../../common/utils/email.util';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, User, Role, OrganizationPermission]),
    EmailModule,
    AuthModule,
    PermissionsModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationPermissionsService, EmailUtil],
  exports: [OrganizationsService, OrganizationPermissionsService],
})
export class OrganizationsModule {}
