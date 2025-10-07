import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { SecureAuthService } from './secure-auth.service';
import { AuthController } from './auth.controller';
import { VerificationController } from './verification.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { SecureAuthGuard } from './guards/secure-auth.guard';
import {
  User,
  Organization,
  MasterPermission,
  RolePermission,
  OrganizationPermission,
  UserPermission,
  OrganizationPackage,
  FeaturePackage
} from '../../database/entities';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PermissionCheckService } from './permission-check.service';
import { EnhancedPermissionCheckService } from '../permissions/enhanced-permission-check.service';
import { MenuService } from './services/menu.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      MasterPermission,
      RolePermission,
      OrganizationPermission,
      UserPermission,
      OrganizationPackage,
      FeaturePackage
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule),
    EmailModule,
    PermissionsModule,
  ],
  controllers: [AuthController, VerificationController],
  providers: [AuthService, SecureAuthService, SecureAuthGuard, JwtStrategy, LocalStrategy, PermissionCheckService, EnhancedPermissionCheckService, MenuService],
  exports: [AuthService, SecureAuthService, SecureAuthGuard, JwtModule, PermissionCheckService],
})
export class AuthModule {}
