import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMasterPermissions1696000000000 implements MigrationInterface {
  name = 'CreateMasterPermissions1696000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'master_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'key',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'varchar',
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
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'default_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'sort_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'metadata',
            type: 'jsonb',
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

    // Create indexes
    await queryRunner.createIndex(
      'master_permissions',
      new TableIndex({
        name: 'IDX_master_permissions_category',
        columnNames: ['category'],
      })
    );

    await queryRunner.createIndex(
      'master_permissions',
      new TableIndex({
        name: 'IDX_master_permissions_module',
        columnNames: ['module'],
      })
    );

    await queryRunner.createIndex(
      'master_permissions',
      new TableIndex({
        name: 'IDX_master_permissions_key',
        columnNames: ['key'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('master_permissions');
  }
}
