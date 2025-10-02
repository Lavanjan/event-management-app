import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../services/documentService';
import {
  Document,
  DocumentFilters,
  DocumentListResponse,
  UploadDocumentDto,
  UpdateDocumentDto,
} from '../types/document';

// Query keys
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: DocumentFilters) => [...documentKeys.lists(), filters] as const,
  entity: (entityType: string, entityId: string) => [...documentKeys.all, 'entity', entityType, entityId] as const,
  entityList: (entityType: string, entityId: string, filters: DocumentFilters) => 
    [...documentKeys.entity(entityType, entityId), 'list', filters] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
};

// Hook for getting documents with filters
export const useDocuments = (filters: DocumentFilters = {}) => {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => documentService.getDocuments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for getting documents for a specific entity
export const useEntityDocuments = (
  entityType: string,
  entityId: string,
  filters: Omit<DocumentFilters, 'entityType' | 'entityId'> = {}
) => {
  return useQuery({
    queryKey: documentKeys.entityList(entityType, entityId, filters),
    queryFn: () => documentService.getEntityDocuments(entityType, entityId, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!entityType && !!entityId,
  });
};

// Hook for getting a single document
export const useDocument = (id: string) => {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentService.getDocument(id),
    enabled: !!id,
  });
};

// Hook for uploading documents
export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      uploadDto,
      onProgress,
    }: {
      file: File;
      uploadDto: UploadDocumentDto;
      onProgress?: (progress: number) => void;
    }) => documentService.uploadDocument(file, uploadDto, onProgress),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: documentKeys.entity(variables.uploadDto.entityType, variables.uploadDto.entityId) 
      });
    },
  });
};

// Hook for uploading entity documents
export const useUploadEntityDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      file,
      uploadDto,
      onProgress,
    }: {
      entityType: string;
      entityId: string;
      file: File;
      uploadDto: Omit<UploadDocumentDto, 'entityType' | 'entityId'>;
      onProgress?: (progress: number) => void;
    }) => documentService.uploadEntityDocument(entityType, entityId, file, uploadDto, onProgress),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: documentKeys.entity(variables.entityType, variables.entityId) 
      });
    },
  });
};

// Hook for updating documents
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updateDto }: { id: string; updateDto: UpdateDocumentDto }) =>
      documentService.updateDocument(id, updateDto),
    onSuccess: (data) => {
      // Update the document in cache
      queryClient.setQueryData(documentKeys.detail(data.id), data);
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: documentKeys.entity(data.entityType, data.entityId) 
      });
    },
  });
};

// Hook for deleting documents
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

// Hook for bulk operations
export const useBulkDeleteDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => documentService.bulkDelete(ids),
    onSuccess: (_, ids) => {
      // Remove from cache
      ids.forEach(id => {
        queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
      });
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

// Custom hook for document management with local state
export const useDocumentManager = (entityType: string, entityId: string) => {
  const [filters, setFilters] = useState<Omit<DocumentFilters, 'entityType' | 'entityId'>>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  const {
    data: documentsResponse,
    isLoading,
    error,
    refetch,
  } = useEntityDocuments(entityType, entityId, filters);

  const uploadMutation = useUploadEntityDocument();
  const updateMutation = useUpdateDocument();
  const deleteMutation = useDeleteDocument();

  const uploadDocument = useCallback(
    (file: File, uploadDto: Omit<UploadDocumentDto, 'entityType' | 'entityId'>, onProgress?: (progress: number) => void) => {
      return uploadMutation.mutateAsync({
        entityType,
        entityId,
        file,
        uploadDto,
        onProgress,
      });
    },
    [entityType, entityId, uploadMutation]
  );

  const updateDocument = useCallback(
    (id: string, updateDto: UpdateDocumentDto) => {
      return updateMutation.mutateAsync({ id, updateDto });
    },
    [updateMutation]
  );

  const deleteDocument = useCallback(
    (id: string) => {
      return deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    documents: documentsResponse?.data || [],
    total: documentsResponse?.total || 0,
    page: documentsResponse?.page || 1,
    limit: documentsResponse?.limit || 20,
    isLoading,
    error,
    filters,
    updateFilters,
    refetch,
    uploadDocument,
    updateDocument,
    deleteDocument,
    isUploading: uploadMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
