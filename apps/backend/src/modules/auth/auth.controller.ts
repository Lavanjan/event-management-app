import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Get,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { SecureAuthService } from './secure-auth.service';
import { PermissionCheckService } from './permission-check.service';
import { MenuService } from './services/menu.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserMenuDto } from './dto/menu-item.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SecureAuthGuard, AuthenticatedRequest } from './guards/secure-auth.guard';
import { User, UserType } from '../../database/entities';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly secureAuthService: SecureAuthService,
    private readonly permissionCheckService: PermissionCheckService,
    private readonly menuService: MenuService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Secure user login with HTTP-only cookies' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.secureAuthService.login(loginDto, req, res);
  }

  @Public()
  @Post('login-jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Legacy JWT login (deprecated)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginJWT(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.secureAuthService.register(registerDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Secure logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.sessionId;
    return this.secureAuthService.logout(sessionId, res);
  }

  @UseGuards(SecureAuthGuard)
  @Get('me')
  @Throttle({ default: { limit: 300, ttl: 60000 } }) // Allow 300 requests per minute for this endpoint
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'Current user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Req() req: AuthenticatedRequest) {
    const sessionId = req.cookies?.sessionId;
    const user = await this.secureAuthService.getCurrentUser(sessionId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        organizationId: user.organizationId,
        roles: user.roles?.map(role => role.name) || [],
        permissions: req.session?.permissions || [],
      },
    };
  }

  @UseGuards(SecureAuthGuard)
  @Patch('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    await this.authService.changePassword(req.user.id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent if user exists' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password reset successfully' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('permissions')
  @UseGuards(SecureAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user permissions with three-tier evaluation' })
  @ApiResponse({ status: 200, description: 'User permissions retrieved successfully' })
  async getUserPermissions(@CurrentUser() user: User) {
    try {
      // Use fallback permission system for now
      const fallbackPermissions = await this.permissionCheckService.getUserPermissions(user);

      return {
        success: true,
        data: {
          userId: user.id,
          userType: user.userType,
          organizationId: user.organizationId,
          effectivePermissions: fallbackPermissions,
          rolePermissions: fallbackPermissions,
          userOverrides: { grants: [], denies: [] },
          availableFeatures: [],
          isProductAdmin: user.userType === UserType.PRODUCT_ADMIN,
          permissionEvaluation: {
            source: 'fallback-system',
            description: 'Using fallback permission system - comprehensive system will be enabled later'
          }
        },
      };
    } catch (error) {
      // Fallback to old permission system if comprehensive fails
      try {
        const fallbackPermissions = await this.permissionCheckService.getUserPermissions(user);
        return {
          success: true,
          data: {
            userId: user.id,
            userType: user.userType,
            organizationId: user.organizationId,
            permissions: fallbackPermissions,
            availableFeatures: [],
            isProductAdmin: user.userType === UserType.PRODUCT_ADMIN,
            permissionEvaluation: {
              source: 'fallback-system',
              description: 'Using fallback permission system due to error in comprehensive evaluation'
            }
          },
        };
      } catch (fallbackError) {
        return {
          success: false,
          message: 'Failed to get user permissions',
          data: {
            userId: user.id,
            userType: user.userType,
            organizationId: user.organizationId,
            permissions: [],
            availableFeatures: [],
            isProductAdmin: user.userType === UserType.PRODUCT_ADMIN,
          },
        };
      }
    }
  }

  @Get('menu')
  @UseGuards(SecureAuthGuard)
  @Throttle({ default: { limit: 200, ttl: 60000 } }) // Allow 200 requests per minute for menu endpoint
  @ApiOperation({ summary: 'Get user menu items based on permissions' })
  @ApiResponse({ status: 200, description: 'User menu items retrieved successfully' })
  async getUserMenu(@Req() req: AuthenticatedRequest): Promise<{ success: boolean; data: UserMenuDto }> {
    try {
      const user = req.user;
      const menuData = await this.menuService.getUserMenu(user);

      return {
        success: true,
        data: menuData,
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to get user menu');
    }
  }
}
