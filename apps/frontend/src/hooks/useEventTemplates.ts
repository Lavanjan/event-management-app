import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventTemplateService } from '../services/eventTemplateService';
import {
  EventTemplate,
  CreateEventTemplateDto,
  UpdateEventTemplateDto,
  CreateEventFromTemplateDto,
  EventTemplateFilters,
  EventTemplateStats,
  PaginatedEventTemplates,
} from '../types/eventTemplate';
import { Event } from '../types';
import { useToast } from './use-toast';

// Query Keys
export const EVENT_TEMPLATE_QUERY_KEYS = {
  all: ['eventTemplates'] as const,
  lists: () => [...EVENT_TEMPLATE_QUERY_KEYS.all, 'list'] as const,
  list: (filters: EventTemplateFilters) => [...EVENT_TEMPLATE_QUERY_KEYS.lists(), filters] as const,
  details: () => [...EVENT_TEMPLATE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EVENT_TEMPLATE_QUERY_KEYS.details(), id] as const,
  stats: () => [...EVENT_TEMPLATE_QUERY_KEYS.all, 'stats'] as const,
  categories: () => [...EVENT_TEMPLATE_QUERY_KEYS.all, 'categories'] as const,
  mostUsed: () => [...EVENT_TEMPLATE_QUERY_KEYS.all, 'mostUsed'] as const,
  recent: () => [...EVENT_TEMPLATE_QUERY_KEYS.all, 'recent'] as const,
};

// Queries
export function useEventTemplates(filters: EventTemplateFilters = {}) {
  return useQuery({
    queryKey: EVENT_TEMPLATE_QUERY_KEYS.list(filters),
    queryFn: () => eventTemplateService.getAll(filters),
    keepPreviousData: true,
  });
}

export function useEventTemplate(id: string) {
  return useQuery({
    queryKey: EVENT_TEMPLATE_QUERY_KEYS.detail(id),
    queryFn: () => eventTemplateService.getById(id),
    enabled: !!id,
  });
}

export function useEventTemplateStats() {
  return useQuery({
    queryKey: EVENT_TEMPLATE_QUERY_KEYS.stats(),
    queryFn: () => eventTemplateService.getStats(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useEventTemplateCategories() {
  return useQuery({
    queryKey: EVENT_TEMPLATE_QUERY_KEYS.categories(),
    queryFn: () => eventTemplateService.getCategories(),
    staleTime: 10 * 60 * 1000, // Consider fresh for 10 minutes
  });
}

export function useMostUsedTemplates(limit = 10) {
  return useQuery({
    queryKey: EVENT_TEMPLATE_QUERY_KEYS.mostUsed(),
    queryFn: () => eventTemplateService.getMostUsedTemplates(limit),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });
}

export function useRecentTemplates(limit = 10) {
  return useQuery({
    queryKey: EVENT_TEMPLATE_QUERY_KEYS.recent(),
    queryFn: () => eventTemplateService.getRecentTemplates(limit),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
  });
}

// Mutations
export function useCreateEventTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateEventTemplateDto) => eventTemplateService.create(data),
    onSuccess: (newTemplate) => {
      // Invalidate and refetch template lists
      queryClient.invalidateQueries({ queryKey: EVENT_TEMPLATE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EVENT_TEMPLATE_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: EVENT_TEMPLATE_QUERY_KEYS.categories() });

      toast({
        title: 'Template Created',
        description: `Template "${newTemplate.name}" has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Create Template',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateEventTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventTemplateDto }) =>
      eventTemplateService.update(id, data),
    onSuccess: (updatedTemplate) => {
      // Update the specific template in cache
      queryClient.setQueryData(
        EVENT_TEMPLATE_QUERY_KEYS.detail(updatedTemplate.id),
        updatedTemplate
      );

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: EVENT_TEMPLATE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EVENT_TEMPLATE_QUERY_KEYS.stats() });

      toast({
        title: 'Template Updated',
        description: `Template "${updatedTemplate.name}" has been updated successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Update Template',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteEventTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => eventTemplateService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: EVENT_TEMPLATE_QUERY_KEYS.detail(deletedId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: EVENT_TEMPLATE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EVENT_TEMPLATE_QUERY_KEYS.stats() });

      toast({
        title: 'Template Deleted',
        description: 'Template has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Delete Template',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}

export function useCreateEventFromTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: CreateEventFromTemplateDto }) =>
      eventTemplateService.createEventFromTemplate(templateId, data),
    onSuccess: (newEvent, { templateId }) => {
      // Invalidate events list
      queryClient.invalidateQueries({ queryKey: ['events'] });

      // Update template usage count
      queryClient.invalidateQueries({ queryKey: EVENT_TEMPLATE_QUERY_KEYS.detail(templateId) });
      queryClient.invalidateQueries({ queryKey: EVENT_TEMPLATE_QUERY_KEYS.stats() });

      toast({
        title: 'Event Created',
        description: `Event "${newEvent.name}" has been created from template.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Create Event',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}

export function useDuplicateEventTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName?: string }) =>
      eventTemplateService.duplicate(id, newName),
    onSuccess: (duplicatedTemplate) => {
      // Invalidate lists to show the new template
      queryClient.invalidateQueries({ queryKey: EVENT_TEMPLATE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EVENT_TEMPLATE_QUERY_KEYS.stats() });

      toast({
        title: 'Template Duplicated',
        description: `Template "${duplicatedTemplate.name}" has been created.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Duplicate Template',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}

// Search hook
export function useSearchEventTemplates(query: string, filters: EventTemplateFilters = {}) {
  return useQuery({
    queryKey: [...EVENT_TEMPLATE_QUERY_KEYS.lists(), 'search', query, filters],
    queryFn: () => eventTemplateService.searchTemplates(query, filters),
    enabled: query.length > 0,
    keepPreviousData: true,
  });
}

// Category-specific hook
export function useEventTemplatesByCategory(category: string, filters: EventTemplateFilters = {}) {
  return useQuery({
    queryKey: [...EVENT_TEMPLATE_QUERY_KEYS.lists(), 'category', category, filters],
    queryFn: () => eventTemplateService.getTemplatesByCategory(category, filters),
    enabled: !!category,
    keepPreviousData: true,
  });
}

// Utility hooks
export function useTemplateValidation() {
  return {
    validateTemplate: eventTemplateService.validateTemplate,
    compareTemplates: eventTemplateService.compareTemplates,
    calculateMetrics: eventTemplateService.calculateTemplateMetrics,
  };
}

export function useTemplateImportExport() {
  const { toast } = useToast();

  const exportTemplate = (template: EventTemplate) => {
    try {
      const exportData = eventTemplateService.exportTemplate(template);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Template Exported',
        description: `Template "${template.name}" has been exported successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export template.',
        variant: 'destructive',
      });
    }
  };

  const parseImportData = (jsonData: string) => {
    try {
      return eventTemplateService.parseImportData(jsonData);
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Invalid template data.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    exportTemplate,
    parseImportData,
  };
}
