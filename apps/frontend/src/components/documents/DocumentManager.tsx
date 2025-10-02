import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { DocumentUpload } from './DocumentUpload';
import { DocumentList } from './DocumentList';
import { documentService } from '../../services/documentService';
import { Document, DocumentFilters } from '../../types/document';

interface DocumentManagerProps {
  entityType: string;
  entityId: string;
  title?: string;
  description?: string;
  allowUpload?: boolean;
  showFilters?: boolean;
  className?: string;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  entityType,
  entityId,
  title = 'Documents',
  description = 'Manage documents for this item',
  allowUpload = true,
  showFilters = true,
  className = '',
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filters, setFilters] = useState<DocumentFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const { toast } = useToast();

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await documentService.getEntityDocuments(
        entityType,
        entityId,
        filters
      );
      setDocuments(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to load documents: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [entityType, entityId, filters]);

  const handleUploadComplete = (newDocuments: Document[]) => {
    // Refresh the entire list to ensure we have complete data from server
    loadDocuments();
    setIsUploadOpen(false);
    toast({
      title: 'Success',
      description: `${newDocuments.length} document(s) uploaded successfully`,
    });
  };

  const handleUploadError = (error: string) => {
    toast({
      title: 'Upload Error',
      description: error,
      variant: 'destructive',
    });
  };

  const handleDocumentUpdate = (updatedDocument: Document) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === updatedDocument.id ? updatedDocument : doc
      )
    );
  };

  const handleDocumentDelete = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    toast({
      title: 'Success',
      description: 'Document deleted successfully',
    });
  };

  const handleRefresh = () => {
    loadDocuments();
  };

  const handleFiltersChange = (newFilters: DocumentFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {allowUpload && (
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload Documents</DialogTitle>
                </DialogHeader>
                <DocumentUpload
                  entityType={entityType}
                  entityId={entityId}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  allowMultiple={true}
                  maxFiles={10}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Document List */}
      <DocumentList
        documents={documents}
        isLoading={isLoading}
        onDocumentUpdate={handleDocumentUpdate}
        onDocumentDelete={handleDocumentDelete}
        onRefresh={handleRefresh}
        showFilters={showFilters}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
    </div>
  );
};
