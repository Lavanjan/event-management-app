import { Injectable } from '@nestjs/common';
import { EmailService } from '../../modules/email/email.service';

export interface BaseUserData {
  email: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

export interface VerificationEmailData extends BaseUserData {
  verificationOtp: string;
  verificationUrl: string;
  expiryMinutes?: number;
}

export interface WelcomeEmailData extends BaseUserData {
  loginUrl: string;
  temporaryPassword?: string;
}

@Injectable()
export class EmailUtil {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Send verification email for any user type (organization admin, regular user, etc.)
   */
  async sendVerificationEmail(data: VerificationEmailData): Promise<void> {
    await this.emailService.sendUserVerification({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      organizationName: data.organizationName,
      otp: data.verificationOtp,
      verificationUrl: data.verificationUrl,
      expiryMinutes: data.expiryMinutes || 1440, // 24 hours default
    });
  }

  /**
   * Send welcome email with credentials for any user type
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    if (data.organizationName) {
      await this.emailService.sendOrganizationAdminWelcome({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationName: data.organizationName,
        loginUrl: data.loginUrl,
        temporaryPassword: data.temporaryPassword,
      });
    } else {
      await this.emailService.sendUserCredentials({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationName: data.organizationName,
        loginUrl: data.loginUrl,
        temporaryPassword: data.temporaryPassword || '',
        requiresVerification: false,
      });
    }
  }

  /**
   * Generate verification URL for email verification
   */
  generateVerificationUrl(userId: string, otp: string): string {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return `${baseUrl}/api/verify/email?token=${userId}&otp=${otp}`;
  }

  /**
   * Generate frontend verification URL for OTP entry
   */
  generateFrontendVerificationUrl(token?: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    return token ? `${baseUrl}/verify?token=${token}` : `${baseUrl}/verify`;
  }

  /**
   * Generate login URL
   */
  generateLoginUrl(): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    return `${baseUrl}/login`;
  }

  /**
   * Generate OTP code
   */
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate secure password
   */
  generatePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Calculate OTP expiry date
   */
  calculateOtpExpiry(hours: number = 24): Date {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }
}
