import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { inventoryService, InventoryFilters } from '../services/inventoryService';
import { addNotification } from '../store/slices/uiSlice';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from '../types';

export const INVENTORY_QUERY_KEYS = {
  all: ['inventory'] as const,
  lists: () => [...INVENTORY_QUERY_KEYS.all, 'list'] as const,
  list: (filters: InventoryFilters) => [...INVENTORY_QUERY_KEYS.lists(), filters] as const,
  details: () => [...INVENTORY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INVENTORY_QUERY_KEYS.details(), id] as const,
  stats: () => [...INVENTORY_QUERY_KEYS.all, 'stats'] as const,
  lowStock: () => [...INVENTORY_QUERY_KEYS.all, 'low-stock'] as const,
  outOfStock: () => [...INVENTORY_QUERY_KEYS.all, 'out-of-stock'] as const,
  categories: () => [...INVENTORY_QUERY_KEYS.all, 'categories'] as const,
};

export function useInventoryList(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.list(filters),
    queryFn: () => inventoryService.getAll(filters),
    keepPreviousData: true,
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.detail(id),
    queryFn: () => inventoryService.getById(id),
    enabled: !!id,
  });
}

export function useInventoryStats() {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.stats(),
    queryFn: () => inventoryService.getStats(),
  });
}

export function useLowStockItems() {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.lowStock(),
    queryFn: () => inventoryService.getLowStock(),
  });
}

export function useOutOfStockItems() {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.outOfStock(),
    queryFn: () => inventoryService.getOutOfStock(),
  });
}

export function useInventoryCategories() {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.categories(),
    queryFn: () => inventoryService.getCategories(),
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (data: CreateInventoryItemDto) => inventoryService.create(data),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.categories() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Item Created',
        message: `${newItem.name} has been added to inventory`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error.response?.data?.message || 'Failed to create inventory item',
      }));
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryItemDto }) =>
      inventoryService.update(id, data),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.detail(updatedItem.id) });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.stats() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Item Updated',
        message: `${updatedItem.name} has been updated`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.response?.data?.message || 'Failed to update inventory item',
      }));
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (id: string) => inventoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.stats() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Item Deleted',
        message: 'Inventory item has been deleted',
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.response?.data?.message || 'Failed to delete inventory item',
      }));
    },
  });
}

export function useAllocateInventory() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      inventoryService.allocate(id, quantity),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.detail(updatedItem.id) });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.stats() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Inventory Allocated',
        message: `${updatedItem.name} quantity allocated successfully`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Allocation Failed',
        message: error.response?.data?.message || 'Failed to allocate inventory',
      }));
    },
  });
}

export function useDeallocateInventory() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      inventoryService.deallocate(id, quantity),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.detail(updatedItem.id) });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.stats() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Inventory Deallocated',
        message: `${updatedItem.name} quantity deallocated successfully`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Deallocation Failed',
        message: error.response?.data?.message || 'Failed to deallocate inventory',
      }));
    },
  });
}

export function useAdjustInventoryQuantity() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ id, quantity, reason }: { id: string; quantity: number; reason?: string }) =>
      inventoryService.adjustQuantity(id, quantity, reason),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.detail(updatedItem.id) });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.stats() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Quantity Adjusted',
        message: `${updatedItem.name} quantity adjusted successfully`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Adjustment Failed',
        message: error.response?.data?.message || 'Failed to adjust inventory quantity',
      }));
    },
  });
}
