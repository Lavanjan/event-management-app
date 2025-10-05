import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateRolePermissions1696000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create role_permissions table
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
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
            isNullable: false,
          },
          {
            name: 'role_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'permission_key',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'module',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'action',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'granted_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'granted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
        uniques: [
          {
            name: 'UQ_role_permissions_role_permission',
            columnNames: ['role_id', 'permission_key'],
          },
        ],
      }),
      true,
    );

    // Create indexes for role_permissions
    await queryRunner.createIndex('role_permissions', new TableIndex({
      name: 'IDX_role_permissions_organization_id',
      columnNames: ['organization_id'],
    }));
    await queryRunner.createIndex('role_permissions', new TableIndex({
      name: 'IDX_role_permissions_role_id',
      columnNames: ['role_id'],
    }));
    await queryRunner.createIndex('role_permissions', new TableIndex({
      name: 'IDX_role_permissions_permission_key',
      columnNames: ['permission_key'],
    }));

    // Create foreign keys for role_permissions
    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        columnNames: ['granted_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('role_permissions');
  }
}
