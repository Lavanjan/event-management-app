import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, MaxLength, IsBoolean } from 'class-validator';
import { DocumentType, DocumentCategory } from '../../../database/entities/document.entity';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Type of entity this document belongs to', example: 'booking' })
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'ID of the entity this document belongs to' })
  @IsUUID()
  entityId: string;

  @ApiProperty({ 
    description: 'Document type',
    enum: DocumentType,
    required: false,
    default: DocumentType.OTHER
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiProperty({ 
    description: 'Document category',
    enum: DocumentCategory,
    required: false,
    default: DocumentCategory.OTHER
  })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiProperty({ 
    description: 'Optional description of the document',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ 
    description: 'Whether the document should be publicly accessible',
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateDocumentDto {
  @ApiProperty({ 
    description: 'Document type',
    enum: DocumentType,
    required: false
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiProperty({ 
    description: 'Document category',
    enum: DocumentCategory,
    required: false
  })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiProperty({ 
    description: 'Description of the document',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ 
    description: 'Whether the document should be publicly accessible',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class DocumentFiltersDto {
  @ApiProperty({ description: 'Entity type to filter by', required: false })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ description: 'Entity ID to filter by', required: false })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiProperty({ 
    description: 'Document type to filter by',
    enum: DocumentType,
    required: false
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiProperty({ 
    description: 'Document category to filter by',
    enum: DocumentCategory,
    required: false
  })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiProperty({ description: 'Search term for filename or description', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Page number for pagination', required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: 'Number of items per page', required: false, default: 20 })
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: 'Sort field', required: false, default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ description: 'Sort order', required: false, default: 'DESC' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
