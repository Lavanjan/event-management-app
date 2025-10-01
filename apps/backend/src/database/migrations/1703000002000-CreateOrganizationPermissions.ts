import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationPermissions1703000002000 implements MigrationInterface {
  name = 'CreateOrganizationPermissions1703000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name = 'organization_permissions'
    `);

    if (tableExists.length === 0) {
      // Create organization_permissions table
      await queryRunner.query(`
        CREATE TABLE "organization_permissions" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "organization_id" uuid NOT NULL,
          "permission_key" character varying NOT NULL,
          "name" character varying NOT NULL,
          "description" character varying,
          "category" character varying NOT NULL,
          "enabled" boolean NOT NULL DEFAULT false,
          "metadata" character varying,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_organization_permissions" PRIMARY KEY ("id")
        )
      `);
    }

    // Check existing indexes
    const existingIndexes = await queryRunner.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'organization_permissions'
    `);

    const indexNames = existingIndexes.map((idx: any) => idx.indexname);

    // Create indexes only if they don't exist
    if (!indexNames.includes('IDX_organization_permissions_organization_id')) {
      await queryRunner.query(`
        CREATE INDEX "IDX_organization_permissions_organization_id" ON "organization_permissions" ("organization_id")
      `);
    }

    if (!indexNames.includes('IDX_organization_permissions_permission_key')) {
      await queryRunner.query(`
        CREATE INDEX "IDX_organization_permissions_permission_key" ON "organization_permissions" ("permission_key")
      `);
    }

    if (!indexNames.includes('IDX_organization_permissions_unique')) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX "IDX_organization_permissions_unique" ON "organization_permissions" ("organization_id", "permission_key")
      `);
    }

    // Check if foreign key constraint exists
    const constraintExists = await queryRunner.query(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE constraint_name = 'FK_organization_permissions_organization'
      AND table_name = 'organization_permissions'
    `);

    if (constraintExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "organization_permissions"
        ADD CONSTRAINT "FK_organization_permissions_organization"
        FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      `);
    }

    // Migrate existing permissions from organizations.metadata to new table
    await this.migrateExistingPermissions(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint safely
    await queryRunner.query(`
      ALTER TABLE "organization_permissions"
      DROP CONSTRAINT IF EXISTS "FK_organization_permissions_organization"
    `);

    // Drop indexes safely
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_organization_permissions_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_organization_permissions_permission_key"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_organization_permissions_organization_id"`);

    // Drop table safely
    await queryRunner.query(`DROP TABLE IF EXISTS "organization_permissions"`);
  }

  private async migrateExistingPermissions(queryRunner: QueryRunner): Promise<void> {
    // Get all organizations with permissions in metadata
    const organizations = await queryRunner.query(`
      SELECT id, metadata 
      FROM organizations 
      WHERE metadata IS NOT NULL 
      AND metadata::text LIKE '%permissions%'
    `);

    for (const org of organizations) {
      try {
        const metadata = org.metadata;
        if (metadata && metadata.permissions && Array.isArray(metadata.permissions)) {
          // Insert each permission into the new table
          for (const permission of metadata.permissions) {
            await queryRunner.query(
              `
              INSERT INTO organization_permissions (
                organization_id, permission_key, name, description, category, enabled
              ) VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (organization_id, permission_key) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                category = EXCLUDED.category,
                enabled = EXCLUDED.enabled,
                updated_at = now()
            `,
              [
                org.id,
                permission.id || permission.permissionKey,
                permission.name,
                permission.description,
                permission.category,
                permission.enabled || false,
              ]
            );
          }

          // Remove permissions from metadata but keep other metadata
          const newMetadata = { ...metadata };
          delete newMetadata.permissions;

          await queryRunner.query(
            `
            UPDATE organizations 
            SET metadata = $1 
            WHERE id = $2
          `,
            [Object.keys(newMetadata).length > 0 ? newMetadata : null, org.id]
          );
        }
      } catch (error) {
        console.error(`Error migrating permissions for organization ${org.id}:`, error);
        // Continue with other organizations
      }
    }
  }
}
