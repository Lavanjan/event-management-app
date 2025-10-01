import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  inventoryCategoryService, 
  InventoryCategory, 
  CreateInventoryCategoryDto, 
  UpdateInventoryCategoryDto 
} from '../services/inventoryCategoryService';
import { useToast } from './use-toast';

export const useInventoryCategories = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: inventoryCategoryService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: inventoryCategoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast({
        title: 'Success',
        description: 'Category created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create category',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryCategoryDto }) =>
      inventoryCategoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update category',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryCategoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete category',
        variant: 'destructive',
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: inventoryCategoryService.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast({
        title: 'Success',
        description: 'Categories reordered successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reorder categories',
        variant: 'destructive',
      });
    },
  });

  return {
    categories,
    isLoading,
    error,
    refetch,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    reorderCategories: reorderMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
};
