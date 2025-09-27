import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { eventService, EventFilters } from '../services/eventService';
import { addNotification } from '../store/slices/uiSlice';
import { Event, CreateEventDto, UpdateEventDto } from '../types';

export const EVENT_QUERY_KEYS = {
  all: ['events'] as const,
  lists: () => [...EVENT_QUERY_KEYS.all, 'list'] as const,
  list: (filters: EventFilters) => [...EVENT_QUERY_KEYS.lists(), filters] as const,
  upcoming: (filters: EventFilters) => [...EVENT_QUERY_KEYS.all, 'upcoming', filters] as const,
  details: () => [...EVENT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EVENT_QUERY_KEYS.details(), id] as const,
  stats: (id: string) => [...EVENT_QUERY_KEYS.all, 'stats', id] as const,
  templates: () => [...EVENT_QUERY_KEYS.all, 'templates'] as const,
  locations: () => [...EVENT_QUERY_KEYS.all, 'locations'] as const,
  types: () => [...EVENT_QUERY_KEYS.all, 'types'] as const,
  availability: (location: string, startDate: string, endDate: string) => 
    [...EVENT_QUERY_KEYS.all, 'availability', location, startDate, endDate] as const,
};

export function useEventList(filters: EventFilters = {}) {
  return useQuery({
    queryKey: EVENT_QUERY_KEYS.list(filters),
    queryFn: () => eventService.getAll(filters),
    keepPreviousData: true,
  });
}

export function useUpcomingEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: EVENT_QUERY_KEYS.upcoming(filters),
    queryFn: () => eventService.getUpcoming(filters),
    keepPreviousData: true,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: EVENT_QUERY_KEYS.detail(id),
    queryFn: () => eventService.getById(id),
    enabled: !!id,
  });
}

export function useEventStats(id: string) {
  return useQuery({
    queryKey: EVENT_QUERY_KEYS.stats(id),
    queryFn: () => eventService.getStats(id),
    enabled: !!id,
  });
}

export function useEventTemplates() {
  return useQuery({
    queryKey: EVENT_QUERY_KEYS.templates(),
    queryFn: () => eventService.getEventTemplates(),
  });
}

export function useEventLocations() {
  return useQuery({
    queryKey: EVENT_QUERY_KEYS.locations(),
    queryFn: () => eventService.getLocations(),
  });
}

export function useEventTypes() {
  return useQuery({
    queryKey: EVENT_QUERY_KEYS.types(),
    queryFn: () => eventService.getEventTypes(),
  });
}

export function useCheckEventAvailability(
  location: string,
  startDate: string,
  endDate: string,
  excludeEventId?: string
) {
  return useQuery({
    queryKey: EVENT_QUERY_KEYS.availability(location, startDate, endDate),
    queryFn: () => eventService.checkAvailability(location, startDate, endDate, excludeEventId),
    enabled: !!(location && startDate && endDate),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (data: CreateEventDto) => eventService.create(data),
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.locations() });
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.types() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Event Created',
        message: `${newEvent.name} has been created successfully`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error.response?.data?.message || 'Failed to create event',
      }));
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventDto }) =>
      eventService.update(id, data),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.detail(updatedEvent.id) });
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.stats(updatedEvent.id) });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Event Updated',
        message: `${updatedEvent.name} has been updated`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.response?.data?.message || 'Failed to update event',
      }));
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.lists() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Event Deleted',
        message: 'Event has been deleted successfully',
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.response?.data?.message || 'Failed to delete event',
      }));
    },
  });
}

export function useDuplicateEvent() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      eventService.duplicate(id, newName),
    onSuccess: (duplicatedEvent) => {
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.lists() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Event Duplicated',
        message: `${duplicatedEvent.name} has been created as a copy`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Duplication Failed',
        message: error.response?.data?.message || 'Failed to duplicate event',
      }));
    },
  });
}

export function useCreateEventFromTemplate() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: Partial<CreateEventDto> }) =>
      eventService.createFromTemplate(templateId, data),
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.lists() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Event Created from Template',
        message: `${newEvent.name} has been created successfully`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error.response?.data?.message || 'Failed to create event from template',
      }));
    },
  });
}
