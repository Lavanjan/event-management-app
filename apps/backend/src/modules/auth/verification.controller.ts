import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { IsString, IsNotEmpty } from 'class-validator';
import { User, Organization, OrganizationStatus } from '../../database/entities';
import { EmailService } from '../email/email.service';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

@ApiTags('Verification')
@Controller('verify')
export class VerificationController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private emailService: EmailService
  ) {}

  @Get('email')
  @ApiOperation({ summary: 'Redirect to OTP verification page' })
  @ApiResponse({ status: 302, description: 'Redirected to OTP verification page' })
  @ApiResponse({ status: 400, description: 'Invalid verification link' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyEmailLink(
    @Query('token') token: string,
    @Query('otp') otp: string,
    @Res() res: Response
  ) {
    try {
      // Validate that the token and OTP exist and are valid (but don't verify yet)
      await this.validateVerificationData(token, otp);

      // Redirect to frontend OTP verification page with token and email
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4201';
      return res.redirect(`${frontendUrl}/verify-otp?token=${token}`);
    } catch (error) {
      // Redirect to frontend with error message
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4201';
      const errorMessage = encodeURIComponent(error.message);
      return res.redirect(`${frontendUrl}/auth/verification-error?error=${errorMessage}`);
    }
  }

  @Post('email')
  @ApiOperation({ summary: 'Verify user email with OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const { token, otp } = verifyEmailDto;
    return await this.performVerification(token, otp);
  }

  @Post('resend')
  @ApiOperation({ summary: 'Resend verification OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'User already verified or invalid request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendOtp(@Body() body: { token: string }) {
    const { token } = body;

    const user = await this.userRepository.findOne({
      where: { id: token },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.requiresVerification || user.isVerified) {
      throw new BadRequestException('User does not require verification');
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new OTP
    user.verificationOtp = newOtp;
    user.verificationOtpExpires = newExpiry;
    await this.userRepository.save(user);

    // Here you would send the email with the new OTP
    // For now, we'll just return success
    return {
      success: true,
      message: 'Verification code sent successfully',
    };
  }

  private async validateVerificationData(token: string, otp: string): Promise<void> {
    if (!token || !otp) {
      throw new BadRequestException('Token and OTP are required');
    }

    // Find user by token (user ID)
    const user = await this.userRepository.findOne({
      where: { id: token },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already verified
    if (user.isVerified && user.isActive) {
      return; // Valid but already verified
    }

    // Validate OTP exists and matches
    if (!user.verificationOtp || user.verificationOtp !== otp) {
      throw new BadRequestException('Invalid verification code');
    }

    // Check if OTP has expired
    if (user.verificationOtpExpires && user.verificationOtpExpires < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }
  }

  private async performVerification(token: string, otp: string) {
    // Find user by ID (token is user ID)
    const user = await this.userRepository.findOne({
      where: { id: token },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.requiresVerification) {
      throw new BadRequestException('User does not require verification');
    }

    if (user.verificationOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.verificationOtpExpires && new Date() > user.verificationOtpExpires) {
      throw new BadRequestException('OTP has expired');
    }

    // Verify the user
    user.isActive = true;
    user.requiresVerification = false;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    user.isVerified = true;

    await this.userRepository.save(user);

    // If this is an organization admin, also activate the organization and send login credentials
    if (user.userType === 'organization_admin' && user.organizationId) {
      const organization = await this.organizationRepository.findOne({
        where: { id: user.organizationId },
      });

      if (organization && organization.status === OrganizationStatus.PENDING) {
        organization.status = OrganizationStatus.ACTIVE;
        await this.organizationRepository.save(organization);

        // Generate a new temporary password for security
        const temporaryPassword = this.generateTemporaryPassword();

        // Update user with new temporary password
        user.password = temporaryPassword; // Will be hashed by the entity hook
        await this.userRepository.save(user);

        // Send login credentials email after successful verification
        try {
          await this.emailService.sendOrganizationAdminWelcome({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            organizationName: organization.name,
            loginUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
            temporaryPassword: temporaryPassword,
          });
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
          // Don't fail the verification if email sending fails
        }
      }
    }

    return {
      success: true,
      message: 'Email verified successfully',
      data: {
        userId: user.id,
        email: user.email,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
    };
  }

  private generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  @Post('resend')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendVerification(@Body() body: { email: string }) {
    const user = await this.userRepository.findOne({
      where: { email: body.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.requiresVerification) {
      throw new BadRequestException('User does not require verification');
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationOtp = newOtp;
    user.verificationOtpExpires = newExpiry;

    await this.userRepository.save(user);

    // TODO: Send new verification email
    // await this.emailService.sendVerificationEmail(...)

    return {
      success: true,
      message: 'Verification email sent',
    };
  }
}
