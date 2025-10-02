import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  Users,
  Eye,
  Copy,
  ArrowUpDown,
  TrendingUp,
  CalendarDays,
  DollarSign,
  XCircle,
  Download,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  useEventList,
  useEventLocations,
  useEventTypes,
  useDeleteEvent,
  useDuplicateEvent
} from '../../hooks/useEvents';
import { EventFilters } from '../../services/eventService';
import { Event } from '../../types';
import CreateEventDialog from '../../components/modals/CreateEventDialog';
import EditEventDialog from '../../components/modals/EditEventDialog';
import { useToast } from '../../hooks/use-toast';
import {
  PageLayout,
  PageHeader,
  StatsGrid,
  StatsCard,
  LoadingState,
  ErrorState
} from '../../components/common/PageLayout';
import { UnifiedDataTable, FilterConfig } from '../../components/common/UnifiedDataTable';

// Filter options
const statusOptions = [
  {
    label: "Draft",
    value: "DRAFT",
    icon: Edit,
  },
  {
    label: "Published",
    value: "PUBLISHED",
    icon: Eye,
  },
  {
    label: "Cancelled",
    value: "CANCELLED",
    icon: XCircle,
  },
];

// Table columns definition
const createColumns = (
  onDelete: (id: string) => void,
  onDuplicate: (id: string) => void,
  onEventUpdated: () => void
): ColumnDef<Event>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Event Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const event = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{event.name}</div>
          <div className="text-sm text-muted-foreground">{event.description}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const event = row.original;
      return (
        <div className="flex items-center">
          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
          {event.location}
        </div>
      );
    },
  },

  {
    accessorKey: "maxAttendees",
    header: "Capacity",
    cell: ({ row }) => {
      const event = row.original;
      const maxAttendees = event.maxAttendees || 0;

      return (
        <div className="flex items-center">
          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
          {maxAttendees > 0 ? `${maxAttendees} attendees` : 'Unlimited'}
        </div>
      );
    },
  },
  {
    accessorKey: "requiredAdvancePercentage",
    header: "Advance Required",
    cell: ({ row }) => {
      const event = row.original;
      return (
        <div className="flex items-center">
          <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
          {event.requiredAdvancePercentage}%
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant = status === 'PUBLISHED' ? 'default' :
                    status === 'DRAFT' ? 'secondary' : 'destructive';
      return (
        <Badge variant={variant}>
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const event = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <EditEventDialog event={event} onEventUpdated={onEventUpdated} />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(event.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate Event
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(event.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Event
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function EventListPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<EventFilters>({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  const { data: eventData, isLoading, error } = useEventList(filters);
  const { data: locations, isLoading: locationsLoading } = useEventLocations();
  const { data: eventTypes, isLoading: typesLoading } = useEventTypes();
  const deleteEvent = useDeleteEvent();
  const duplicateEvent = useDuplicateEvent();

  const events = eventData?.data || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleDuplicate = (id: string) => {
    const event = events.find(e => e.id === id);
    const newName = `${event?.name || 'Event'} (Copy)`;
    duplicateEvent.mutate({ id, newName });
  };

  const handleEventUpdated = () => {
    // Refetch events data
  };

  const columns = useMemo(() => createColumns(
    (id: string) => deleteEvent.mutate(id),
    handleDuplicate,
    handleEventUpdated
  ), [deleteEvent, duplicateEvent, events]);

  const handleSearch = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search,
      page: 1
    }));
  };

  const handleFilterChange = (key: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: values.length > 0 ? values[0] : undefined,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (size: number) => {
    setFilters(prev => ({ ...prev, limit: size, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      sortBy: 'startDate',
      sortOrder: 'DESC',
    });
  };

  // Create filter configurations - Events don't support status filtering in backend
  const filterConfigs: FilterConfig[] = [];

  if (isLoading) {
    return <LoadingState message="Loading events..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load events"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <PageHeader
        title="Event Management"
        description="Manage and organize your event templates"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <CreateEventDialog onEventCreated={handleEventUpdated} />
          </>
        }
      />



      {/* Stats Cards */}
      <StatsGrid columns={4}>
        <StatsCard
          icon={<Calendar className="h-8 w-8" />}
          title="Total Events"
          value={eventData?.total || 0}
          iconColor="text-primary"
        />
        <StatsCard
          icon={<MapPin className="h-8 w-8" />}
          title="Active Events"
          value={events.filter(e => e.isActive).length}
          iconColor="text-green-600"
        />
        <StatsCard
          icon={<DollarSign className="h-8 w-8" />}
          title="Avg. Hourly Rate"
          value={formatCurrency(
            events.reduce((sum, e) => sum + (e.hourlyPrice || 0), 0) / (events.length || 1)
          )}
          iconColor="text-blue-600"
        />
        <StatsCard
          icon={<Users className="h-8 w-8" />}
          title="Max Capacity"
          value={Math.max(...events.map(e => e.maxAttendees || 0), 0)}
          iconColor="text-purple-600"
        />
      </StatsGrid>

      {/* Events Table */}
      <UnifiedDataTable
        columns={columns}
        data={events}
        isLoading={isLoading}
        title="All Events"
        description="Manage and track all your event templates with advanced filtering and search capabilities."
        filters={filters}
        filterConfigs={filterConfigs}
        searchPlaceholder="Search events..."
        onSearchChange={handleSearch}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalCount={eventData?.total || 0}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </PageLayout>
  );
}


