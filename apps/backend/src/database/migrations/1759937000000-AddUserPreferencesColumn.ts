import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPreferencesColumn1759937000000 implements MigrationInterface {
    name = 'AddUserPreferencesColumn1759937000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add preferences column to users table
        await queryRunner.query(`ALTER TABLE "users" ADD "preferences" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove preferences column from users table
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "preferences"`);
    }
}
