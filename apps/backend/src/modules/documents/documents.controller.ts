import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  DocumentFiltersDto,
} from './dto/upload-document.dto';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { OrganizationPermissionGuard, RequireOrganizationPermission } from '../../common/guards/organization-permission.guard';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserType } from '../../database/entities/user.entity';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(SecureAuthGuard, OrganizationPermissionGuard)
@ApiBearerAuth('JWT-auth')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @RequireOrganizationPermission('documents.create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or upload data' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
    @CurrentOrganization() organizationId: string,
    @CurrentUser('id') userId: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.documentsService.uploadDocument(file, uploadDto, organizationId, userId);
  }

  @Get()
  @RequireOrganizationPermission('documents.read')
  @ApiOperation({ summary: 'Get all documents with filtering' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async findAll(
    @Query() filters: DocumentFiltersDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.documentsService.findAll(filters, organizationId);
  }

  @Get(':id')
  @RequireOrganizationPermission('documents.read')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrganization() organizationId: string
  ) {
    return this.documentsService.findOne(id, organizationId);
  }

  @Patch(':id')
  @RequireOrganizationPermission('documents.update')
  @ApiOperation({ summary: 'Update a document' })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDocumentDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.documentsService.update(id, updateDto, organizationId);
  }

  @Delete(':id')
  @RequireOrganizationPermission('documents.delete')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrganization() organizationId: string
  ) {
    await this.documentsService.remove(id, organizationId);
    return { message: 'Document deleted successfully' };
  }

  @Get(':id/download')
  @RequireOrganizationPermission('documents.read')
  @ApiOperation({ summary: 'Download a document' })
  @ApiResponse({ status: 200, description: 'Document downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async downloadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrganization() organizationId: string,
    @Res() res: Response
  ) {
    const { stream, document } = await this.documentsService.getFileStream(id, organizationId);

    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.originalFilename}"`,
      'Content-Length': document.fileSize.toString(),
    });

    res.send(stream);
  }

  @Get(':id/view')
  @RequireOrganizationPermission('documents.read')
  @ApiOperation({ summary: 'View a document inline' })
  @ApiResponse({ status: 200, description: 'Document viewed successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async viewDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrganization() organizationId: string,
    @Res() res: Response
  ) {
    const { stream, document } = await this.documentsService.getFileStream(id, organizationId);

    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `inline; filename="${document.originalFilename}"`,
      'Content-Length': document.fileSize.toString(),
    });

    res.send(stream);
  }

  @Get(':id/thumbnail')
  @RequireOrganizationPermission('documents.read')
  @ApiOperation({ summary: 'Get document thumbnail' })
  @ApiResponse({ status: 200, description: 'Thumbnail retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Thumbnail not found' })
  async getThumbnail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrganization() organizationId: string,
    @Res() res: Response
  ) {
    const { stream, document } = await this.documentsService.getThumbnail(id, organizationId);

    res.set({
      'Content-Type': 'image/webp',
      'Content-Disposition': `inline; filename="thumb_${document.originalFilename}"`,
      'Cache-Control': 'public, max-age=3600',
    });

    res.send(stream);
  }

  @Get('entity/:entityType/:entityId')
  @RequireOrganizationPermission('documents.read')
  @ApiOperation({ summary: 'Get documents for a specific entity' })
  @ApiResponse({ status: 200, description: 'Entity documents retrieved successfully' })
  async getEntityDocuments(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query() filters: Omit<DocumentFiltersDto, 'entityType' | 'entityId'>,
    @CurrentOrganization() organizationId: string
  ) {
    const entityFilters: DocumentFiltersDto = {
      ...filters,
      entityType,
      entityId,
    };

    return this.documentsService.findAll(entityFilters, organizationId);
  }

  @Post('entity/:entityType/:entityId/upload')
  @RequireOrganizationPermission('documents.create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document for a specific entity' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or upload data' })
  async uploadEntityDocument(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: Omit<UploadDocumentDto, 'entityType' | 'entityId'>,
    @CurrentOrganization() organizationId: string,
    @CurrentUser('id') userId: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const entityUploadDto: UploadDocumentDto = {
      ...uploadDto,
      entityType,
      entityId,
    };

    return this.documentsService.uploadDocument(file, entityUploadDto, organizationId, userId);
  }
}
