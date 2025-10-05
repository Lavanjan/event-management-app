import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from './user.entity';

export enum DocumentType {
  IMAGE = 'image',
  PDF = 'pdf',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  OTHER = 'other',
}

export enum DocumentCategory {
  BOOKING_DOCUMENT = 'booking_document',
  INVENTORY_DOCUMENT = 'inventory_document',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  CONTRACT = 'contract',
  PHOTO = 'photo',
  OTHER = 'other',
}

export enum DocumentStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

@Entity('documents')
@Index(['organizationId'])
@Index(['entityType', 'entityId'])
@Index(['uploadedBy'])
@Index(['status'])
@Index(['createdAt'])
@Check('"file_size" > 0')
@Check('"file_size" <= 52428800') // 50MB max
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  // Polymorphic relationship - can be attached to any entity
  @Column({ name: 'entity_type' })
  entityType: string; // 'booking', 'inventory_item', etc.

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column()
  filename: string;

  @Column({ name: 'original_filename' })
  originalFilename: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'file_size' })
  fileSize: number; // in bytes

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  type: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentCategory,
    default: DocumentCategory.OTHER,
  })
  category: DocumentCategory;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.UPLOADING,
  })
  status: DocumentStatus;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  // File metadata
  @Column('jsonb', { nullable: true })
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
    compressed?: boolean;
    originalSize?: number;
    checksum?: string;
    [key: string]: any;
  };

  // Security and access control
  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ name: 'access_token', nullable: true })
  accessToken: string; // For secure file access

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  // Audit fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  // Virtual properties
  get fileExtension(): string {
    return this.originalFilename.split('.').pop()?.toLowerCase() || '';
  }

  get fileSizeFormatted(): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (this.fileSize === 0) return '0 Bytes';
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  get isImage(): boolean {
    return this.type === DocumentType.IMAGE;
  }

  get isPdf(): boolean {
    return this.type === DocumentType.PDF;
  }

  get downloadUrl(): string {
    return `/api/documents/${this.id}/download${this.accessToken ? `?token=${this.accessToken}` : ''}`;
  }

  get thumbnailUrl(): string | null {
    if (this.isImage) {
      return `/api/documents/${this.id}/thumbnail${this.accessToken ? `?token=${this.accessToken}` : ''}`;
    }
    return null;
  }
}
