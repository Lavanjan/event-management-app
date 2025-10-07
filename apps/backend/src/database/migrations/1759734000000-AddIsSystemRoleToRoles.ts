import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsSystemRoleToRoles1759734000000 implements MigrationInterface {
    name = 'AddIsSystemRoleToRoles1759734000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add is_system_role column to roles table
        await queryRunner.query(`ALTER TABLE "roles" ADD "is_system_role" boolean NOT NULL DEFAULT false`);
        
        // Update existing Product Admin and Organization Admin roles to be system roles
        await queryRunner.query(`UPDATE "roles" SET "is_system_role" = true WHERE "name" IN ('Product Admin', 'Organization Admin')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove is_system_role column from roles table
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "is_system_role"`);
    }
}
