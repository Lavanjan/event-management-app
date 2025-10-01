import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryCategory } from '../database/entities/inventory-category.entity';

export interface CreateInventoryCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateInventoryCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class InventoryCategoryService {
  private readonly logger = new Logger(InventoryCategoryService.name);

  constructor(
    @InjectRepository(InventoryCategory)
    private readonly categoryRepository: Repository<InventoryCategory>
  ) {}

  async findAll(organizationId: string): Promise<InventoryCategory[]> {
    if (!organizationId) {
      this.logger.error('findAll called with undefined organizationId');
      throw new BadRequestException('Organization ID is required');
    }

    this.logger.debug(`Finding all categories for organization: ${organizationId}`);

    try {
      const categories = await this.categoryRepository.find({
        where: { organizationId, isActive: true },
        order: { sortOrder: 'ASC', name: 'ASC' },
      });

      this.logger.debug(
        `Found ${categories.length} categories for organization: ${organizationId}`
      );
      return categories;
    } catch (error) {
      this.logger.error(`Error finding categories for organization ${organizationId}:`, error);
      throw error;
    }
  }

  async findById(id: string, organizationId: string): Promise<InventoryCategory> {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    const category = await this.categoryRepository.findOne({
      where: { id, organizationId },
      relations: ['items'],
    });

    if (!category) {
      throw new NotFoundException('Inventory category not found');
    }

    return category;
  }

  async create(
    createDto: CreateInventoryCategoryDto,
    organizationId: string
  ): Promise<InventoryCategory> {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    this.logger.debug(`Creating category for organization: ${organizationId}`, createDto);

    // Check if category name already exists for this organization
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createDto.name, organizationId },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = this.categoryRepository.create({
      ...createDto,
      organizationId,
    });

    return this.categoryRepository.save(category);
  }

  async update(
    id: string,
    updateDto: UpdateInventoryCategoryDto,
    organizationId: string
  ): Promise<InventoryCategory> {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    const category = await this.findById(id, organizationId);

    // Check if name is being updated and doesn't conflict
    if (updateDto.name && updateDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateDto.name, organizationId },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    Object.assign(category, updateDto);
    return this.categoryRepository.save(category);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    const category = await this.categoryRepository.findOne({
      where: { id, organizationId },
      relations: ['items'],
    });

    if (!category) {
      throw new NotFoundException('Inventory category not found');
    }

    // Check if category has items - temporarily disabled until relationships are fixed
    // if (category.items && category.items.length > 0) {
    //   throw new ConflictException(
    //     'Cannot delete category that has inventory items. Please reassign or delete the items first.',
    //   );
    // }

    await this.categoryRepository.remove(category);
  }

  async reorder(categoryIds: string[], organizationId: string): Promise<InventoryCategory[]> {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    const categories = await this.categoryRepository.find({
      where: { organizationId },
    });

    // Update sort order based on the provided array
    for (let i = 0; i < categoryIds.length; i++) {
      const category = categories.find(c => c.id === categoryIds[i]);
      if (category) {
        category.sortOrder = i;
        await this.categoryRepository.save(category);
      }
    }

    return this.findAll(organizationId);
  }
}
