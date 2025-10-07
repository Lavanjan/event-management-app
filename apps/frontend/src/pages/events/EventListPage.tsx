import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Calendar,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  Users,
  Clock,
  Eye,
  Copy,
  ArrowUpDown,
  TrendingUp,
  CalendarDays,
  DollarSign,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { DataTable } from '../../components/ui/data-table';
import { DataTableFacetedFilter } from '../../components/ui/data-table-faceted-filter';
import {
  useEventList,
  useEventLocations,
  useEventTypes,
  useDeleteEvent,
  useDuplicateEvent
} from '../../hooks/useEvents';
import { EventFilters } from '../../services/eventService';
import { Event } from '../../types';
import { format } from 'date-fns';
import CreateEventDialog from '../../components/modals/CreateEventDialog';
import EditEventDialog from '../../components/modals/EditEventDialog';
import { useToast } from '../../hooks/use-toast';
import { ManagementLayout, StatCard, ActionButton } from '../../components/layout/ManagementLayout';

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

  const handleStatusFilter = (values: string[]) => {
    setFilters(prev => ({
      ...prev,
      status: values.length > 0 ? values[0] : undefined,
      page: 1
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold">Error loading events</h3>
          <p className="mt-2 text-muted-foreground">
            Something went wrong
          </p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const stats: StatCard[] = [
    {
      icon: CalendarDays,
      label: 'Total Events',
      value: eventData?.total || 0,
      iconColor: 'text-primary',
    },
    {
      icon: Eye,
      label: 'Published',
      value: events.filter(e => e.isActive).length,
      iconColor: 'text-green-600',
    },
    {
      icon: Edit,
      label: 'Draft',
      value: events.filter(e => !e.isActive).length,
      iconColor: 'text-blue-600',
    },
    {
      icon: Users,
      label: 'Total Capacity',
      value: events.reduce((sum, event) => sum + (event.maxAttendees || 0), 0),
      iconColor: 'text-orange-600',
    },
  ];

  const actions: ActionButton[] = [
    {
      icon: TrendingUp,
      label: 'Export',
      onClick: () => {
        // Export functionality
        console.log('Export events');
      },
      variant: 'outline',
    },
  ];

  return (
    <ManagementLayout
      title="Events"
      description="Manage and organize your events"
      stats={stats}
      actions={actions}
      tableTitle="All Events"
      tableDescription="Manage and track all your events with advanced filtering and search capabilities."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <CreateEventDialog onEventCreated={handleEventUpdated} />
        </div>
        <DataTable
          columns={columns}
          data={events}
          isLoading={isLoading}
          pagination={{
            totalCount: eventData?.total || 0,
            pageNumber: filters.page || 1,
            pageSize: filters.limit || 20,
          }}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          filtersToolbar={
            <EventFiltersToolbar
              filters={filters}
              onSearchChange={handleSearch}
              onStatusChange={handleStatusFilter}
              onResetFilters={handleResetFilters}
            />
          }
        />
      </div>
    </ManagementLayout>
  );
}

// Filters Toolbar Component
interface EventFiltersToolbarProps {
  filters: EventFilters;
  onSearchChange: (search: string) => void;
  onStatusChange: (values: string[]) => void;
  onResetFilters: () => void;
}

function EventFiltersToolbar({
  filters,
  onSearchChange,
  onStatusChange,
  onResetFilters,
}: EventFiltersToolbarProps) {
  const hasActiveFilters = filters.search || filters.status;

  return (
    <div className="flex flex-col lg:flex-row w-full items-start space-y-2 mb-2 lg:mb-0 lg:space-x-2 lg:space-y-0">
      {/* Search Input */}
      <div className="relative w-full lg:w-[250px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search events..."
          value={filters.search || ""}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-10"
        />
      </div>

      {/* Status Filter */}
      <DataTableFacetedFilter
        title="Status"
        multiSelect={false}
        options={statusOptions}
        selectedValues={filters.status ? [filters.status] : []}
        onFilterChange={onStatusChange}
      />

      {/* Reset Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          className="h-8 px-2 lg:px-3"
          onClick={onResetFilters}
        >
          Reset
          <XCircle className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
