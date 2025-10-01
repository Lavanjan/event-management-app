import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService, OrganizationFilters, CreateOrganizationRequest, UpdateOrganizationRequest } from '../services/organizationService';

export const ORGANIZATION_QUERY_KEYS = {
  all: ['organizations'] as const,
  lists: () => [...ORGANIZATION_QUERY_KEYS.all, 'list'] as const,
  list: (filters: OrganizationFilters) => [...ORGANIZATION_QUERY_KEYS.lists(), filters] as const,
  details: () => [...ORGANIZATION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ORGANIZATION_QUERY_KEYS.details(), id] as const,
  stats: () => [...ORGANIZATION_QUERY_KEYS.all, 'stats'] as const,
};

export function useOrganizations(filters: OrganizationFilters = {}) {
  return useQuery({
    queryKey: ORGANIZATION_QUERY_KEYS.list(filters),
    queryFn: () => organizationService.getAll(filters),
    keepPreviousData: true,
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ORGANIZATION_QUERY_KEYS.detail(id),
    queryFn: () => organizationService.getById(id),
    enabled: !!id,
  });
}

export function useOrganizationStats() {
  return useQuery({
    queryKey: ORGANIZATION_QUERY_KEYS.stats(),
    queryFn: () => organizationService.getStats(),
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationRequest) => organizationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEYS.all });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationRequest }) =>
      organizationService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEYS.lists() });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEYS.all });
    },
  });
}
