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

export interface Document {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  type: DocumentType;
  category: DocumentCategory;
  status: DocumentStatus;
  description?: string;
  uploadedBy: string;
  uploader?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
    compressed?: boolean;
    originalSize?: number;
    checksum?: string;
    thumbnailPath?: string;
    [key: string]: any;
  };
  isPublic: boolean;
  accessToken?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UploadDocumentDto {
  entityType: string;
  entityId: string;
  type?: DocumentType;
  category?: DocumentCategory;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateDocumentDto {
  type?: DocumentType;
  category?: DocumentCategory;
  description?: string;
  isPublic?: boolean;
}

export interface DocumentFilters {
  entityType?: string;
  entityId?: string;
  type?: DocumentType;
  category?: DocumentCategory;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface DocumentUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  document?: Document;
}

export interface DocumentListResponse {
  data: Document[];
  total: number;
  page: number;
  limit: number;
}

// Helper functions
export const getDocumentTypeLabel = (type: DocumentType): string => {
  const labels: Record<DocumentType, string> = {
    [DocumentType.IMAGE]: 'Image',
    [DocumentType.PDF]: 'PDF',
    [DocumentType.DOCUMENT]: 'Document',
    [DocumentType.SPREADSHEET]: 'Spreadsheet',
    [DocumentType.OTHER]: 'Other',
  };
  return labels[type];
};

export const getDocumentCategoryLabel = (category: DocumentCategory): string => {
  const labels: Record<DocumentCategory, string> = {
    [DocumentCategory.BOOKING_DOCUMENT]: 'Booking Document',
    [DocumentCategory.INVENTORY_DOCUMENT]: 'Inventory Document',
    [DocumentCategory.INVOICE]: 'Invoice',
    [DocumentCategory.RECEIPT]: 'Receipt',
    [DocumentCategory.CONTRACT]: 'Contract',
    [DocumentCategory.PHOTO]: 'Photo',
    [DocumentCategory.OTHER]: 'Other',
  };
  return labels[category];
};

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isImageFile = (mimeType: string | undefined | null): boolean => {
  if (!mimeType) return false;
  return mimeType.startsWith('image/');
};

export const isPdfFile = (mimeType: string | undefined | null): boolean => {
  if (!mimeType) return false;
  return mimeType === 'application/pdf';
};

export const getFileIcon = (mimeType: string | undefined | null): string => {
  if (!mimeType) {
    console.warn('getFileIcon called with undefined/null mimeType');
    return '📎'; // Default file icon for unknown types
  }
  if (isImageFile(mimeType)) return '🖼️';
  if (isPdfFile(mimeType)) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '🗜️';
  return '📎';
};
