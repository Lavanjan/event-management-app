import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateFeaturePackageSystem1696000007000 implements MigrationInterface {
  name = 'CreateFeaturePackageSystem1696000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create feature_packages table
    await queryRunner.createTable(
      new Table({
        name: 'feature_packages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'features',
            type: 'text[]',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            default: "'USD'",
          },
          {
            name: 'billing_cycle',
            type: 'varchar',
            default: "'monthly'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'sort_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'color',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'text',
            isNullable: true,
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

    // Create organization_packages table
    await queryRunner.createTable(
      new Table({
        name: 'organization_packages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'feature_package_id',
            type: 'uuid',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'assigned_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'assigned_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'text',
            isNullable: true,
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

    // Create user_permissions table
    await queryRunner.createTable(
      new Table({
        name: 'user_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'permission_key',
            type: 'varchar',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
          },
          {
            name: 'module',
            type: 'varchar',
          },
          {
            name: 'action',
            type: 'varchar',
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'type',
            type: 'varchar',
            default: "'grant'",
          },
          {
            name: 'granted_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'granted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
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
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create indexes for feature_packages
    await queryRunner.createIndex('feature_packages', new TableIndex({
      name: 'IDX_feature_packages_name',
      columnNames: ['name']
    }));
    await queryRunner.createIndex('feature_packages', new TableIndex({
      name: 'IDX_feature_packages_is_active',
      columnNames: ['is_active']
    }));

    // Create indexes for organization_packages
    await queryRunner.createIndex('organization_packages', new TableIndex({
      name: 'IDX_organization_packages_organization_id',
      columnNames: ['organization_id']
    }));
    await queryRunner.createIndex('organization_packages', new TableIndex({
      name: 'IDX_organization_packages_feature_package_id',
      columnNames: ['feature_package_id']
    }));
    await queryRunner.createIndex('organization_packages', new TableIndex({
      name: 'IDX_organization_packages_is_active',
      columnNames: ['is_active']
    }));

    // Create indexes for user_permissions
    await queryRunner.createIndex('user_permissions', new TableIndex({
      name: 'IDX_user_permissions_user_id',
      columnNames: ['user_id']
    }));
    await queryRunner.createIndex('user_permissions', new TableIndex({
      name: 'IDX_user_permissions_organization_id',
      columnNames: ['organization_id']
    }));
    await queryRunner.createIndex('user_permissions', new TableIndex({
      name: 'IDX_user_permissions_permission_key',
      columnNames: ['permission_key']
    }));
    await queryRunner.createIndex('user_permissions', new TableIndex({
      name: 'IDX_user_permissions_enabled',
      columnNames: ['enabled']
    }));

    // Create unique constraints
    await queryRunner.createIndex('organization_packages', new TableIndex({
      name: 'UQ_organization_packages_org_package',
      columnNames: ['organization_id', 'feature_package_id'],
      isUnique: true
    }));
    await queryRunner.createIndex('user_permissions', new TableIndex({
      name: 'UQ_user_permissions_user_permission',
      columnNames: ['user_id', 'permission_key'],
      isUnique: true
    }));

    // Create foreign keys for organization_packages
    await queryRunner.createForeignKey('organization_packages', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedTableName: 'organizations',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('organization_packages', new TableForeignKey({
      columnNames: ['feature_package_id'],
      referencedTableName: 'feature_packages',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // Create foreign keys for user_permissions
    await queryRunner.createForeignKey('user_permissions', new TableForeignKey({
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('user_permissions', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedTableName: 'organizations',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('user_permissions');
    await queryRunner.dropTable('organization_packages');
    await queryRunner.dropTable('feature_packages');
  }
}
