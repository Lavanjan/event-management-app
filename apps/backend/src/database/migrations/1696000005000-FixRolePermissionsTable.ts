import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRolePermissionsTable1696000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if role_permissions table exists and what columns it has
    const tableExists = await queryRunner.hasTable('role_permissions');

    if (tableExists) {
      // Check if the table has the correct structure
      const hasOrganizationId = await queryRunner.hasColumn('role_permissions', 'organization_id');
      const hasPermissionKey = await queryRunner.hasColumn('role_permissions', 'permission_key');

      if (!hasOrganizationId || !hasPermissionKey) {
        // This is the legacy table structure (role_id, permission_id)
        // Drop the existing table and recreate it with the new structure
        console.log('Dropping legacy role_permissions table and recreating with new structure...');
        await queryRunner.dropTable('role_permissions');
      } else {
        // Table already has correct structure, skip
        console.log('role_permissions table already has correct structure, skipping...');
        return;
      }
    }

    // Create the role_permissions table with correct structure
    console.log('Creating new role_permissions table...');
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "permission_key" varchar NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "category" varchar NOT NULL,
        "module" varchar NOT NULL,
        "action" varchar NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "granted_by" uuid,
        "granted_at" TIMESTAMP WITH TIME ZONE,
        "notes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_role_permissions_role_permission" UNIQUE ("role_id", "permission_key")
      )
    `);

    // Create indexes
    console.log('Creating indexes for role_permissions...');
    await queryRunner.query(`CREATE INDEX "IDX_role_permissions_organization_id" ON "role_permissions" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_role_permissions_role_id" ON "role_permissions" ("role_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_role_permissions_permission_key" ON "role_permissions" ("permission_key")`);

    // Create foreign keys
    console.log('Creating foreign keys for role_permissions...');
    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_role_permissions_role_id"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_role_permissions_granted_by"
      FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    console.log('role_permissions table migration completed successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('role_permissions');
  }
}
