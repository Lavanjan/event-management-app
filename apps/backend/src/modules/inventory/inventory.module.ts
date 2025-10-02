import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryItem } from '../../database/entities/inventory-item.entity';
import { InventoryCategory } from '../../database/entities/inventory-category.entity';
import { InventoryCategoryController } from '../../controllers/inventory-category.controller';
import { InventoryCategoryService } from '../../services/inventory-category.service';
import { AuthModule } from '../auth/auth.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryItem, InventoryCategory]),
    AuthModule,
    OrganizationsModule,
  ],
  controllers: [InventoryController, InventoryCategoryController],
  providers: [InventoryService, InventoryCategoryService],
  exports: [InventoryService, InventoryCategoryService],
})
export class InventoryModule {}
