import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateOrganizationSettingsDto, UpdateUserPreferencesDto } from './dto';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireUserType } from '../auth/decorators/user-type.decorator';
import { UserType } from '../../database/entities';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(SecureAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Organization Settings
  @Get('organization')
  @RequireUserType(UserType.ORGANIZATION_ADMIN, UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Get organization settings' })
  @ApiResponse({ status: 200, description: 'Organization settings retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrganizationSettings(@CurrentOrganization() organizationId: string) {
    return this.settingsService.getOrganizationSettings(organizationId);
  }

  @Put('organization')
  @RequireUserType(UserType.ORGANIZATION_ADMIN, UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Update organization settings' })
  @ApiResponse({ status: 200, description: 'Organization settings updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async updateOrganizationSettings(
    @CurrentOrganization() organizationId: string,
    @Body() updateDto: UpdateOrganizationSettingsDto,
  ) {
    return this.settingsService.updateOrganizationSettings(organizationId, updateDto);
  }

  // User Preferences
  @Get('preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPreferences(@CurrentUser() user: any) {
    return this.settingsService.getUserPreferences(user.id);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserPreferences(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateUserPreferencesDto,
  ) {
    return this.settingsService.updateUserPreferences(user.id, updateDto);
  }

  // User Profile
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@CurrentUser() user: any) {
    return this.settingsService.getUserProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserProfile(
    @CurrentUser() user: any,
    @Body() updateDto: { firstName?: string; lastName?: string },
  ) {
    return this.settingsService.updateUserProfile(user.id, updateDto);
  }

  // Admin-only: Get any user's profile
  @Get('profile/:userId')
  @RequireUserType(UserType.ORGANIZATION_ADMIN, UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Get user profile by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfileById(@Param('userId') userId: string) {
    return this.settingsService.getUserProfile(userId);
  }

  // Admin-only: Update any user's profile
  @Put('profile/:userId')
  @RequireUserType(UserType.ORGANIZATION_ADMIN, UserType.PRODUCT_ADMIN)
  @ApiOperation({ summary: 'Update user profile by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserProfileById(
    @Param('userId') userId: string,
    @Body() updateDto: { firstName?: string; lastName?: string },
  ) {
    return this.settingsService.updateUserProfile(userId, updateDto);
  }
}
