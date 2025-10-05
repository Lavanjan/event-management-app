import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as sharp from 'sharp';
import { Document, DocumentType, DocumentStatus } from '../../database/entities/document.entity';
import { UploadDocumentDto, UpdateDocumentDto, DocumentFiltersDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentsService {
  private readonly uploadPath: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly configService: ConfigService,
  ) {
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH', './uploads');
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 52428800); // 50MB
    this.allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    ];

    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }

    // Create subdirectories for organization
    const subdirs = ['documents', 'thumbnails', 'temp'];
    for (const subdir of subdirs) {
      const dirPath = path.join(this.uploadPath, subdir);
      try {
        await fs.access(dirPath);
      } catch {
        await fs.mkdir(dirPath, { recursive: true });
      }
    }
  }

  async uploadDocument(
    file: Express.Multer.File,
    uploadDto: UploadDocumentDto,
    organizationId: string,
    uploadedBy: string,
  ): Promise<Document> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${crypto.randomUUID()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, 'documents', uniqueFilename);

    // Determine document type
    const documentType = this.determineDocumentType(file.mimetype);

    // Create document record
    const document = this.documentRepository.create({
      organizationId,
      entityType: uploadDto.entityType,
      entityId: uploadDto.entityId,
      filename: uniqueFilename,
      originalFilename: file.originalname,
      filePath: filePath,
      fileSize: file.size,
      mimeType: file.mimetype,
      type: uploadDto.type || documentType,
      category: uploadDto.category,
      description: uploadDto.description,
      uploadedBy,
      isPublic: uploadDto.isPublic || false,
      status: DocumentStatus.PROCESSING,
      accessToken: crypto.randomBytes(32).toString('hex'),
    });

    try {
      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      // Process file (compress, generate thumbnails, etc.)
      const metadata = await this.processFile(file, filePath, documentType);
      document.metadata = metadata;

      // Calculate file checksum
      const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
      document.metadata = { ...document.metadata, checksum };

      // Mark as active
      document.status = DocumentStatus.ACTIVE;

      // Save to database
      return await this.documentRepository.save(document);
    } catch (error) {
      // Cleanup on error
      try {
        await fs.unlink(filePath);
      } catch {}
      throw new BadRequestException(`Failed to upload document: ${error.message}`);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }
  }

  private determineDocumentType(mimeType: string): DocumentType {
    if (mimeType.startsWith('image/')) {
      return DocumentType.IMAGE;
    } else if (mimeType === 'application/pdf') {
      return DocumentType.PDF;
    } else if (
      mimeType.includes('word') ||
      mimeType.includes('document') ||
      mimeType === 'text/plain'
    ) {
      return DocumentType.DOCUMENT;
    } else if (
      mimeType.includes('excel') ||
      mimeType.includes('spreadsheet') ||
      mimeType === 'text/csv'
    ) {
      return DocumentType.SPREADSHEET;
    }
    return DocumentType.OTHER;
  }

  private async processFile(
    file: Express.Multer.File,
    filePath: string,
    documentType: DocumentType,
  ): Promise<any> {
    const metadata: any = {
      originalSize: file.size,
      compressed: false,
    };

    try {
      if (documentType === DocumentType.IMAGE) {
        // Process image with Sharp
        const image = sharp(file.buffer);
        const imageMetadata = await image.metadata();
        
        metadata.width = imageMetadata.width;
        metadata.height = imageMetadata.height;

        // Generate thumbnail
        const thumbnailPath = path.join(
          this.uploadPath,
          'thumbnails',
          `thumb_${path.basename(filePath, path.extname(filePath))}.webp`
        );

        await image
          .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(thumbnailPath);

        metadata.thumbnailPath = thumbnailPath;

        // Compress original if it's large
        if (file.size > 1024 * 1024) { // 1MB
          const compressedBuffer = await image
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();

          if (compressedBuffer.length < file.size) {
            await fs.writeFile(filePath, compressedBuffer);
            metadata.compressed = true;
            metadata.compressedSize = compressedBuffer.length;
          }
        }
      }
    } catch (error) {
      console.warn('File processing failed:', error.message);
    }

    return metadata;
  }

  async findAll(
    filters: DocumentFiltersDto,
    organizationId: string,
  ): Promise<{ data: Document[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.createQueryBuilder(filters, organizationId);

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string, organizationId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id, organizationId },
      relations: ['uploader'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async update(
    id: string,
    updateDto: UpdateDocumentDto,
    organizationId: string,
  ): Promise<Document> {
    const document = await this.findOne(id, organizationId);

    Object.assign(document, updateDto);
    return await this.documentRepository.save(document);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const document = await this.findOne(id, organizationId);

    // Soft delete
    document.status = DocumentStatus.DELETED;
    document.deletedAt = new Date();
    await this.documentRepository.save(document);

    // Optionally delete physical file after some time
    // This could be handled by a background job
  }

  private createQueryBuilder(
    filters: DocumentFiltersDto,
    organizationId: string,
  ): SelectQueryBuilder<Document> {
    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.uploader', 'uploader')
      .where('document.organizationId = :organizationId', { organizationId })
      .andWhere('document.status != :deletedStatus', { deletedStatus: DocumentStatus.DELETED });

    if (filters.entityType) {
      queryBuilder.andWhere('document.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.entityId) {
      queryBuilder.andWhere('document.entityId = :entityId', { entityId: filters.entityId });
    }

    if (filters.type) {
      queryBuilder.andWhere('document.type = :type', { type: filters.type });
    }

    if (filters.category) {
      queryBuilder.andWhere('document.category = :category', { category: filters.category });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(document.originalFilename ILIKE :search OR document.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`document.${sortBy}`, sortOrder);

    return queryBuilder;
  }

  async getFileStream(id: string, organizationId: string): Promise<{ stream: any; document: Document }> {
    const document = await this.findOne(id, organizationId);

    try {
      const stream = await fs.readFile(document.filePath);
      return { stream, document };
    } catch (error) {
      throw new NotFoundException('File not found on disk');
    }
  }

  async getThumbnail(id: string, organizationId: string): Promise<{ stream: any; document: Document }> {
    const document = await this.findOne(id, organizationId);

    if (!document.isImage || !document.metadata?.thumbnailPath) {
      throw new BadRequestException('Thumbnail not available for this document');
    }

    try {
      const stream = await fs.readFile(document.metadata.thumbnailPath);
      return { stream, document };
    } catch (error) {
      throw new NotFoundException('Thumbnail not found on disk');
    }
  }
}
