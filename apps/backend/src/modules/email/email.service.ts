import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface OrganizationAdminWelcomeData {
  email: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  loginUrl: string;
  temporaryPassword?: string;
}

export interface UserVerificationData {
  email: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  verificationUrl: string;
  otp: string;
  expiryMinutes: number;
}

export interface UserCredentialsData {
  email: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  loginUrl: string;
  temporaryPassword: string;
  requiresVerification: boolean;
  verificationUrl?: string;
  otp?: string;
}

export interface VerificationEmailData {
  email: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  verificationOtp: string;
  verificationUrl: string;
  temporaryPassword?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = {
      host: this.configService.get('SMTP_HOST', 'localhost'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: this.configService.get('SMTP_SECURE', false),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email configuration error:', error);
      } else {
        this.logger.log('Email server is ready to take our messages');
      }
    });
  }

  async sendOrganizationAdminWelcome(data: OrganizationAdminWelcomeData): Promise<void> {
    try {
      const subject = `Welcome to Eventorra - ${data.organizationName} Admin Account Ready`;

      const htmlContent = this.generateOrganizationAdminWelcomeHtml(data);
      const textContent = this.generateOrganizationAdminWelcomeText(data);

      const mailOptions = {
        from: this.configService.get('SMTP_FROM', 'noreply@eventbooking.com'),
        to: data.email,
        subject,
        text: textContent,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Organization admin welcome email sent to ${data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send organization admin welcome email to ${data.email}:`, error);
      throw error;
    }
  }

  private generateOrganizationAdminWelcomeHtml(data: OrganizationAdminWelcomeData): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${data.organizationName} - Eventorra</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #374151;
              background-color: #f9fafb;
              padding: 20px;
          }
          .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          .header {
              background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
          }
          .header h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
          }
          .header p {
              font-size: 16px;
              opacity: 0.9;
          }
          .content {
              padding: 40px 30px;
          }
          .greeting {
              font-size: 20px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 20px;
          }
          .intro-text {
              font-size: 16px;
              color: #6b7280;
              margin-bottom: 30px;
              line-height: 1.7;
          }
          .credentials-card {
              background: #f8fafc;
              border: 2px solid #0d9488;
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
          }
          .credentials-card h3 {
              color: #0d9488;
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 20px;
              text-align: center;
          }
          .credential-item {
              background: white;
              border-radius: 8px;
              padding: 15px;
              margin: 15px 0;
          }
          .credential-label {
              font-size: 14px;
              font-weight: 600;
              color: #6b7280;
              margin-bottom: 5px;
          }
          .credential-value {
              font-size: 16px;
              color: #111827;
              font-weight: 500;
          }
          .password-container {
              background: #f0fdf4;
              border: 2px dashed #0d9488;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
          }
          .password-value {
              font-family: 'Courier New', monospace;
              font-size: 18px;
              font-weight: 700;
              color: #0d9488;
              letter-spacing: 2px;
              margin: 10px 0;
              padding: 8px;
              background: white;
              border-radius: 6px;
          }
          .login-button {
              display: inline-block;
              background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
              color: white !important;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
          }
          .login-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
          }
          .features-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin: 30px 0;
          }
          .feature-card {
              background: #f8fafc;
              border-radius: 8px;
              padding: 20px;
              border-left: 4px solid #0d9488;
          }
          .feature-icon {
              font-size: 24px;
              margin-bottom: 10px;
          }
          .feature-title {
              font-weight: 600;
              color: #111827;
              margin-bottom: 8px;
          }
          .feature-desc {
              font-size: 14px;
              color: #6b7280;
          }
          .steps-list {
              background: #f0f9ff;
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
          }
          .steps-list h3 {
              color: #0ea5e9;
              margin-bottom: 20px;
              text-align: center;
          }
          .step-item {
              display: flex;
              align-items: flex-start;
              margin: 15px 0;
              padding: 10px 0;
          }
          .step-number {
              background: #0d9488;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 600;
              margin-right: 15px;
              flex-shrink: 0;
          }
          .step-text {
              color: #374151;
              font-size: 15px;
          }
          .warning-notice {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
          }
          .warning-notice strong {
              color: #92400e;
          }
          .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
          }
          .footer p {
              font-size: 14px;
              color: #6b7280;
              margin: 5px 0;
          }
          .brand-name {
              color: #0d9488;
              font-weight: 600;
          }
          @media (max-width: 600px) {
              .email-container { margin: 10px; border-radius: 12px; }
              .header { padding: 30px 20px; }
              .content { padding: 30px 20px; }
              .credentials-card { padding: 20px; }
              .features-grid { grid-template-columns: 1fr; }
              .password-value { font-size: 16px; letter-spacing: 1px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎉 Welcome to Eventorra!</h1>
            <p>Your organization admin account is ready</p>
          </div>

          <div class="content">
            <div class="greeting">Hello ${data.firstName} ${data.lastName},</div>

            <p class="intro-text">
                Congratulations! Your organization <span class="brand-name">${data.organizationName}</span> has been successfully set up on <span class="brand-name">Eventorra</span>, and you have been designated as the Organization Administrator. You now have access to all the powerful event management features.
            </p>

            <div class="credentials-card">
              <h3>🔐 Your Admin Login Credentials</h3>

              <div class="credential-item">
                  <div class="credential-label">📧 Email Address</div>
                  <div class="credential-value">${data.email}</div>
              </div>

              ${
                data.temporaryPassword
                  ? `
              <div class="credential-item">
                  <div class="credential-label">🔑 Temporary Password</div>
                  <div class="password-container">
                      <div class="password-value">${data.temporaryPassword}</div>
                      <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
                          💡 Copy this password to login
                      </p>
                  </div>
              </div>
              `
                  : `
              <div class="credential-item">
                  <div class="credential-label">🔑 Password</div>
                  <div class="credential-value">Use the password you provided during setup</div>
              </div>
              `
              }

              <div style="text-align: center; margin-top: 25px;">
                  <a href="${data.loginUrl}" class="login-button">🚀 Access Your Admin Dashboard</a>
              </div>
            </div>

            ${
              data.temporaryPassword
                ? `
            <div class="warning-notice">
                <strong>🔒 Security Notice:</strong> This is a temporary password. Please change it immediately after your first login for security purposes.
            </div>
            `
                : ''
            }

            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">👥</div>
                    <div class="feature-title">User Management</div>
                    <div class="feature-desc">Create and manage users within your organization</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🎭</div>
                    <div class="feature-title">Role & Permissions</div>
                    <div class="feature-desc">Create custom roles and assign permissions</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🎪</div>
                    <div class="feature-title">Event Management</div>
                    <div class="feature-desc">Manage events, inventory, and bookings</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <div class="feature-title">Analytics & Reports</div>
                    <div class="feature-desc">Access financial reports and analytics</div>
                </div>
            </div>

            <div class="steps-list">
                <h3>🚀 Next Steps to Get Started</h3>
                <div class="step-item">
                    <div class="step-number">1</div>
                    <div class="step-text">Click the login button above to access your admin dashboard</div>
                </div>
                ${data.temporaryPassword ? `
                <div class="step-item">
                    <div class="step-number">2</div>
                    <div class="step-text">Change your temporary password immediately for security</div>
                </div>
                ` : ''}
                <div class="step-item">
                    <div class="step-number">${data.temporaryPassword ? '3' : '2'}</div>
                    <div class="step-text">Complete your organization profile and settings</div>
                </div>
                <div class="step-item">
                    <div class="step-number">${data.temporaryPassword ? '4' : '3'}</div>
                    <div class="step-text">Set up your team members and assign their roles</div>
                </div>
                <div class="step-item">
                    <div class="step-number">${data.temporaryPassword ? '5' : '4'}</div>
                    <div class="step-text">Start creating events and managing your inventory</div>
                </div>
            </div>

            <p style="text-align: center; color: #6b7280; margin: 30px 0;">
                If you have any questions or need assistance, please don't hesitate to contact our support team. Welcome aboard! 🎊
            </p>
          </div>

          <div class="footer">
            <p><strong>Eventorra Team</strong></p>
            <p>This email was sent from Eventorra. Please do not reply to this email.</p>
            <p>Need help? Contact our support team anytime.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateOrganizationAdminWelcomeText(data: OrganizationAdminWelcomeData): string {
    return `
Welcome to ${data.organizationName}

Hello ${data.firstName} ${data.lastName},

Congratulations! Your organization "${
      data.organizationName
    }" has been successfully set up in our Event Booking System, and you have been designated as the Organization Administrator.

Your Login Credentials:
- Email: ${data.email}
${
  data.temporaryPassword
    ? `- Temporary Password: ${data.temporaryPassword}

IMPORTANT: This is a temporary password. Please change it immediately after your first login for security purposes.`
    : '- Password: Use the password you provided during setup.'
}

As an Organization Administrator, you can:
- Create and manage users within your organization
- Create custom roles and assign permissions
- Manage events, inventory, and bookings
- Access financial reports and analytics
- Configure organization settings

Login URL: ${data.loginUrl}

Next Steps:
1. Login to your account using the credentials above
${data.temporaryPassword ? '2. Change your temporary password immediately\n' : ''}${
      data.temporaryPassword ? '3' : '2'
    }. Complete your organization profile
${data.temporaryPassword ? '4' : '3'}. Set up your team members and their roles
${data.temporaryPassword ? '5' : '4'}. Start creating events and managing inventory

If you have any questions or need assistance, please don't hesitate to contact our support team.

Welcome aboard!

---
This email was sent from the Event Booking System. Please do not reply to this email.
If you did not expect this email, please contact our support team immediately.
    `;
  }

  async sendVerificationEmail(data: VerificationEmailData): Promise<void> {
    try {
      const subject = `Verify Your Eventorra Account - ${data.organizationName}`;

      const verificationData: UserVerificationData = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationName: data.organizationName,
        verificationUrl: data.verificationUrl,
        otp: data.verificationOtp,
        expiryMinutes: 1440, // 24 hours
      };

      const htmlContent = this.generateUserVerificationHtml(verificationData);
      const textContent = this.generateUserVerificationText(verificationData);

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', 'noreply@eventbooking.com'),
        to: data.email,
        subject,
        html: htmlContent,
        text: textContent,
      });

      this.logger.log(`Verification email sent to ${data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${data.email}:`, error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendUserVerification(data: UserVerificationData): Promise<void> {
    try {
      const subject = 'Verify Your Eventorra Account - Action Required';

      const htmlContent = this.generateUserVerificationHtml(data);
      const textContent = this.generateUserVerificationText(data);

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', 'noreply@eventbooking.com'),
        to: data.email,
        subject,
        html: htmlContent,
        text: textContent,
      });

      this.logger.log(`Verification email sent to ${data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${data.email}:`, error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendUserCredentials(data: UserCredentialsData): Promise<void> {
    try {
      const subject = `Your Eventorra Account Credentials${
        data.organizationName ? ` - ${data.organizationName}` : ''
      }`;

      const htmlContent = this.generateUserCredentialsHtml(data);
      const textContent = this.generateUserCredentialsText(data);

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', 'noreply@eventbooking.com'),
        to: data.email,
        subject,
        html: htmlContent,
        text: textContent,
      });

      this.logger.log(`Credentials email sent to ${data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send credentials email to ${data.email}:`, error);
      throw new Error('Failed to send credentials email');
    }
  }

  private generateUserVerificationHtml(data: UserVerificationData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account - Eventorra</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 20px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 20px;
        }
        .intro-text {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        .verification-card {
            background: #f8fafc;
            border: 2px solid #0d9488;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
        }
        .verification-card h3 {
            color: #0d9488;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .option-section {
            margin: 25px 0;
            padding: 20px 0;
        }
        .option-section:not(:last-child) {
            border-bottom: 1px solid #e5e7eb;
        }
        .option-title {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
        }
        .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
            color: white !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 15px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
        }
        .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
        }
        .url-text {
            font-size: 14px;
            color: #6b7280;
            margin: 15px 0;
            word-break: break-all;
        }
        .url-link {
            color: #0d9488;
            text-decoration: none;
        }
        .otp-container {
            background: white;
            border: 2px dashed #0d9488;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #0d9488;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 15px 0;
        }
        .otp-instruction {
            font-size: 14px;
            color: #6b7280;
            margin-top: 15px;
        }
        .warning-box {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        .warning-box strong {
            color: #92400e;
        }
        .security-note {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }
        .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            font-size: 14px;
            color: #6b7280;
            margin: 5px 0;
        }
        .brand-name {
            color: #0d9488;
            font-weight: 600;
        }
        @media (max-width: 600px) {
            .email-container { margin: 10px; border-radius: 12px; }
            .header { padding: 30px 20px; }
            .content { padding: 30px 20px; }
            .verification-card { padding: 20px; }
            .otp-code { font-size: 28px; letter-spacing: 4px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎉 Welcome to Eventorra!</h1>
            <p>Verify your account to get started</p>
        </div>

        <div class="content">
            <div class="greeting">Hello ${data.firstName} ${data.lastName},</div>

            <p class="intro-text">
                Welcome to <span class="brand-name">Eventorra</span>${
                  data.organizationName ? ` for <strong>${data.organizationName}</strong>` : ''
                }! We're excited to have you on board. To complete your account setup and ensure security, please verify your email address.
            </p>

            <div class="verification-card">
                <h3>📧 Email Verification Required</h3>

                <div class="option-section">
                    <div class="option-title">🚀 Option 1: Quick Verification</div>
                    <p style="color: #6b7280; margin-bottom: 15px;">Click the button below to verify instantly</p>
                    <a href="${data.verificationUrl}" class="verify-button">
                        ✓ Verify My Account
                    </a>
                    <div class="url-text">
                        Or copy this link: <a href="${data.verificationUrl}" class="url-link">${data.verificationUrl}</a>
                    </div>
                </div>

                <div class="option-section">
                    <div class="option-title">🔢 Option 2: Enter Verification Code</div>
                    <p style="color: #6b7280; margin-bottom: 15px;">Use this 6-digit code on the verification page</p>
                    <div class="otp-container">
                        <div class="otp-code">${data.otp}</div>
                        <div class="otp-instruction">Enter this code after clicking the verification button</div>
                    </div>
                </div>
            </div>

            <div class="warning-box">
                <strong>⏰ Time Sensitive:</strong> This verification code will expire in <strong>${data.expiryMinutes} minutes</strong>.
                If you don't verify within this time, you'll need to request a new verification email.
            </div>

            <div class="security-note">
                <strong>🔒 Security Notice:</strong> If you didn't create this account, please ignore this email or contact our support team immediately.
            </div>
        </div>

        <div class="footer">
            <p><strong>Eventorra Team</strong></p>
            <p>This email was sent from Eventorra. Please do not reply to this email.</p>
            <p>Need help? Contact our support team anytime.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateUserVerificationText(data: UserVerificationData): string {
    return `
🎉 Welcome to Eventorra!

Hello ${data.firstName} ${data.lastName},

Welcome to Eventorra${
      data.organizationName ? ` for ${data.organizationName}` : ''
    }! We're excited to have you on board. To complete your account setup and ensure security, please verify your email address.

📧 Email Verification Required

🚀 Option 1: Quick Verification
Click this link to verify instantly: ${data.verificationUrl}

🔢 Option 2: Enter Verification Code
Use this 6-digit code on the verification page: ${data.otp}

⏰ Time Sensitive: This verification code will expire in ${data.expiryMinutes} minutes. If you don't verify within this time, you'll need to request a new verification email.

🔒 Security Notice: If you didn't create this account, please ignore this email or contact our support team immediately.

---
Eventorra Team
This email was sent from Eventorra. Please do not reply to this email.
Need help? Contact our support team anytime.
    `;
  }

  private generateUserCredentialsHtml(data: UserCredentialsData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Account Credentials - Eventorra</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 20px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 20px;
        }
        .intro-text {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        .credentials-card {
            background: #f8fafc;
            border: 2px solid #0d9488;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
        }
        .credentials-card h3 {
            color: #0d9488;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .credential-item {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            text-align: left;
        }
        .credential-label {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            margin-bottom: 5px;
        }
        .credential-value {
            font-size: 16px;
            color: #111827;
            font-weight: 500;
        }
        .password-container {
            background: #f0fdf4;
            border: 2px dashed #0d9488;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .password-value {
            font-family: 'Courier New', monospace;
            font-size: 20px;
            font-weight: 700;
            color: #0d9488;
            letter-spacing: 2px;
            margin: 10px 0;
            padding: 10px;
            background: white;
            border-radius: 6px;
        }
        .login-button {
            display: inline-block;
            background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
            color: white !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
        }
        .login-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
        }
        .verification-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        .verification-notice strong {
            color: #92400e;
        }
        .security-notice {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }
        .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            font-size: 14px;
            color: #6b7280;
            margin: 5px 0;
        }
        .brand-name {
            color: #0d9488;
            font-weight: 600;
        }
        @media (max-width: 600px) {
            .email-container { margin: 10px; border-radius: 12px; }
            .header { padding: 30px 20px; }
            .content { padding: 30px 20px; }
            .credentials-card { padding: 20px; }
            .password-value { font-size: 16px; letter-spacing: 1px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🔐 Your Account is Ready!</h1>
            <p>Login credentials for Eventorra</p>
        </div>

        <div class="content">
            <div class="greeting">Hello ${data.firstName} ${data.lastName},</div>

            <p class="intro-text">
                Great news! Your account has been successfully created${
                  data.organizationName ? ` for <span class="brand-name">${data.organizationName}</span>` : ''
                } on <span class="brand-name">Eventorra</span>. You can now access all the powerful event management features.
            </p>

            <div class="credentials-card">
                <h3>🎯 Your Login Credentials</h3>

                <div class="credential-item">
                    <div class="credential-label">📧 Email Address</div>
                    <div class="credential-value">${data.email}</div>
                </div>

                <div class="credential-item">
                    <div class="credential-label">🔑 Temporary Password</div>
                    <div class="password-container">
                        <div class="password-value">${data.temporaryPassword}</div>
                        <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
                            💡 Copy this password to login
                        </p>
                    </div>
                </div>

                <a href="${data.loginUrl}" class="login-button">
                    🚀 Login to Eventorra
                </a>
            </div>

            ${
              data.requiresVerification
                ? `
            <div class="verification-notice">
                <strong>⚠️ Email Verification Required</strong>
                <p style="margin: 10px 0;">Before you can use your account, please verify your email address.</p>
                ${
                  data.verificationUrl
                    ? `<a href="${data.verificationUrl}" class="login-button" style="margin: 15px 0;">✓ Verify Email Address</a>`
                    : ''
                }
                ${data.otp ? `<p style="margin-top: 15px;">Or use this verification code: <strong style="color: #0d9488;">${data.otp}</strong></p>` : ''}
            </div>
            `
                : ''
            }

            <div class="security-notice">
                <strong>🔒 Important Security Notice:</strong> For your account security, please change this temporary password immediately after your first login. You can do this in your account settings.
            </div>
        </div>

        <div class="footer">
            <p><strong>Eventorra Team</strong></p>
            <p>This email was sent from Eventorra. Please do not reply to this email.</p>
            <p>Need help? Contact our support team anytime.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateUserCredentialsText(data: UserCredentialsData): string {
    return `
Your Account Credentials

Hello ${data.firstName} ${data.lastName},

Your account has been created${
      data.organizationName ? ` for ${data.organizationName}` : ''
    }. Here are your login credentials:

Email: ${data.email}
Temporary Password: ${data.temporaryPassword}

Login URL: ${data.loginUrl}

${
  data.requiresVerification
    ? `
⚠️ Account Verification Required
Before you can use your account, you need to verify your email address.
${data.verificationUrl ? `Verification URL: ${data.verificationUrl}` : ''}
${data.otp ? `OTP Code: ${data.otp}` : ''}
`
    : ''
}

🔒 Security Notice: Please change your temporary password immediately after logging in for security purposes.

---
This email was sent from the Event Booking System. Please do not reply to this email.
If you need assistance, please contact our support team.
    `;
  }
}
