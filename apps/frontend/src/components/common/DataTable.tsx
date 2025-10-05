import React, { useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { DataTablePagination } from '../organizations/DataTablePagination';
import { DataTableFacetedFilter } from '../organizations/DataTableFacetedFilter';
import { Search, Settings2, RefreshCw, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface DataTableFilter {
  key: string;
  title: string;
  options: FilterOption[];
}

interface DataTableProps<TData, TValue> {
  // Core table props
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  
  // Search configuration
  searchKey?: string;
  searchPlaceholder?: string;
  
  // Filter configuration
  filters?: DataTableFilter[];
  onFiltersChange?: (filters: Record<string, any>) => void;
  
  // Loading and pagination
  isLoading?: boolean;
  totalCount?: number;
  pageCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  
  // Header configuration
  title?: string;
  description?: string;
  
  // Action buttons
  onRefresh?: () => void;
  onAdd?: () => void;
  addButtonText?: string;
  
  // Empty state
  emptyStateIcon?: React.ComponentType<{ className?: string }>;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  
  // Additional customization
  className?: string;
  showColumnVisibility?: boolean;
  showPagination?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey = 'name',
  searchPlaceholder = 'Search...',
  filters = [],
  onFiltersChange,
  isLoading = false,
  totalCount = 0,
  pageCount = 0,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  title,
  description,
  onRefresh,
  onAdd,
  addButtonText = 'Add New',
  emptyStateIcon: EmptyIcon = Search,
  emptyStateTitle = 'No data found',
  emptyStateDescription = 'No results match your search criteria.',
  className = '',
  showColumnVisibility = true,
  showPagination = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    manualPagination: true,
    pageCount,
  });

  const handleSearchChange = (value: string) => {
    setGlobalFilter(value);
    onFiltersChange?.({ search: value });
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    onFiltersChange?.({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className={className}>
        {(title || description) && (
          <div className="mb-6">
            {title && <h2 className="text-2xl font-bold">{title}</h2>}
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
        )}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-64 bg-muted animate-pulse rounded" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="rounded-md">
            <div className="h-96 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              {title && <h2 className="text-2xl font-bold">{title}</h2>}
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center space-x-2">
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
              {onAdd && (
                <Button onClick={onAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  {addButtonText}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center space-x-2">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filters */}
              {Array.isArray(filters) && filters.map((filter) => (
                <DataTableFacetedFilter
                  key={filter.key}
                  column={table.getColumn(filter.key)}
                  title={filter.title}
                  options={filter.options}
                  onFilterChange={(value) => handleFilterChange(filter.key, value)}
                />
              ))}
            </div>

            {/* Column visibility */}
            {showColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-auto">
                    <Settings2 className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[150px]">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Table */}
          <div className="rounded-md">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <EmptyIcon className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{emptyStateTitle}</p>
                          <p className="text-sm text-muted-foreground">{emptyStateDescription}</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {showPagination && (
            <DataTablePagination
              table={table}
              totalCount={totalCount}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
