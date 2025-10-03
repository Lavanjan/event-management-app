import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InventoryItem } from '../../database/entities/inventory-item.entity';
import { InventoryCategory } from '../../database/entities/inventory-category.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryCategory)
    private categoryRepository: Repository<InventoryCategory>
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

    const inventoryItem = this.inventoryRepository.create({
      ...createInventoryItemDto,
      organizationId,
      availableQuantity: createInventoryItemDto.quantity, // Initially all quantity is available
      lowStockThreshold: createInventoryItemDto.lowStockThreshold || 10,
    });

    return this.inventoryRepository.save(inventoryItem);
  }

  async findAll(
    paginationDto: PaginationDto & {
      category?: string;
      brand?: string;
      quantityUnit?: string;
      stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
    },
    organizationId: string
  ): Promise<PaginatedResponseDto<InventoryItem>> {
    const { page, limit, search, sortBy, sortOrder, category, brand, quantityUnit, stockStatus } =
      paginationDto;

    const queryBuilder = this.inventoryRepository.createQueryBuilder('item');
    // .leftJoinAndSelect('item.category', 'category'); // temporarily disabled

    // Organization filter (most important - always applied)
    queryBuilder.where('item.organizationId = :organizationId', { organizationId });

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(item.name ILIKE :search OR item.description ILIKE :search OR item.sku ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Category filter - temporarily disabled until relationships are fixed
    // if (category) {
    //   queryBuilder.andWhere('category.name = :category', { category });
    // }

    // Brand filter
    if (brand) {
      queryBuilder.andWhere('item.brand = :brand', { brand });
    }

    // Quantity unit filter
    if (quantityUnit) {
      queryBuilder.andWhere('item.quantityUnit = :quantityUnit', { quantityUnit });
    }

    // Stock status filter
    if (stockStatus) {
      switch (stockStatus) {
        case 'out_of_stock':
          queryBuilder.andWhere('item.availableQuantity = 0');
          break;
        case 'low_stock':
          queryBuilder.andWhere(
            'item.availableQuantity > 0 AND item.availableQuantity <= item.lowStockThreshold'
          );
          break;
        case 'in_stock':
          queryBuilder.andWhere('item.availableQuantity > item.lowStockThreshold');
          break;
      }
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
      relations: ['bookingAllocations'], // 'category' temporarily disabled
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

  async getLowStockItems(organizationId: string): Promise<InventoryItem[]> {
    const queryBuilder = this.inventoryRepository.createQueryBuilder('item');
    // .leftJoinAndSelect('item.category', 'category'); // temporarily disabled

    queryBuilder
      .where('item.organizationId = :organizationId', { organizationId })
      .andWhere('item.isActive = :isActive', { isActive: true })
      .andWhere('item.availableQuantity > 0')
      .andWhere('item.availableQuantity <= item.lowStockThreshold')
      .orderBy('item.availableQuantity', 'ASC');

    return queryBuilder.getMany();
  }

  async getOutOfStockItems(organizationId: string): Promise<InventoryItem[]> {
    return this.inventoryRepository.find({
      where: {
        organizationId,
        isActive: true,
        availableQuantity: 0,
      },
      // relations: ['category'], // temporarily disabled
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async getInventoryStats(organizationId: string): Promise<{
    totalItems: number;
    activeItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    categories: string[];
    brands: string[];
    quantityUnits: string[];
  }> {
    const [totalItems, activeItems, allItems] = await Promise.all([
      this.inventoryRepository.count({ where: { organizationId } }),
      this.inventoryRepository.count({ where: { organizationId, isActive: true } }),
      this.inventoryRepository.find({
        where: { organizationId, isActive: true },
        // relations: ['category'], // temporarily disabled
      }),
    ]);

    const totalValue = allItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );

    const lowStockItems = allItems.filter(item => item.isLowStock()).length;
    const outOfStockItems = allItems.filter(item => item.availableQuantity === 0).length;

    // Extract unique values for filters - temporarily disabled until relationships are fixed
    const categories: string[] = [];
    const brands = [...new Set(allItems.map(item => item.brand).filter(Boolean))].sort();
    const quantityUnits = [...new Set(allItems.map(item => item.quantityUnit))].sort();

    return {
      totalItems,
      activeItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      categories,
      brands,
      quantityUnits,
    };
  }
}
