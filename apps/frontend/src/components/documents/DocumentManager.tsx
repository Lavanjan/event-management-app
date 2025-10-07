import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/loading-spinner';
import { DocumentUpload } from './DocumentUpload';
import { DocumentList } from './DocumentList';
import { documentService } from '../../services/documentService';
import { useToast } from '../../hooks/use-toast';
import {
  Document,
  DocumentFilters,
  DocumentType,
  DocumentCategory,
  DocumentListResponse,
} from '../../types/document';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState<DocumentFilters>({
    entityType,
    entityId,
    search: '',
    type: undefined,
    category: undefined,
    page: 1,
    limit: 20,
  });
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const loadDocuments = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response: DocumentListResponse = await documentService.getEntityDocuments(
        entityType,
        entityId,
        filters
      );

      setDocuments(response.data);
      setTotalCount(response.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [entityType, entityId, filters]);

  const handleUploadComplete = (uploadedDocuments: Document[]) => {
    setDocuments(prev => [...uploadedDocuments, ...prev]);
    setTotalCount(prev => prev + uploadedDocuments.length);
    setActiveTab('list');
    
    toast({
      title: 'Upload Complete',
      description: `${uploadedDocuments.length} document(s) uploaded successfully`,
      variant: 'success',
    });
  };

  const handleUploadError = (error: string) => {
    toast({
      title: 'Upload Error',
      description: error,
      variant: 'destructive',
    });
  };

  const handleDocumentDelete = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    setTotalCount(prev => prev - 1);
    
    toast({
      title: 'Document Deleted',
      description: 'Document has been deleted successfully',
      variant: 'success',
    });
  };

  const handleFilterChange = (key: keyof DocumentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleRefresh = () => {
    loadDocuments(true);
  };

  const clearFilters = () => {
    setFilters({
      entityType,
      entityId,
      search: '',
      type: undefined,
      category: undefined,
      page: 1,
      limit: 20,
    });
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {totalCount} document{totalCount !== 1 ? 's' : ''}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
          <TabsTrigger value="list">
            Documents ({documents.length})
          </TabsTrigger>
          {allowUpload && (
            <TabsTrigger value="upload">
              <Plus className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 space-y-4 pr-2">
            {showFilters && (
              <Card className="flex-shrink-0">
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                  <CardDescription>
                    Filter and search through documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search documents..."
                          value={filters.search || ''}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <Select
                        value={filters.type || 'all'}
                        onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value={DocumentType.IMAGE}>Image</SelectItem>
                          <SelectItem value={DocumentType.PDF}>PDF</SelectItem>
                          <SelectItem value={DocumentType.DOCUMENT}>Document</SelectItem>
                          <SelectItem value={DocumentType.SPREADSHEET}>Spreadsheet</SelectItem>
                          <SelectItem value={DocumentType.OTHER}>Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select
                        value={filters.category || 'all'}
                        onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
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

                  <div className="flex justify-end">
                    <Button variant="outline" onClick={clearFilters}>
                      <Filter className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2">Loading documents...</span>
              </div>
            ) : (
              <DocumentList
                documents={documents}
                onDocumentDelete={handleDocumentDelete}
                showActions={true}
              />
            )}
          </div>
        </TabsContent>

        {allowUpload && (
          <TabsContent value="upload" className="flex-1 overflow-hidden">
            <div className="overflow-y-auto h-full pr-2">
              <DocumentUpload
                entityType={entityType}
                entityId={entityId}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                allowMultiple={true}
                maxFiles={10}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
