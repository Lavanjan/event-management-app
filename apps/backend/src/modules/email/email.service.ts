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
      const subject = `Welcome to ${data.organizationName} - Your Admin Account is Ready`;

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
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${data.organizationName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f7882f; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #f7882f; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #f7882f; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${data.organizationName}</h1>
            <p>Your Organization Admin Account is Ready</p>
          </div>
          
          <div class="content">
            <h2>Hello ${data.firstName} ${data.lastName},</h2>
            
            <p>Congratulations! Your organization <strong>${
              data.organizationName
            }</strong> has been successfully set up in our Event Booking System, and you have been designated as the Organization Administrator.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${data.email}</p>
              ${
                data.temporaryPassword
                  ? `
                <p><strong>Temporary Password:</strong> <code>${data.temporaryPassword}</code></p>
                <div class="warning">
                  <strong>Important:</strong> This is a temporary password. Please change it immediately after your first login for security purposes.
                </div>
              `
                  : `
                <p><strong>Password:</strong> Use the password you provided during setup.</p>
              `
              }
            </div>
            
            <h3>As an Organization Administrator, you can:</h3>
            <ul>
              <li>Create and manage users within your organization</li>
              <li>Create custom roles and assign permissions</li>
              <li>Manage events, inventory, and bookings</li>
              <li>Access financial reports and analytics</li>
              <li>Configure organization settings</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${data.loginUrl}" class="button">Login to Your Account</a>
            </div>
            
            <h3>Next Steps:</h3>
            <ol>
              <li>Click the login button above to access your account</li>
              ${data.temporaryPassword ? '<li>Change your temporary password immediately</li>' : ''}
              <li>Complete your organization profile</li>
              <li>Set up your team members and their roles</li>
              <li>Start creating events and managing inventory</li>
            </ol>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Welcome aboard!</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from the Event Booking System. Please do not reply to this email.</p>
            <p>If you did not expect this email, please contact our support team immediately.</p>
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
      const subject = `Verify Your Account - ${data.organizationName}`;

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
      const subject = 'Verify Your Account - Action Required';

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
      const subject = `Your Account Credentials${
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
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .verification-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #4f46e5; }
        .otp-code { font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #4f46e5; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; border: none; cursor: pointer; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Verify Your Account</h1>
    </div>
    <div class="content">
        <h2>Hello ${data.firstName} ${data.lastName},</h2>

        <p>Welcome to the Event Booking System${
          data.organizationName ? ` for ${data.organizationName}` : ''
        }! To complete your account setup, please verify your email address.</p>

        <div class="verification-box">
            <h3>Verification Options</h3>

            <p><strong>Option 1: Click to go to verification page</strong></p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 20px auto;">
              <tr>
                <td style="background-color: #4f46e5; border-radius: 6px; text-align: center; padding: 0;">
                  <a href="${
                    data.verificationUrl
                  }" style="display: block; padding: 15px 30px; color: #ffffff; text-decoration: none; font-weight: bold; font-family: Arial, sans-serif; font-size: 16px; line-height: 1; border-radius: 6px;">Go to Verification Page</a>
                </td>
              </tr>
            </table>

            <p style="margin: 10px 0; font-size: 14px; color: #666;">
              Or copy and paste this link in your browser:<br>
              <a href="${data.verificationUrl}" style="color: #4f46e5; word-break: break-all;">${
      data.verificationUrl
    }</a>
            </p>

            <p><strong>Option 2: Enter the OTP code directly</strong></p>
            <div class="otp-code">${data.otp}</div>
            <p>Click the button above to go to the verification page, then enter this 6-digit code to complete verification</p>
        </div>

        <div class="warning">
            <strong>⚠️ Important:</strong> This verification code will expire in ${
              data.expiryMinutes
            } minutes. If you don't verify within this time, you'll need to request a new verification email.
        </div>

        <p>If you didn't create this account, please ignore this email or contact our support team.</p>

        <div class="footer">
            <p>This email was sent from the Event Booking System. Please do not reply to this email.</p>
            <p>If you need assistance, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateUserVerificationText(data: UserVerificationData): string {
    return `
Verify Your Account

Hello ${data.firstName} ${data.lastName},

Welcome to the Event Booking System${
      data.organizationName ? ` for ${data.organizationName}` : ''
    }! To complete your account setup, please verify your email address.

Verification Options:

Option 1: Go to verification page
${data.verificationUrl}

Option 2: Enter the OTP code directly
${data.otp}

Click the link above to go to the verification page, then enter this 6-digit code to complete verification.

⚠️ Important: This verification code will expire in ${data.expiryMinutes} minutes.

If you didn't create this account, please ignore this email or contact our support team.

---
This email was sent from the Event Booking System. Please do not reply to this email.
If you need assistance, please contact our support team.
    `;
  }

  private generateUserCredentialsHtml(data: UserCredentialsData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Account Credentials</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #4f46e5; }
        .password { font-family: monospace; font-size: 18px; background: #f3f4f6; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Your Account Credentials</h1>
    </div>
    <div class="content">
        <h2>Hello ${data.firstName} ${data.lastName},</h2>

        <p>Your account has been created${
          data.organizationName ? ` for ${data.organizationName}` : ''
        }. Here are your login credentials:</p>

        <div class="credentials-box">
            <h3>Login Information</h3>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Temporary Password:</strong></p>
            <div class="password">${data.temporaryPassword}</div>
            <a href="${data.loginUrl}" class="button">Login Now</a>
        </div>

        ${
          data.requiresVerification
            ? `
        <div class="warning">
            <strong>⚠️ Account Verification Required</strong>
            <p>Before you can use your account, you need to verify your email address.</p>
            ${
              data.verificationUrl
                ? `<a href="${data.verificationUrl}" class="button">Verify Account</a>`
                : ''
            }
            ${data.otp ? `<p>Or use this OTP code: <strong>${data.otp}</strong></p>` : ''}
        </div>
        `
            : ''
        }

        <div class="warning">
            <strong>🔒 Security Notice:</strong> Please change your temporary password immediately after logging in for security purposes.
        </div>

        <div class="footer">
            <p>This email was sent from the Event Booking System. Please do not reply to this email.</p>
            <p>If you need assistance, please contact our support team.</p>
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
