import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Organization,
  User,
  Role,
  UserType,
  RoleScope,
  OrganizationStatus,
} from '../../database/entities';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
import { FindOrganizationsDto } from './dto/find-organizations.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { EmailService } from '../email/email.service';
import { EmailUtil } from '../../common/utils/email.util';
import { OrganizationPermissionsService } from './organization-permissions.service';
import * as crypto from 'crypto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private dataSource: DataSource,
    private emailService: EmailService,
    private emailUtil: EmailUtil,
    private organizationPermissionsService: OrganizationPermissionsService
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate slug if not provided
      const slug = createOrganizationDto.slug || this.generateSlug(createOrganizationDto.name);

      // Check if slug already exists
      const existingOrg = await this.organizationRepository.findOne({ where: { slug } });
      if (existingOrg) {
        throw new ConflictException(`Organization with slug '${slug}' already exists`);
      }

      // Check if admin email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: createOrganizationDto.admin.email },
      });
      if (existingUser) {
        throw new ConflictException(
          `User with email '${createOrganizationDto.admin.email}' already exists`
        );
      }

      // Create organization
      const { admin, ...organizationData } = createOrganizationDto;
      const requiresVerification = createOrganizationDto.admin.requiresVerification !== false;

      const organization = this.organizationRepository.create({
        ...organizationData,
        slug,
        status: requiresVerification ? OrganizationStatus.PENDING : OrganizationStatus.ACTIVE, // Set status based on verification requirement
      });

      const savedOrganization = await queryRunner.manager.save(organization);

      // Initialize default permissions for the organization
      try {
        await this.organizationPermissionsService.initializeDefaultPermissions(
          savedOrganization.id
        );
        console.log(
          `Successfully initialized permissions for organization ${savedOrganization.id}`
        );
      } catch (permissionError) {
        console.error('Error initializing permissions:', permissionError);
        // Don't fail the transaction for permission initialization errors
      }

      // Generate password if needed
      const password =
        admin.password || (admin.autoGeneratePassword !== false ? this.generatePassword() : null);

      if (!password) {
        throw new BadRequestException(
          'Password must be provided or auto-generation must be enabled'
        );
      }

      // Create organization admin user
      // requiresVerification already defined above
      const verificationOtp = requiresVerification ? this.generateOtp() : null;
      const verificationOtpExpires = requiresVerification
        ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        : null;

      const adminUser = this.userRepository.create({
        email: createOrganizationDto.admin.email,
        firstName: createOrganizationDto.admin.firstName,
        lastName: createOrganizationDto.admin.lastName,
        password,
        userType: UserType.ORGANIZATION_ADMIN,
        organizationId: savedOrganization.id,
        isActive: !requiresVerification, // Only active if no verification required
        requiresVerification,
        verificationOtp,
        verificationOtpExpires,
      });

      const savedAdmin = await queryRunner.manager.save(adminUser);

      // Create default organization admin role
      const adminRole = this.roleRepository.create({
        name: 'Organization Admin',
        description: 'Full administrative access within the organization',
        scope: RoleScope.ORGANIZATION,
        organizationId: savedOrganization.id,
      });

      const savedRole = await queryRunner.manager.save(adminRole);

      // Assign role to admin user
      savedAdmin.roles = [savedRole];
      await queryRunner.manager.save(savedAdmin);

      // Send verification email or welcome email
      if (requiresVerification) {
        await this.emailService.sendVerificationEmail({
          email: savedAdmin.email,
          firstName: savedAdmin.firstName,
          lastName: savedAdmin.lastName,
          organizationName: savedOrganization.name,
          verificationOtp: verificationOtp,
          verificationUrl: `${
            process.env.FRONTEND_URL || 'http://localhost:4201'
          }/verify-otp?token=${savedAdmin.id}`,
          // Don't send password in verification email - will be sent after verification
        });
      } else {
        await this.emailService.sendOrganizationAdminWelcome({
          email: savedAdmin.email,
          firstName: savedAdmin.firstName,
          lastName: savedAdmin.lastName,
          organizationName: savedOrganization.name,
          loginUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
          temporaryPassword:
            createOrganizationDto.admin.autoGeneratePassword !== false ? password : undefined,
        });
      }

      await queryRunner.commitTransaction();

      return this.findOne(savedOrganization.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating organization:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
        table: error.table,
        column: error.column,
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    findOrganizationsDto: FindOrganizationsDto
  ): Promise<PaginatedResponseDto<Organization>> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = findOrganizationsDto;

    const queryBuilder = this.organizationRepository.createQueryBuilder('organization');

    // Add search filter
    if (search) {
      queryBuilder.where(
        'organization.name ILIKE :search OR organization.slug ILIKE :search OR organization.email ILIKE :search',
        { search: `%${search}%` }
      );
    }

    // Add status filter
    if (status) {
      if (search) {
        queryBuilder.andWhere('organization.status = :status', { status });
      } else {
        queryBuilder.where('organization.status = :status', { status });
      }
    }

    queryBuilder
      .orderBy(`organization.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with slug ${slug} not found`);
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(id);

    // If slug is being updated, check for conflicts
    if (updateOrganizationDto.slug && updateOrganizationDto.slug !== organization.slug) {
      const existingOrg = await this.organizationRepository.findOne({
        where: { slug: updateOrganizationDto.slug },
      });
      if (existingOrg) {
        throw new ConflictException(
          `Organization with slug '${updateOrganizationDto.slug}' already exists`
        );
      }
    }

    Object.assign(organization, updateOrganizationDto);
    return this.organizationRepository.save(organization);
  }

  async remove(id: string): Promise<void> {
    const organization = await this.findOne(id);

    // Only allow deletion if organization is not active
    if (organization.status === OrganizationStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot delete an active organization. Please suspend it first.'
      );
    }

    // Check if organization has any related data that would prevent deletion
    const userCount = await this.userRepository.count({ where: { organizationId: id } });

    if (userCount > 1) {
      // More than just the admin user
      throw new BadRequestException(
        'Cannot delete organization with existing users. Please remove all users first.'
      );
    }

    // Check for other relationships (events, bookings, etc.)
    // Note: Add more checks here as needed for other entities

    // If only admin user exists, delete the user first, then the organization
    if (userCount === 1) {
      const adminUser = await this.userRepository.findOne({
        where: { organizationId: id, userType: UserType.ORGANIZATION_ADMIN },
      });
      if (adminUser) {
        await this.userRepository.remove(adminUser);
      }
    }

    await this.organizationRepository.remove(organization);
  }

  async suspendOrganization(id: string): Promise<Organization> {
    const organization = await this.findOne(id);

    if (organization.status !== OrganizationStatus.ACTIVE) {
      throw new BadRequestException('Only active organizations can be suspended');
    }

    organization.status = OrganizationStatus.SUSPENDED;
    return await this.organizationRepository.save(organization);
  }

  async activateOrganization(id: string): Promise<Organization> {
    const organization = await this.findOne(id);

    if (organization.status === OrganizationStatus.ACTIVE) {
      throw new BadRequestException('Organization is already active');
    }

    organization.status = OrganizationStatus.ACTIVE;
    return await this.organizationRepository.save(organization);
  }

  async deactivateOrganization(id: string): Promise<Organization> {
    const organization = await this.findOne(id);

    if (organization.status === OrganizationStatus.INACTIVE) {
      throw new BadRequestException('Organization is already inactive');
    }

    organization.status = OrganizationStatus.INACTIVE;
    return await this.organizationRepository.save(organization);
  }

  async getOrganizationPermissions(id: string): Promise<any> {
    console.log(`Getting permissions for organization: ${id}`);
    try {
      const result = await this.organizationPermissionsService.getOrganizationPermissions(id);
      console.log(`Permissions result:`, result);
      return result;
    } catch (error) {
      console.error(`Error getting permissions for organization ${id}:`, error);
      throw error;
    }
  }

  async updateOrganizationPermissions(id: string, permissions: any[]): Promise<any> {
    return await this.organizationPermissionsService.updateOrganizationPermissions(id, permissions);
  }

  async resendVerificationEmail(id: string): Promise<any> {
    const organization = await this.findOne(id);

    // Find the organization admin user
    const adminUser = await this.userRepository.findOne({
      where: {
        organizationId: id,
        userType: UserType.ORGANIZATION_ADMIN,
      },
    });

    if (!adminUser) {
      throw new NotFoundException('Organization admin not found');
    }

    if (!adminUser.requiresVerification || adminUser.isVerified) {
      throw new BadRequestException('Organization admin is already verified');
    }

    // Generate new OTP
    const newOtp = this.generateOtp();
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new OTP
    adminUser.verificationOtp = newOtp;
    adminUser.verificationOtpExpires = newExpiry;
    await this.userRepository.save(adminUser);

    // Send verification email
    await this.emailService.sendUserVerification({
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      organizationName: organization.name,
      otp: newOtp,
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:4201'}/verify-otp?token=${
        adminUser.id
      }`,
      expiryMinutes: 1440, // 24 hours
    });

    return {
      success: true,
      message: 'Verification email sent successfully',
      organizationId: id,
      adminEmail: adminUser.email,
    };
  }

  async deleteOrganization(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const organization = await this.organizationRepository.findOne({
        where: { id },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      // Check if organization is active
      if (organization.status === OrganizationStatus.ACTIVE) {
        throw new BadRequestException(
          'Cannot delete active organization. Please suspend it first.'
        );
      }

      // Check if organization has any related users
      const userCount = await this.userRepository.count({
        where: { organizationId: id },
      });

      if (userCount > 0) {
        throw new BadRequestException('Cannot delete organization with existing users');
      }

      await this.organizationRepository.remove(organization);

      return {
        success: true,
        message: 'Organization deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete organization');
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private generatePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  }
}
