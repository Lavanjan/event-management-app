import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventTemplateSupport1759382552649 implements MigrationInterface {
    name = 'AddEventTemplateSupport1759382552649'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "fk_documents_organization_id"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "fk_documents_uploaded_by"`);
        await queryRunner.query(`DROP INDEX "public"."idx_documents_organization_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_documents_entity"`);
        await queryRunner.query(`DROP INDEX "public"."idx_documents_uploaded_by"`);
        await queryRunner.query(`DROP INDEX "public"."idx_documents_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_documents_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_documents_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_documents_category"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "CHK_documents_file_size_positive"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "CHK_documents_file_size_limit"`);
        await queryRunner.query(`CREATE TABLE "event_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "category" character varying, "default_duration_hours" integer NOT NULL DEFAULT '4', "default_capacity" integer, "default_location" character varying, "default_hourly_price" numeric(10,2), "default_half_day_price" numeric(10,2), "default_full_day_price" numeric(10,2), "required_advance_percentage" integer NOT NULL DEFAULT '50', "balance_payment_window_days" integer NOT NULL DEFAULT '7', "allow_inventory_allocation" boolean NOT NULL DEFAULT true, "require_approval" boolean NOT NULL DEFAULT false, "auto_confirm" boolean NOT NULL DEFAULT true, "required_inventory" jsonb DEFAULT '[]', "default_inventory_allocations" jsonb DEFAULT '[]', "template_settings" jsonb DEFAULT '{}', "usage_count" integer NOT NULL DEFAULT '0', "last_used_at" TIMESTAMP, "organization_id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "is_public" boolean NOT NULL DEFAULT false, "created_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_b486a56ef21c4f8c152dabdac7" CHECK ("balance_payment_window_days" >= 0), CONSTRAINT "CHK_cb7324e38ad7ea795e838b8d64" CHECK ("required_advance_percentage" >= 0 AND "required_advance_percentage" <= 100), CONSTRAINT "CHK_1701b01be996b02aa6a5aacc19" CHECK ("default_full_day_price" IS NULL OR "default_full_day_price" >= 0), CONSTRAINT "CHK_5670e7fac285fdc0155021b498" CHECK ("default_half_day_price" IS NULL OR "default_half_day_price" >= 0), CONSTRAINT "CHK_a42719092d76314c78a51fcc5c" CHECK ("default_hourly_price" IS NULL OR "default_hourly_price" >= 0), CONSTRAINT "CHK_724876bc90591db8d9f90ce83f" CHECK ("default_capacity" IS NULL OR "default_capacity" > 0), CONSTRAINT "CHK_0622e1a7caa8483feb001a31cd" CHECK ("default_duration_hours" > 0), CONSTRAINT "PK_b79b161f3efa82671d8cc2250fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_27a5e6f1893f788c8a2861068b" ON "event_templates" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_91d72610f2d002935acbb01b64" ON "event_templates" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9e69f08cc2a4186f95aaf5ab6" ON "event_templates" ("organization_id") `);
        await queryRunner.query(`ALTER TABLE "events" ADD "template_id" uuid`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "organization_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "entity_type"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "entity_type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "entity_id"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "entity_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "filename"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "filename" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "original_filename"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "original_filename" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "file_path"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "file_path" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "file_size"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "file_size" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "mime_type"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "mime_type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "access_token"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "access_token" character varying`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "expires_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`CREATE INDEX "IDX_0ac6db0be1ba323e80e653b0e6" ON "documents" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_709389d904fa03bdf5ec84998d" ON "documents" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9e28779ec77ff2223e2da41f6" ON "documents" ("uploaded_by") `);
        await queryRunner.query(`CREATE INDEX "IDX_5bbdbd9b881aa4a7b85e3b574d" ON "documents" ("entity_type", "entity_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_69427761f37533ae7767601a64" ON "documents" ("organization_id") `);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "CHK_6368c91e076f62117bdab35700" CHECK ("file_size" <= 52428800)`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "CHK_f66042c0c2d931d043df6e2204" CHECK ("file_size" > 0)`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_9b84a662c6de080a196443c50c0" FOREIGN KEY ("template_id") REFERENCES "event_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_b9e28779ec77ff2223e2da41f6d" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_b9e28779ec77ff2223e2da41f6d"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_9b84a662c6de080a196443c50c0"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "CHK_f66042c0c2d931d043df6e2204"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "CHK_6368c91e076f62117bdab35700"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_69427761f37533ae7767601a64"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5bbdbd9b881aa4a7b85e3b574d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9e28779ec77ff2223e2da41f6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_709389d904fa03bdf5ec84998d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ac6db0be1ba323e80e653b0e6"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "expires_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "access_token"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "access_token" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "mime_type"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "mime_type" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "file_size"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "file_size" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "file_path"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "file_path" character varying(500) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "original_filename"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "original_filename" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "filename"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "filename" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "entity_id"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "entity_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "entity_type"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "entity_type" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "organization_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "template_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9e69f08cc2a4186f95aaf5ab6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_91d72610f2d002935acbb01b64"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_27a5e6f1893f788c8a2861068b"`);
        await queryRunner.query(`DROP TABLE "event_templates"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "CHK_documents_file_size_limit" CHECK ((file_size <= 52428800))`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "CHK_documents_file_size_positive" CHECK ((file_size > 0))`);
        await queryRunner.query(`CREATE INDEX "idx_documents_category" ON "documents" ("category") `);
        await queryRunner.query(`CREATE INDEX "idx_documents_type" ON "documents" ("type") `);
        await queryRunner.query(`CREATE INDEX "idx_documents_created_at" ON "documents" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_documents_status" ON "documents" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_documents_uploaded_by" ON "documents" ("uploaded_by") `);
        await queryRunner.query(`CREATE INDEX "idx_documents_entity" ON "documents" ("entity_type", "entity_id") `);
        await queryRunner.query(`CREATE INDEX "idx_documents_organization_id" ON "documents" ("organization_id") `);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "fk_documents_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "fk_documents_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
