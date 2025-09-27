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
}
