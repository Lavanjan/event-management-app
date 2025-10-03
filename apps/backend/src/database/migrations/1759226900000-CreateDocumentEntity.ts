import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateDocumentEntity1759226900000 implements MigrationInterface {
  name = 'CreateDocumentEntity1759226900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create documents table
    await queryRunner.createTable(
      new Table({
        name: 'documents',
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
            name: 'entity_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'entity_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'original_filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['image', 'pdf', 'document', 'spreadsheet', 'other'],
            default: "'other'",
            isNullable: false,
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['booking_document', 'inventory_document', 'invoice', 'receipt', 'contract', 'photo', 'other'],
            default: "'other'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['uploading', 'processing', 'active', 'archived', 'deleted'],
            default: "'uploading'",
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'uploaded_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'access_token',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
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
        checks: [
          {
            name: 'CHK_documents_file_size_positive',
            expression: 'file_size > 0',
          },
          {
            name: 'CHK_documents_file_size_limit',
            expression: 'file_size <= 52428800', // 50MB
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.query(`CREATE INDEX IDX_documents_organization_id ON documents (organization_id)`);
    await queryRunner.query(`CREATE INDEX IDX_documents_entity ON documents (entity_type, entity_id)`);
    await queryRunner.query(`CREATE INDEX IDX_documents_uploaded_by ON documents (uploaded_by)`);
    await queryRunner.query(`CREATE INDEX IDX_documents_status ON documents (status)`);
    await queryRunner.query(`CREATE INDEX IDX_documents_created_at ON documents (created_at)`);
    await queryRunner.query(`CREATE INDEX IDX_documents_type ON documents (type)`);
    await queryRunner.query(`CREATE INDEX IDX_documents_category ON documents (category)`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE documents 
      ADD CONSTRAINT FK_documents_uploaded_by 
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE documents 
      ADD CONSTRAINT FK_documents_organization_id 
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    `);

    // Add trigger for updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_documents_updated_at 
      BEFORE UPDATE ON documents 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger
    await queryRunner.query('DROP TRIGGER IF EXISTS update_documents_updated_at ON documents');
    
    // Drop function
    await queryRunner.query('DROP FUNCTION IF EXISTS update_updated_at_column()');

    // Drop foreign key constraints
    await queryRunner.query('ALTER TABLE documents DROP CONSTRAINT IF EXISTS FK_documents_uploaded_by');
    await queryRunner.query('ALTER TABLE documents DROP CONSTRAINT IF EXISTS FK_documents_organization_id');

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_documents_organization_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_documents_entity`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_documents_uploaded_by`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_documents_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_documents_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_documents_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_documents_category`);

    // Drop table
    await queryRunner.dropTable('documents');
  }
}
