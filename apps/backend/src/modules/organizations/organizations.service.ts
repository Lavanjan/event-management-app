import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Organization, User, Role, UserType, RoleScope } from '../../database/entities';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { EmailService } from '../email/email.service';
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
    private emailService: EmailService
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
      const organization = this.organizationRepository.create({
        ...organizationData,
        slug,
      });

      const savedOrganization = await queryRunner.manager.save(organization);

      // Generate password if needed
      const password =
        admin.password || (admin.autoGeneratePassword !== false ? this.generatePassword() : null);

      if (!password) {
        throw new BadRequestException(
          'Password must be provided or auto-generation must be enabled'
        );
      }

      // Create organization admin user
      const adminUser = this.userRepository.create({
        email: createOrganizationDto.admin.email,
        firstName: createOrganizationDto.admin.firstName,
        lastName: createOrganizationDto.admin.lastName,
        password,
        userType: UserType.ORGANIZATION_ADMIN,
        organizationId: savedOrganization.id,
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

      // Send welcome email with credentials
      await this.emailService.sendOrganizationAdminWelcome({
        email: savedAdmin.email,
        firstName: savedAdmin.firstName,
        lastName: savedAdmin.lastName,
        organizationName: savedOrganization.name,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
        temporaryPassword:
          createOrganizationDto.admin.autoGeneratePassword !== false ? password : undefined,
      });

      await queryRunner.commitTransaction();

      return this.findOne(savedOrganization.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<Organization>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = paginationDto;

    const queryBuilder = this.organizationRepository.createQueryBuilder('organization');

    if (search) {
      queryBuilder.where(
        'organization.name ILIKE :search OR organization.slug ILIKE :search OR organization.email ILIKE :search',
        { search: `%${search}%` }
      );
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
      relations: ['users', 'events', 'inventoryItems', 'bookings', 'roles'],
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { slug },
      relations: ['users', 'events', 'inventoryItems', 'bookings', 'roles'],
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
    await this.organizationRepository.remove(organization);
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
}
