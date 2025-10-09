import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, User } from '../../database/entities';
import { UpdateOrganizationSettingsDto, UpdateUserPreferencesDto } from './dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Organization Settings
  async getOrganizationSettings(organizationId: string): Promise<any> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      select: ['id', 'name', 'settings', 'metadata'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Return default settings if none exist
    const defaultSettings = {
      displayName: organization.name,
      description: '',
      website: '',
      phone: '',
      address: '',
      currency: 'LKR',
      timezone: 'Asia/Colombo',
      defaultAdvancePercentage: 25,
      defaultBalancePaymentWindowDays: 7,
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      enableAutoBookingConfirmation: true,
      enableInventoryTracking: true,
      enableFinancialReporting: true,
      branding: {
        primaryColor: '#14A76C',
        secondaryColor: '#ffffff',
        logoUrl: '',
        faviconUrl: '',
      },
      emailSettings: {
        fromName: organization.name,
        fromEmail: '',
        replyToEmail: '',
      },
      businessHours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: true },
      },
    };

    return {
      ...defaultSettings,
      ...organization.settings,
    };
  }

  async updateOrganizationSettings(
    organizationId: string,
    updateDto: UpdateOrganizationSettingsDto,
  ): Promise<any> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Merge with existing settings
    const currentSettings = organization.settings || {};
    const updatedSettings = {
      ...currentSettings,
      ...updateDto,
    };

    // Update the organization
    await this.organizationRepository.update(organizationId, {
      settings: updatedSettings as any,
    });

    return this.getOrganizationSettings(organizationId);
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'firstName', 'lastName', 'email', 'preferences'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      themeMode: 'light',
      language: 'en',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
      timezone: 'Asia/Colombo',
      enableDesktopNotifications: true,
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      enableSoundNotifications: true,
      dashboardLayout: {
        compactMode: false,
        showQuickActions: true,
        defaultView: 'grid',
        itemsPerPage: 25,
      },
      tablePreferences: {
        density: 'comfortable',
        showRowNumbers: false,
        defaultPageSize: 25,
        stickyHeader: true,
      },
      calendarPreferences: {
        defaultView: 'month',
        startOfWeek: 'sunday',
        showWeekends: true,
        workingHours: { start: '09:00', end: '17:00' },
      },
      accessibilityPreferences: {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        screenReader: false,
      },
    };

    return {
      ...defaultPreferences,
      ...(user as any).preferences,
    };
  }

  async updateUserPreferences(
    userId: string,
    updateDto: UpdateUserPreferencesDto,
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Merge with existing preferences
    const currentPreferences = (user as any).preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...updateDto,
    };

    // Update the user
    await this.userRepository.update(userId, {
      preferences: updatedPreferences as any,
    } as any);

    return this.getUserPreferences(userId);
  }

  // User Profile
  async getUserProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'userType',
        'isActive',
        'lastLogin',
        'createdAt',
        'organizationId',
      ],
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      userType: user.userType,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      organizationId: user.organizationId,
      roles: user.roles?.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
      })) || [],
    };
  }

  async updateUserProfile(
    userId: string,
    updateDto: { firstName?: string; lastName?: string },
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update only allowed fields
    if (updateDto.firstName !== undefined) {
      user.firstName = updateDto.firstName;
    }
    if (updateDto.lastName !== undefined) {
      user.lastName = updateDto.lastName;
    }

    await this.userRepository.save(user);

    return this.getUserProfile(userId);
  }
}
