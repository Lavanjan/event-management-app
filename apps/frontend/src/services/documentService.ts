import { api } from './api';
import {
  Document,
  DocumentFilters,
  DocumentListResponse,
  UploadDocumentDto,
  UpdateDocumentDto,
} from '../types/document';

export class DocumentService {
  private readonly baseUrl = '/documents';

  async uploadDocument(
    file: File,
    uploadDto: UploadDocumentDto,
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Append other fields
    Object.entries(uploadDto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const response = await api.post(`${this.baseUrl}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  async uploadEntityDocument(
    entityType: string,
    entityId: string,
    file: File,
    uploadDto: Omit<UploadDocumentDto, 'entityType' | 'entityId'>,
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Append other fields
    Object.entries(uploadDto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const response = await api.post(
      `${this.baseUrl}/entity/${entityType}/${entityId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );

    return response.data;
  }

  async getDocuments(filters: DocumentFilters = {}): Promise<DocumentListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  async getEntityDocuments(
    entityType: string,
    entityId: string,
    filters: Omit<DocumentFilters, 'entityType' | 'entityId'> = {}
  ): Promise<DocumentListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(
      `${this.baseUrl}/entity/${entityType}/${entityId}?${params.toString()}`
    );
    return response.data;
  }

  async getDocument(id: string): Promise<Document> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async updateDocument(id: string, updateDto: UpdateDocumentDto): Promise<Document> {
    const response = await api.patch(`${this.baseUrl}/${id}`, updateDto);
    return response.data;
  }

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  getDownloadUrl(id: string): string {
    return `${api.defaults.baseURL}${this.baseUrl}/${id}/download`;
  }

  getViewUrl(id: string): string {
    return `${api.defaults.baseURL}${this.baseUrl}/${id}/view`;
  }

  getThumbnailUrl(id: string): string {
    return `${api.defaults.baseURL}${this.baseUrl}/${id}/thumbnail`;
  }

  async downloadDocument(id: string, filename?: string): Promise<void> {
    const response = await api.get(`${this.baseUrl}/${id}/download`, {
      responseType: 'blob',
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from response headers or use provided filename
    const contentDisposition = response.headers['content-disposition'];
    let downloadFilename = filename;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        downloadFilename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', downloadFilename || 'document');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async viewDocument(id: string): Promise<void> {
    const url = this.getViewUrl(id);
    window.open(url, '_blank');
  }

  // Validation helpers
  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
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

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of 50MB`,
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    return { isValid: true };
  }

  // Bulk operations
  async uploadMultipleDocuments(
    files: File[],
    uploadDto: UploadDocumentDto,
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<Document[]> {
    const results: Document[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const document = await this.uploadDocument(
        file,
        uploadDto,
        (progress) => onProgress?.(i, progress)
      );
      results.push(document);
    }
    
    return results;
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.deleteDocument(id)));
  }
}

export const documentService = new DocumentService();
