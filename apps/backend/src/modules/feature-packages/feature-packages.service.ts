import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FeaturePackage,
  OrganizationPackage,
  MasterPermission,
} from '../../database/entities';

export interface CreateFeaturePackageDto {
  name: string;
  description?: string;
  features: string[];
  price: number;
  currency?: string;
  billingCycle?: 'monthly' | 'yearly' | 'one-time';
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateFeaturePackageDto extends Partial<CreateFeaturePackageDto> {
  isActive?: boolean;
}

export interface AssignPackageToOrganizationDto {
  organizationId: string;
  featurePackageId: string;
  assignedBy: string;
  expiresAt?: Date;
  notes?: string;
}

@Injectable()
export class FeaturePackagesService {
  private readonly logger = new Logger(FeaturePackagesService.name);

  constructor(
    @InjectRepository(FeaturePackage)
    private readonly featurePackageRepository: Repository<FeaturePackage>,
    @InjectRepository(OrganizationPackage)
    private readonly organizationPackageRepository: Repository<OrganizationPackage>,
    @InjectRepository(MasterPermission)
    private readonly masterPermissionRepository: Repository<MasterPermission>,
  ) {}

  /**
   * Create a new feature package
   */
  async createFeaturePackage(createDto: CreateFeaturePackageDto): Promise<FeaturePackage> {
    // Validate that all features exist in master permissions
    await this.validateFeatures(createDto.features);

    // Check if package name already exists
    const existingPackage = await this.featurePackageRepository.findOne({
      where: { name: createDto.name }
    });

    if (existingPackage) {
      throw new BadRequestException(`Feature package with name "${createDto.name}" already exists`);
    }

    const featurePackage = this.featurePackageRepository.create({
      ...createDto,
      currency: createDto.currency || 'USD',
      billingCycle: createDto.billingCycle || 'monthly',
      sortOrder: createDto.sortOrder || 0,
    });

    const savedPackage = await this.featurePackageRepository.save(featurePackage);
    this.logger.log(`Created feature package: ${savedPackage.name} (${savedPackage.id})`);

    return savedPackage;
  }

  /**
   * Get all feature packages
   */
  async getAllFeaturePackages(): Promise<FeaturePackage[]> {
    return this.featurePackageRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
  }

  /**
   * Get active feature packages
   */
  async getActiveFeaturePackages(): Promise<FeaturePackage[]> {
    return this.featurePackageRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
  }

  /**
   * Get feature package by ID
   */
  async getFeaturePackageById(id: string): Promise<FeaturePackage> {
    const featurePackage = await this.featurePackageRepository.findOne({
      where: { id },
      relations: ['organizationPackages']
    });

    if (!featurePackage) {
      throw new NotFoundException(`Feature package not found: ${id}`);
    }

    return featurePackage;
  }

  /**
   * Update feature package
   */
  async updateFeaturePackage(id: string, updateDto: UpdateFeaturePackageDto): Promise<FeaturePackage> {
    const featurePackage = await this.getFeaturePackageById(id);

    // Validate features if provided
    if (updateDto.features) {
      await this.validateFeatures(updateDto.features);
    }

    // Check name uniqueness if name is being updated
    if (updateDto.name && updateDto.name !== featurePackage.name) {
      const existingPackage = await this.featurePackageRepository.findOne({
        where: { name: updateDto.name }
      });

      if (existingPackage) {
        throw new BadRequestException(`Feature package with name "${updateDto.name}" already exists`);
      }
    }

    Object.assign(featurePackage, updateDto);
    const updatedPackage = await this.featurePackageRepository.save(featurePackage);

    this.logger.log(`Updated feature package: ${updatedPackage.name} (${updatedPackage.id})`);
    return updatedPackage;
  }

  /**
   * Delete feature package
   */
  async deleteFeaturePackage(id: string): Promise<void> {
    const featurePackage = await this.getFeaturePackageById(id);

    // Check if package is assigned to any organizations
    const assignedCount = await this.organizationPackageRepository.count({
      where: { featurePackageId: id, isActive: true }
    });

    if (assignedCount > 0) {
      throw new BadRequestException(
        `Cannot delete feature package "${featurePackage.name}" as it is assigned to ${assignedCount} organization(s)`
      );
    }

    await this.featurePackageRepository.remove(featurePackage);
    this.logger.log(`Deleted feature package: ${featurePackage.name} (${id})`);
  }

