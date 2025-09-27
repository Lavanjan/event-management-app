import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InventoryItem } from '../../database/entities/inventory-item.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>
  ) {}

  async create(
    createInventoryItemDto: CreateInventoryItemDto,
    organizationId: string
  ): Promise<InventoryItem> {
    // Check if item with same name already exists within the organization
    const existingItem = await this.inventoryRepository.findOne({
      where: { name: createInventoryItemDto.name, organizationId },
    });

    if (existingItem) {
      throw new ConflictException('Inventory item with this name already exists');
    }

    // Extract the new fields and store them in metadata
    const { sku, category, minimumQuantity, metadata, ...baseFields } = createInventoryItemDto;

    const enhancedMetadata = {
      ...metadata,
      ...(sku && { sku }),
      ...(category && { category }),
      ...(minimumQuantity !== undefined && { minimumQuantity }),
    };

    const inventoryItem = this.inventoryRepository.create({
      ...baseFields,
      organizationId,
      metadata: enhancedMetadata,
      availableQuantity: createInventoryItemDto.quantity, // Initially all quantity is available
    });

    return this.inventoryRepository.save(inventoryItem);
  }

  async findAll(
    paginationDto: PaginationDto,
    organizationId: string
  ): Promise<PaginatedResponseDto<InventoryItem>> {
    const { page, limit, search, sortBy, sortOrder } = paginationDto;

    const queryBuilder = this.inventoryRepository.createQueryBuilder('item');

    // Organization filter (most important - always applied)
    queryBuilder.where('item.organizationId = :organizationId', { organizationId });

    // Search functionality
    if (search) {
      queryBuilder.andWhere('(item.name ILIKE :search OR item.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // Filter active items by default
    queryBuilder.andWhere('item.isActive = :isActive', { isActive: true });

    // Sorting
    if (sortBy) {
      queryBuilder.orderBy(`item.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('item.createdAt', 'DESC');
    }

    // Pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(items, total, page, limit);
  }

  async findAllAvailable(
    paginationDto: PaginationDto,
    organizationId: string
  ): Promise<PaginatedResponseDto<InventoryItem>> {
    const { page, limit, search, sortBy, sortOrder } = paginationDto;

    const queryBuilder = this.inventoryRepository.createQueryBuilder('item');

    // Organization filter (most important - always applied)
    queryBuilder.where('item.organizationId = :organizationId', { organizationId });

    // Search functionality
    if (search) {
      queryBuilder.andWhere('(item.name ILIKE :search OR item.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // Filter active items with available quantity
    queryBuilder.andWhere('item.isActive = :isActive', { isActive: true });
    queryBuilder.andWhere('item.availableQuantity > 0');

    // Sorting
    if (sortBy) {
      queryBuilder.orderBy(`item.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('item.name', 'ASC');
    }

    // Pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(items, total, page, limit);
  }

  async findById(id: string, organizationId: string): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findOne({
      where: { id, organizationId },
      relations: ['bookingAllocations'],
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return item;
  }

  async update(
    id: string,
    updateInventoryItemDto: UpdateInventoryItemDto,
    organizationId: string
  ): Promise<InventoryItem> {
    const item = await this.findById(id, organizationId);

    // Check name uniqueness if name is being updated within the organization
    if (updateInventoryItemDto.name && updateInventoryItemDto.name !== item.name) {
      const existingItem = await this.inventoryRepository.findOne({
        where: { name: updateInventoryItemDto.name, organizationId },
      });
      if (existingItem) {
        throw new ConflictException('Inventory item with this name already exists');
      }
    }

    // Handle quantity updates
    if (updateInventoryItemDto.quantity !== undefined) {
      const allocatedQuantity = item.quantity - item.availableQuantity;

      if (updateInventoryItemDto.quantity < allocatedQuantity) {
        throw new BadRequestException(
          `Cannot reduce quantity below allocated amount (${allocatedQuantity})`
        );
      }

      // Update available quantity proportionally
      const newAvailableQuantity = updateInventoryItemDto.quantity - allocatedQuantity;
      item.availableQuantity = newAvailableQuantity;
    }

    // Update other fields
    Object.assign(item, updateInventoryItemDto);

    return this.inventoryRepository.save(item);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const item = await this.findById(id, organizationId);

    // Check if item has active allocations
    const allocatedQuantity = item.quantity - item.availableQuantity;
    if (allocatedQuantity > 0) {
      throw new BadRequestException('Cannot delete inventory item with active allocations');
    }

    // Soft delete by deactivating
    item.isActive = false;
    await this.inventoryRepository.save(item);
  }

  async checkAvailability(
    id: string,
    requestedQuantity: number,
    organizationId: string
  ): Promise<boolean> {
    const item = await this.findById(id, organizationId);
    return item.canAllocate(requestedQuantity);
  }

  async allocateQuantity(
    id: string,
    quantity: number,
    organizationId: string
  ): Promise<InventoryItem> {
    const item = await this.findById(id, organizationId);

    if (!item.canAllocate(quantity)) {
      throw new BadRequestException(
        `Cannot allocate ${quantity} items. Only ${item.availableQuantity} available.`
      );
    }

    item.allocate(quantity);
    return this.inventoryRepository.save(item);
  }

  async deallocateQuantity(
    id: string,
    quantity: number,
    organizationId: string
  ): Promise<InventoryItem> {
    const item = await this.findById(id, organizationId);

    try {
      item.deallocate(quantity);
      return this.inventoryRepository.save(item);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getLowStockItems(threshold: number = 10): Promise<InventoryItem[]> {
    return this.inventoryRepository
      .find({
        where: {
          isActive: true,
        },
        order: {
          availableQuantity: 'ASC',
        },
      })
      .then(items => items.filter(item => item.availableQuantity <= threshold));
  }

  async getInventoryStats(): Promise<{
    totalItems: number;
    activeItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
  }> {
    const [totalItems, activeItems, allItems] = await Promise.all([
      this.inventoryRepository.count(),
      this.inventoryRepository.count({ where: { isActive: true } }),
      this.inventoryRepository.find({ where: { isActive: true } }),
    ]);

    const totalValue = allItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const lowStockItems = allItems.filter(
      item => item.availableQuantity > 0 && item.availableQuantity <= 10
    ).length;

    const outOfStockItems = allItems.filter(item => item.availableQuantity === 0).length;

    return {
      totalItems,
      activeItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
    };
  }

  async getCategories(): Promise<{ success: boolean; data: string[] }> {
    const items = await this.inventoryRepository.find({
      where: { isActive: true },
      select: ['metadata'],
    });

    const categories = new Set<string>();

    items.forEach(item => {
      if (item.metadata && item.metadata.category && typeof item.metadata.category === 'string') {
        categories.add(item.metadata.category);
      }
    });

    return {
      success: true,
      data: Array.from(categories).sort(),
    };
  }
}
