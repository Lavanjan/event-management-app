import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateInventoryItemsWithQuantityTypes1703000003000 implements MigrationInterface {
  name = 'UpdateInventoryItemsWithQuantityTypes1703000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist before adding them
    const existingColumns = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'inventory_items'
    `);

    const columnNames = existingColumns.map((col: any) => col.column_name);

    // Change quantity columns from int to decimal (only if they're currently integers)
    const quantityType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'inventory_items' AND column_name = 'quantity'
    `);

    if (quantityType.length > 0 && quantityType[0].data_type === 'integer') {
      await queryRunner.query(`
        ALTER TABLE "inventory_items"
        ALTER COLUMN "quantity" TYPE DECIMAL(10,3) USING "quantity"::DECIMAL(10,3)
      `);
    }

    const availableQuantityType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'inventory_items' AND column_name = 'available_quantity'
    `);

    if (availableQuantityType.length > 0 && availableQuantityType[0].data_type === 'integer') {
      await queryRunner.query(`
        ALTER TABLE "inventory_items"
        ALTER COLUMN "available_quantity" TYPE DECIMAL(10,3) USING "available_quantity"::DECIMAL(10,3)
      `);
    }

    // Add new columns only if they don't exist
    if (!columnNames.includes('quantity_unit')) {
      await queryRunner.query(`
        ALTER TABLE "inventory_items"
        ADD COLUMN "quantity_unit" VARCHAR NOT NULL DEFAULT 'pieces'
      `);
    }

    if (!columnNames.includes('category')) {
      await queryRunner.query(`
        ALTER TABLE "inventory_items"
        ADD COLUMN "category" VARCHAR
      `);
    }

    if (!columnNames.includes('brand')) {
      await queryRunner.query(`
        ALTER TABLE "inventory_items"
        ADD COLUMN "brand" VARCHAR
      `);
    }

    if (!columnNames.includes('sku')) {
      await queryRunner.query(`
        ALTER TABLE "inventory_items"
        ADD COLUMN "sku" VARCHAR
      `);
    }

    if (!columnNames.includes('low_stock_threshold')) {
      await queryRunner.query(`
        ALTER TABLE "inventory_items"
        ADD COLUMN "low_stock_threshold" DECIMAL(10,3) NOT NULL DEFAULT 10
      `);
    }

    // Add indexes for better performance (check if they exist first)
    const existingIndexes = await queryRunner.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'inventory_items'
    `);

    const indexNames = existingIndexes.map((idx: any) => idx.indexname);

    if (!indexNames.includes('IDX_inventory_items_category')) {
      await queryRunner.query(`
        CREATE INDEX "IDX_inventory_items_category" ON "inventory_items" ("category")
      `);
    }

    if (!indexNames.includes('IDX_inventory_items_brand')) {
      await queryRunner.query(`
        CREATE INDEX "IDX_inventory_items_brand" ON "inventory_items" ("brand")
      `);
    }

    if (!indexNames.includes('IDX_inventory_items_sku')) {
      await queryRunner.query(`
        CREATE INDEX "IDX_inventory_items_sku" ON "inventory_items" ("sku")
      `);
    }

    if (!indexNames.includes('IDX_inventory_items_quantity_unit')) {
      await queryRunner.query(`
        CREATE INDEX "IDX_inventory_items_quantity_unit" ON "inventory_items" ("quantity_unit")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes safely
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_items_quantity_unit"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_items_sku"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_items_brand"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_items_category"`);

    // Drop new columns safely
    await queryRunner.query(
      `ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "low_stock_threshold"`
    );
    await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "sku"`);
    await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "brand"`);
    await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "category"`);
    await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "quantity_unit"`);

    // Revert quantity columns to int (only if they're currently decimal)
    const quantityType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'inventory_items' AND column_name = 'quantity'
    `);

    if (quantityType.length > 0 && quantityType[0].data_type === 'numeric') {
      await queryRunner.query(`
        ALTER TABLE "inventory_items"
        ALTER COLUMN "quantity" TYPE INTEGER USING "quantity"::INTEGER
      `);
    }

    const availableQuantityType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'inventory_items' AND column_name = 'available_quantity'
    `);

    if (availableQuantityType.length > 0 && availableQuantityType[0].data_type === 'numeric') {
      await queryRunner.query(`
        ALTER TABLE "inventory_items"
        ALTER COLUMN "available_quantity" TYPE INTEGER USING "available_quantity"::INTEGER
      `);
    }
  }
}
