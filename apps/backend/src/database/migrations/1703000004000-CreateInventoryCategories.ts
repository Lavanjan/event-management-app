import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class CreateInventoryCategories1703000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'inventory_categories'
    `);

    if (tableExists.length === 0) {
      // Create inventory_categories table
      await queryRunner.createTable(
        new Table({
          name: 'inventory_categories',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'name',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'description',
              type: 'varchar',
              length: '500',
              isNullable: true,
            },
            {
              name: 'color',
              type: 'varchar',
              length: '7',
              isNullable: true,
            },
            {
              name: 'icon',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
            },
            {
              name: 'sort_order',
              type: 'int',
              default: 0,
            },
            {
              name: 'organization_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true
      );

      // Create indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_inventory_categories_organization_id"
        ON "inventory_categories" ("organization_id")
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_inventory_categories_is_active"
        ON "inventory_categories" ("is_active")
      `);

      // Create foreign key to organizations
      await queryRunner.query(`
        ALTER TABLE "inventory_categories"
        ADD CONSTRAINT "FK_inventory_categories_organization_id"
        FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      `);
    }

    // Add categoryId column to inventory_items if it doesn't exist
    const inventoryItemsColumns = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'category_id'
    `);

    if (inventoryItemsColumns.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "inventory_items" 
        ADD COLUMN "category_id" uuid
      `);

      // Create foreign key from inventory_items to inventory_categories
      await queryRunner.query(`
        ALTER TABLE "inventory_items"
        ADD CONSTRAINT "FK_inventory_items_category_id"
        FOREIGN KEY ("category_id") REFERENCES "inventory_categories"("id") ON DELETE SET NULL
      `);
    }

    // Create some default categories
    const organizationsResult = await queryRunner.query(`
      SELECT id FROM organizations WHERE status = 'active'
    `);

    for (const org of organizationsResult) {
      const existingCategories = await queryRunner.query(
        `
        SELECT id FROM inventory_categories WHERE organization_id = $1
      `,
        [org.id]
      );

      if (existingCategories.length === 0) {
        // Insert default categories
        await queryRunner.query(
          `
          INSERT INTO inventory_categories (name, description, color, icon, sort_order, organization_id)
          VALUES 
            ('General', 'General inventory items', '#6B7280', 'Package', 0, $1),
            ('Electronics', 'Electronic devices and components', '#3B82F6', 'Zap', 1, $1),
            ('Furniture', 'Office and event furniture', '#8B5CF6', 'Home', 2, $1),
            ('Catering', 'Food and beverage items', '#10B981', 'Coffee', 3, $1),
            ('Decorations', 'Event decorations and accessories', '#F59E0B', 'Star', 4, $1)
        `,
          [org.id]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key from inventory_items
    const inventoryItemsForeignKeys = await queryRunner.query(`
      SELECT constraint_name FROM information_schema.table_constraints 
      WHERE table_name = 'inventory_items' AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%category_id%'
    `);

    for (const fk of inventoryItemsForeignKeys) {
      await queryRunner.query(`
        ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "${fk.constraint_name}"
      `);
    }

    // Remove categoryId column from inventory_items
    await queryRunner.query(`
      ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "category_id"
    `);

    // Drop inventory_categories table
    await queryRunner.dropTable('inventory_categories', true);
  }
}
