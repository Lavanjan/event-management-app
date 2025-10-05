import React, { useState } from 'react';
import { 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Calendar,
  User,
  FileText,
  Image,
  File
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { documentService } from '../../services/documentService';
import {
  Document,
  getDocumentTypeLabel,
  getDocumentCategoryLabel,
  formatFileSize,
  isImageFile,
} from '../../types/document';

interface DocumentListProps {
  documents: Document[];
  onDocumentUpdate?: (document: Document) => void;
  onDocumentDelete?: (documentId: string) => void;
  onDocumentEdit?: (document: Document) => void;
  showActions?: boolean;
  className?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentDelete,
  onDocumentEdit,
  showActions = true,
  className = '',
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      await documentService.deleteDocument(documentToDelete.id);
      onDocumentDelete?.(documentToDelete.id);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDocumentIcon = (document: Document) => {
    if (isImageFile(document.mimeType)) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (document.mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  if (documents.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No documents found</h3>
        <p className="text-sm text-muted-foreground">
          Upload some documents to get started.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {documents.map((document) => (
        <Card key={document.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 mt-1">
                  {getDocumentIcon(document)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium truncate">
                      {document.originalFilename}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {getDocumentTypeLabel(document.type)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {getDocumentCategoryLabel(document.category)}
                    </Badge>
                  </div>
                  
                  {document.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {document.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(document.createdAt)}</span>
                    </div>
                    
                    {document.uploader && (
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{document.uploader.firstName} {document.uploader.lastName}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <span>{formatFileSize(document.fileSize)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {showActions && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(document)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(document)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleView(document)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(document)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      {onDocumentEdit && (
                        <DropdownMenuItem onClick={() => onDocumentEdit(document)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(document)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.originalFilename}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
