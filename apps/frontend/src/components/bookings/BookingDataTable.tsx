import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableFilter } from '../common/DataTable';
import { Calendar } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterOptions {
  statuses: FilterOption[];
  paymentStatuses: FilterOption[];
  events: FilterOption[];
}

interface BookingDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  filterOptions?: FilterOptions;
  onFiltersChange?: (filters: Record<string, any>) => void;
  isLoading?: boolean;
  totalCount?: number;
  pageCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function BookingDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search bookings...',
  filterOptions,
  onFiltersChange,
  isLoading = false,
  totalCount = 0,
  pageCount = 0,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
}: BookingDataTableProps<TData, TValue>) {
  
  // Convert filter options to DataTable format
  const filters: DataTableFilter[] = [
    ...(filterOptions?.statuses ? [{
      key: 'status',
      title: 'Status',
      options: filterOptions.statuses,
    }] : []),
    ...(filterOptions?.paymentStatuses ? [{
      key: 'paymentStatus',
      title: 'Payment Status',
      options: filterOptions.paymentStatuses,
    }] : []),
    ...(filterOptions?.events ? [{
      key: 'eventId',
      title: 'Event',
      options: filterOptions.events,
    }] : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder={searchPlaceholder}
      filters={filters}
      onFiltersChange={onFiltersChange}
      isLoading={isLoading}
      totalCount={totalCount}
      pageCount={pageCount}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyStateIcon={Calendar}
      emptyStateTitle="No bookings found"
      emptyStateDescription="No bookings match your search criteria."
    />
  );
}