  /**
   * Assign package to organization (License model - only one package per organization)
   */
  async assignPackageToOrganization(assignDto: AssignPackageToOrganizationDto): Promise<OrganizationPackage> {
    // Check if package exists and is active
    const featurePackage = await this.getFeaturePackageById(assignDto.featurePackageId);
    if (!featurePackage.isActive) {
      throw new BadRequestException('Cannot assign inactive feature package');
    }

    // License model: Remove any existing active packages for this organization
    const existingActivePackages = await this.organizationPackageRepository.find({
      where: {
        organizationId: assignDto.organizationId,
        isActive: true
      }
    });

    // Deactivate all existing packages
    if (existingActivePackages.length > 0) {
      await this.organizationPackageRepository.update(
        { organizationId: assignDto.organizationId, isActive: true },
        { isActive: false }
      );
      this.logger.log(`Deactivated ${existingActivePackages.length} existing packages for organization ${assignDto.organizationId}`);
    }

    // Check if this specific package is already assigned and active
    const existingActiveAssignment = await this.organizationPackageRepository.findOne({
      where: {
        organizationId: assignDto.organizationId,
        featurePackageId: assignDto.featurePackageId,
        isActive: true
      }
    });

    if (existingActiveAssignment) {
      throw new BadRequestException('This package is already assigned to this organization');
    }

    // Check if there's an inactive assignment we can reactivate
    const existingInactiveAssignment = await this.organizationPackageRepository.findOne({
      where: {
        organizationId: assignDto.organizationId,
        featurePackageId: assignDto.featurePackageId,
        isActive: false
      }
    });

    let savedAssignment: OrganizationPackage;

    if (existingInactiveAssignment) {
      // Reactivate existing assignment
      existingInactiveAssignment.isActive = true;
      existingInactiveAssignment.assignedBy = assignDto.assignedBy;
      existingInactiveAssignment.assignedAt = new Date();
      existingInactiveAssignment.expiresAt = assignDto.expiresAt || null;
      existingInactiveAssignment.notes = assignDto.notes || null;

      savedAssignment = await this.organizationPackageRepository.save(existingInactiveAssignment);
      this.logger.log(`Reactivated package ${featurePackage.name} for organization ${assignDto.organizationId}`);
    } else {
      // Create new assignment
      const organizationPackage = this.organizationPackageRepository.create({
        ...assignDto,
        assignedAt: new Date(),
      });

      savedAssignment = await this.organizationPackageRepository.save(organizationPackage);
      this.logger.log(`Assigned package ${featurePackage.name} to organization ${assignDto.organizationId}`);
    }

    return savedAssignment;
  }

  /**
   * Remove package from organization
   */
  async removePackageFromOrganization(organizationId: string, featurePackageId: string): Promise<void> {
    const assignment = await this.organizationPackageRepository.findOne({
      where: {
        organizationId,
        featurePackageId,
        isActive: true
      }
    });

    if (!assignment) {
      throw new NotFoundException('Package assignment not found');
    }

    assignment.isActive = false;
    await this.organizationPackageRepository.save(assignment);

    this.logger.log(`Removed package ${featurePackageId} from organization ${organizationId}`);
  }

  /**
   * Get packages assigned to organization
   */
  async getOrganizationPackages(organizationId: string): Promise<OrganizationPackage[]> {
    return this.organizationPackageRepository.find({
      where: { organizationId, isActive: true },
      relations: ['featurePackage'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get available features for organization
   */
  async getOrganizationAvailableFeatures(organizationId: string): Promise<string[]> {
    const packages = await this.getOrganizationPackages(organizationId);
    const allFeatures = new Set<string>();

    for (const pkg of packages) {
      if (pkg.featurePackage && pkg.featurePackage.isActive && !pkg.isExpired()) {
        for (const feature of pkg.featurePackage.features) {
          allFeatures.add(feature);
        }
      }
    }

    return Array.from(allFeatures);
  }

  /**
   * Validate that features exist in master permissions
   */
  private async validateFeatures(features: string[]): Promise<void> {
    const masterPermissions = await this.masterPermissionRepository.find();
    const validFeatures = new Set(masterPermissions.map(mp => mp.key));

    const invalidFeatures = features.filter(feature => !validFeatures.has(feature));

    if (invalidFeatures.length > 0) {
      throw new BadRequestException(
        `Invalid features: ${invalidFeatures.join(', ')}. Features must exist in master permissions.`
      );
    }
  }
}
