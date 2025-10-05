import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { documentService } from '../../services/documentService';
import {
  DocumentType,
  DocumentCategory,
  UploadDocumentDto,
  DocumentUploadProgress,
  Document,
  getFileIcon,
  formatFileSize,
} from '../../types/document';

interface DocumentUploadProps {
  entityType: string;
  entityId: string;
  onUploadComplete?: (documents: Document[]) => void;
  onUploadError?: (error: string) => void;
  allowMultiple?: boolean;
  maxFiles?: number;
  className?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  entityType,
  entityId,
  onUploadComplete,
  onUploadError,
  allowMultiple = true,
  maxFiles = 10,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<DocumentUploadProgress[]>([]);
  const [uploadSettings, setUploadSettings] = useState<Omit<UploadDocumentDto, 'entityType' | 'entityId'>>({
    type: DocumentType.OTHER,
    category: DocumentCategory.OTHER,
    description: '',
    isPublic: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    if (!allowMultiple && files.length > 1) {
      onUploadError?.('Only one file is allowed');
      return;
    }

    if (files.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = documentService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      onUploadError?.(errors.join(', '));
    }

    if (validFiles.length > 0) {
      startUploads(validFiles);
    }
  }, [allowMultiple, maxFiles, onUploadError]);

  const startUploads = useCallback(async (files: File[]) => {
    const newUploads: DocumentUploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    const uploadedDocuments: Document[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadIndex = uploads.length + i;

      try {
        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { ...upload, status: 'uploading' as const }
            : upload
        ));

        const document = await documentService.uploadEntityDocument(
          entityType,
          entityId,
          file,
          uploadSettings,
          (progress) => {
            setUploads(prev => prev.map((upload, index) => 
              index === uploadIndex 
                ? { ...upload, progress }
                : upload
            ));
          }
        );

        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { ...upload, status: 'success' as const, document, progress: 100 }
            : upload
        ));

        uploadedDocuments.push(document);
      } catch (error: any) {
        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { ...upload, status: 'error' as const, error: error.message }
            : upload
        ));
        onUploadError?.(error.message);
      }
    }

    if (uploadedDocuments.length > 0) {
      onUploadComplete?.(uploadedDocuments);
    }
  }, [uploads.length, entityType, entityId, uploadSettings, onUploadComplete, onUploadError]);

  const removeUpload = useCallback((index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(upload => upload.status === 'uploading' || upload.status === 'pending'));
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);



  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select
                value={uploadSettings.type}
                onValueChange={(value) => setUploadSettings(prev => ({ ...prev, type: value as DocumentType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DocumentType.IMAGE}>Image</SelectItem>
                  <SelectItem value={DocumentType.PDF}>PDF</SelectItem>
                  <SelectItem value={DocumentType.DOCUMENT}>Document</SelectItem>
                  <SelectItem value={DocumentType.SPREADSHEET}>Spreadsheet</SelectItem>
                  <SelectItem value={DocumentType.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-category">Category</Label>
              <Select
                value={uploadSettings.category}
                onValueChange={(value) => setUploadSettings(prev => ({ ...prev, category: value as DocumentCategory }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DocumentCategory.BOOKING_DOCUMENT}>Booking Document</SelectItem>
                  <SelectItem value={DocumentCategory.INVENTORY_DOCUMENT}>Inventory Document</SelectItem>
                  <SelectItem value={DocumentCategory.INVOICE}>Invoice</SelectItem>
                  <SelectItem value={DocumentCategory.RECEIPT}>Receipt</SelectItem>
                  <SelectItem value={DocumentCategory.CONTRACT}>Contract</SelectItem>
                  <SelectItem value={DocumentCategory.PHOTO}>Photo</SelectItem>
                  <SelectItem value={DocumentCategory.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter a description for the documents..."
              value={uploadSettings.description}
              onChange={(e) => setUploadSettings(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">
          Drop files here or click to browse
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Supports images, PDFs, documents, and more. Max 50MB per file.
        </p>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Choose Files
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={allowMultiple}
          onChange={handleFileSelect}
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
        />
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upload Progress</CardTitle>
            <Button variant="outline" size="sm" onClick={clearCompleted}>
              Clear Completed
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploads.map((upload, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="text-2xl">
                  {getFileIcon(upload.file.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {upload.file.name}
                    </p>
                    <Badge variant={
                      upload.status === 'success' ? 'default' :
                      upload.status === 'error' ? 'destructive' :
                      upload.status === 'uploading' ? 'secondary' : 'outline'
                    }>
                      {upload.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {upload.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {upload.status === 'uploading' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      {upload.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{formatFileSize(upload.file.size)}</span>
                    {upload.status === 'uploading' && (
                      <span>{upload.progress}%</span>
                    )}
                  </div>
                  
                  {upload.status === 'uploading' && (
                    <Progress value={upload.progress} className="h-2" />
                  )}
                  
                  {upload.error && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{upload.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUpload(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
