import React, { useState } from 'react';
import { 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Search,
  Filter,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { documentService } from '../../services/documentService';
import {
  Document,
  DocumentType,
  DocumentCategory,
  DocumentFilters,
  getDocumentTypeLabel,
  getDocumentCategoryLabel,
  formatFileSize,
  getFileIcon,
} from '../../types/document';
import { format } from 'date-fns';

interface DocumentListProps {
  documents: Document[];
  isLoading?: boolean;
  onDocumentUpdate?: (document: Document) => void;
  onDocumentDelete?: (documentId: string) => void;
  onRefresh?: () => void;
  showFilters?: boolean;
  filters?: DocumentFilters;
  onFiltersChange?: (filters: DocumentFilters) => void;
  className?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading = false,
  onDocumentUpdate,
  onDocumentDelete,
  onRefresh,
  showFilters = true,
  filters = {},
  onFiltersChange,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onFiltersChange?.({ ...filters, search: value, page: 1 });
  };

  const handleFilterChange = (key: keyof DocumentFilters, value: any) => {
    onFiltersChange?.({ ...filters, [key]: value, page: 1 });
  };

  const handleDownload = async (document: Document) => {
    try {
      await documentService.downloadDocument(document.id, document.originalFilename);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleView = async (document: Document) => {
    try {
      await documentService.viewDocument(document.id);
    } catch (error) {
      console.error('View failed:', error);
    }
  };

  const handleDelete = async (document: Document) => {
    if (window.confirm(`Are you sure you want to delete "${document.originalFilename}"?`)) {
      try {
        await documentService.deleteDocument(document.id);
        onDocumentDelete?.(document.id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'processing': return 'secondary';
      case 'uploading': return 'secondary';
      case 'archived': return 'outline';
      case 'deleted': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select
                value={filters.type || ''}
                onValueChange={(value) => handleFilterChange('type', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {Object.values(DocumentType).map(type => (
                    <SelectItem key={type} value={type}>
                      {getDocumentTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.category || ''}
                onValueChange={(value) => handleFilterChange('category', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {Object.values(DocumentCategory).map(category => (
                    <SelectItem key={category} value={category}>
                      {getDocumentCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={onRefresh} className="w-full">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-sm text-muted-foreground">
                Upload some documents to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* File Icon */}
                  <div className="text-3xl flex-shrink-0">
                    {document.metadata?.thumbnailPath ? (
                      <img
                        src={documentService.getThumbnailUrl(document.id)}
                        alt={document.originalFilename}
                        className="w-12 h-12 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <div
                      className={`text-3xl ${document.metadata?.thumbnailPath ? 'hidden' : 'block'}`}
                    >
                      {(() => {
                        console.log('Document object:', document);
                        console.log('Document mimeType:', document.mimeType);
                        return getFileIcon(document.mimeType);
                      })()}
                    </div>
                  </div>

                  {/* Document Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium truncate">
                        {document.originalFilename}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(document.status)}>
                          {document.status}
                        </Badge>
                        <Badge variant="outline">
                          {getDocumentTypeLabel(document.type)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span>{getDocumentCategoryLabel(document.category)}</span>
                    </div>

                    {document.description && (
                      <p className="text-xs text-muted-foreground mb-2 truncate">
                        {document.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3" />
                        <span>
                          {document.uploader 
                            ? `${document.uploader.firstName} ${document.uploader.lastName}`
                            : 'Unknown'
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(document.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(document)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(document)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDocumentUpdate?.(document)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(document)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
