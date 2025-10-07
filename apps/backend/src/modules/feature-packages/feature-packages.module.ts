import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeaturePackagesService } from './feature-packages.service';
import { FeaturePackagesController } from './feature-packages.controller';
import { FeaturePackage, OrganizationPackage, MasterPermission } from '../../database/entities';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeaturePackage, OrganizationPackage, MasterPermission]),
    PermissionsModule,
    AuthModule,
  ],
  controllers: [FeaturePackagesController],
  providers: [FeaturePackagesService],
  exports: [FeaturePackagesService],
})
export class FeaturePackagesModule {}
