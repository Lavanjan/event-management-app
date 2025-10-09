import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  Organization,
  User,
  Role,
  UserType,
  RoleScope,
  OrganizationStatus,
  RolePermission,
  OrganizationPackage,
  FeaturePackage,
  MasterPermission,
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
  private readonly logger = new Logger(OrganizationsService.name);

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
      const { admin, selectedPackage, ...organizationData } = createOrganizationDto;
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

      // Assign selected package to organization if provided
      if (selectedPackage) {
        const organizationPackageRepository =
          queryRunner.manager.getRepository(OrganizationPackage);
        const featurePackageRepository = queryRunner.manager.getRepository(FeaturePackage);

        // Verify the package exists and is active
        const featurePackage = await featurePackageRepository.findOne({
          where: { id: selectedPackage, isActive: true },
        });

        if (featurePackage) {
          const orgPackage = organizationPackageRepository.create({
            organizationId: savedOrganization.id,
            featurePackageId: selectedPackage,
            isActive: true,
            assignedBy: null, // System assignment
            assignedAt: new Date(),
          });

          await queryRunner.manager.save(orgPackage);
          this.logger.log(
            `Assigned feature package ${selectedPackage} to organization ${savedOrganization.id}`
          );
        } else {
          this.logger.warn(`Feature package ${selectedPackage} not found or inactive`);
        }
      }

      // Assign permissions to the organization admin role based on organization's feature packages
      await this.assignPermissionsToAdminRole(savedRole.id, savedOrganization.id, queryRunner);

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
            process.env.FRONTEND_URL || 'http://147.93.179.153:4201'
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

    // Check if currency is being changed and if it's allowed
    if (
      updateOrganizationDto.currency &&
      updateOrganizationDto.currency !== organization.currency
    ) {
      await this.checkCurrencyChangeAllowed(id);
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
    await this.checkOrganizationDependencies(id);

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
      verificationUrl: `${
        process.env.FRONTEND_URL || 'http://147.93.179.153:4201'
      }/verify-otp?token=${adminUser.id}`,
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

      // Check for other dependencies
      await this.checkOrganizationDependencies(id);

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

  /**
   * Check if currency can be changed for this organization
   */
  private async checkCurrencyChangeAllowed(organizationId: string): Promise<void> {
    // Check for events with pricing
    const eventCount = await this.dataSource.getRepository('Event').count({
      where: { organizationId },
    });

    if (eventCount > 0) {
      throw new BadRequestException(
        'Cannot change currency when organization has existing events. Currency changes affect pricing and financial calculations.'
      );
    }

    // Check for bookings with financial data
    const bookingCount = await this.dataSource.getRepository('Booking').count({
      where: { organizationId },
    });

    if (bookingCount > 0) {
      throw new BadRequestException(
        'Cannot change currency when organization has existing bookings. Currency changes affect financial calculations.'
      );
    }

    // Check for inventory items with pricing
    const inventoryCount = await this.dataSource.getRepository('InventoryItem').count({
      where: { organizationId },
    });

    if (inventoryCount > 0) {
      throw new BadRequestException(
        'Cannot change currency when organization has existing inventory items. Currency changes affect pricing calculations.'
      );
    }
  }

  /**
   * Check if organization has dependencies that prevent deletion
   */
  private async checkOrganizationDependencies(organizationId: string): Promise<void> {
    // Check for events
    const eventCount = await this.dataSource.getRepository('Event').count({
      where: { organizationId },
    });

    if (eventCount > 0) {
      throw new BadRequestException(
        `Cannot delete organization with ${eventCount} existing event(s). Please delete all events first.`
      );
    }

    // Check for bookings
    const bookingCount = await this.dataSource.getRepository('Booking').count({
      where: { organizationId },
    });

    if (bookingCount > 0) {
      throw new BadRequestException(
        `Cannot delete organization with ${bookingCount} existing booking(s). Please delete all bookings first.`
      );
    }

    // Check for inventory items
    const inventoryCount = await this.dataSource.getRepository('InventoryItem').count({
      where: { organizationId },
    });

    if (inventoryCount > 0) {
      throw new BadRequestException(
        `Cannot delete organization with ${inventoryCount} existing inventory item(s). Please delete all inventory first.`
      );
    }

    // Check for roles
    const roleCount = await this.dataSource.getRepository('Role').count({
      where: { organizationId },
    });

    if (roleCount > 0) {
      throw new BadRequestException(
        `Cannot delete organization with ${roleCount} existing role(s). Please delete all roles first.`
      );
    }
  }

  /**
   * Assign permissions to organization admin role based on organization's feature packages
   */
  private async assignPermissionsToAdminRole(
    roleId: string,
    organizationId: string,
    queryRunner: any
  ): Promise<void> {
    const rolePermissionRepository = queryRunner.manager.getRepository(RolePermission);
    const organizationPackageRepository = queryRunner.manager.getRepository(OrganizationPackage);
    const masterPermissionRepository = queryRunner.manager.getRepository(MasterPermission);

    // Get organization's feature packages
    const orgPackages = await organizationPackageRepository.find({
      where: { organizationId, isActive: true },
      relations: ['featurePackage'],
    });

    // Collect all permissions from feature packages
    const permissionKeys = new Set<string>();
    for (const pkg of orgPackages) {
      if (pkg.featurePackage?.isActive && !pkg.isExpired()) {
        pkg.featurePackage.features.forEach(feature => permissionKeys.add(feature));
      }
    }

    // Get master permission details
    const masterPermissions = await masterPermissionRepository.find({
      where: { key: In(Array.from(permissionKeys)) },
    });

    // Create role permissions
    const rolePermissions = Array.from(permissionKeys)
      .map(key => {
        const masterPerm = masterPermissions.find(mp => mp.key === key);
        if (!masterPerm) {
          this.logger.warn(`Master permission not found for key: ${key}`);
          return null;
        }

        return rolePermissionRepository.create({
          organizationId,
          roleId,
          permissionKey: key,
          name: masterPerm.name,
          description: masterPerm.description,
          category: masterPerm.category,
          module: masterPerm.module,
          action: masterPerm.action,
          enabled: true,
          grantedBy: null, // System assignment
          grantedAt: new Date(),
        });
      })
      .filter(Boolean);

    if (rolePermissions.length > 0) {
      await rolePermissionRepository.save(rolePermissions);
      this.logger.log(
        `Assigned ${rolePermissions.length} permissions to organization admin role for organization ${organizationId}`
      );
    }
  }

  /**
   * Update organization admin role permissions for existing organizations
   * This method can be called to fix existing organizations that don't have proper permissions
   */
  async updateOrganizationAdminPermissions(organizationId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the organization admin role
      const adminRole = await queryRunner.manager.getRepository(Role).findOne({
        where: {
          name: 'Organization Admin',
          organizationId,
          scope: RoleScope.ORGANIZATION,
        },
      });

      if (!adminRole) {
        throw new NotFoundException('Organization Admin role not found');
      }

      // Clear existing role permissions
      await queryRunner.manager.getRepository(RolePermission).delete({
        roleId: adminRole.id,
      });

      // Assign new permissions based on current feature packages
      await this.assignPermissionsToAdminRole(adminRole.id, organizationId, queryRunner);

      await queryRunner.commitTransaction();
      this.logger.log(
        `Updated permissions for organization admin role in organization ${organizationId}`
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to update organization admin permissions for ${organizationId}:`,
        error
      );
      throw error;
    } finally {
      await queryRunner.release();
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
