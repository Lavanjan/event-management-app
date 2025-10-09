import { api } from './api';

export interface OrganizationSettings {
  displayName?: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  currency?: string;
  timezone?: string;
  defaultAdvancePercentage?: number;
  defaultBalancePaymentWindowDays?: number;
  enableEmailNotifications?: boolean;
  enableSmsNotifications?: boolean;
  enableAutoBookingConfirmation?: boolean;
  enableInventoryTracking?: boolean;
  enableFinancialReporting?: boolean;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  emailSettings?: {
    fromName?: string;
    fromEmail?: string;
    replyToEmail?: string;
  };
  businessHours?: {
    [key: string]: {
      open?: string;
      close?: string;
      closed?: boolean;
    };
  };
}

export interface UserPreferences {
  themeMode?: 'light' | 'dark' | 'system';
  language?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  timezone?: string;
  enableDesktopNotifications?: boolean;
  enableEmailNotifications?: boolean;
  enableSmsNotifications?: boolean;
  enableSoundNotifications?: boolean;
  dashboardLayout?: {
    compactMode?: boolean;
    showQuickActions?: boolean;
    defaultView?: string;
    itemsPerPage?: number;
  };
  tablePreferences?: {
    density?: string;
    showRowNumbers?: boolean;
    defaultPageSize?: number;
    stickyHeader?: boolean;
  };
  calendarPreferences?: {
    defaultView?: string;
    startOfWeek?: string;
    showWeekends?: boolean;
    workingHours?: {
      start?: string;
      end?: string;
    };
  };
  accessibilityPreferences?: {
    highContrast?: boolean;
    largeText?: boolean;
    reducedMotion?: boolean;
    screenReader?: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  userType: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  organizationId: string;
  roles: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

class SettingsService {
  // Organization Settings
  async getOrganizationSettings(): Promise<OrganizationSettings> {
    const response = await api.get('/settings/organization');
    return response.data;
  }

  async updateOrganizationSettings(settings: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    const response = await api.put('/settings/organization', settings);
    return response.data;
  }

  // User Preferences
  async getUserPreferences(): Promise<UserPreferences> {
    const response = await api.get('/settings/preferences');
    return response.data;
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await api.put('/settings/preferences', preferences);
    return response.data;
  }

  // User Profile
  async getUserProfile(): Promise<UserProfile> {
    const response = await api.get('/settings/profile');
    return response.data;
  }

  async updateUserProfile(profile: { firstName?: string; lastName?: string }): Promise<UserProfile> {
    const response = await api.put('/settings/profile', profile);
    return response.data;
  }

  // Admin functions
  async getUserProfileById(userId: string): Promise<UserProfile> {
    const response = await api.get(`/settings/profile/${userId}`);
    return response.data;
  }

  async updateUserProfileById(
    userId: string,
    profile: { firstName?: string; lastName?: string }
  ): Promise<UserProfile> {
    const response = await api.put(`/settings/profile/${userId}`, profile);
    return response.data;
  }
}

export const settingsService = new SettingsService();
