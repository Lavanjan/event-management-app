import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Search, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { DataTable } from '../ui/data-table';
import { DataTableFacetedFilter } from '../ui/data-table-faceted-filter';

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterConfig {
  key: string;
  title: string;
  options: FilterOption[];
  multiSelect?: boolean;
}

export interface UnifiedFilters {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  [key: string]: any; // For additional filter fields
}

interface FiltersToolbarProps {
  filters: UnifiedFilters;
  filterConfigs: FilterConfig[];
  onSearchChange: (search: string) => void;
  onFilterChange: (key: string, values: string[]) => void;
  onResetFilters: () => void;
  searchPlaceholder?: string;
}

function FiltersToolbar({
  filters,
  filterConfigs,
  onSearchChange,
  onFilterChange,
  onResetFilters,
  searchPlaceholder = "Search...",
}: FiltersToolbarProps) {
  const hasActiveFilters = filters.search || 
    filterConfigs.some(config => filters[config.key]);

  return (
    <div className="flex flex-col lg:flex-row w-full items-start space-y-2 mb-2 lg:mb-0 lg:space-x-2 lg:space-y-0">
      {/* Search Input */}
      <div className="relative w-full lg:w-[250px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={searchPlaceholder}
          value={filters.search || ''}
          onChange={e => onSearchChange(e.target.value)}
          className="h-8 pl-10"
        />
      </div>

      {/* Dynamic Filters */}
      {filterConfigs.map(config => (
        <DataTableFacetedFilter
          key={config.key}
          title={config.title}
          multiSelect={config.multiSelect ?? false}
          options={config.options}
          selectedValues={filters[config.key] ? [filters[config.key]] : []}
          onFilterChange={(values) => onFilterChange(config.key, values)}
        />
      ))}

      {/* Reset Filters Button */}
      {hasActiveFilters && (
        <Button variant="ghost" className="h-8 px-2 lg:px-3" onClick={onResetFilters}>
          Reset
          <XCircle className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface UnifiedDataTableProps<TData> {
  // Table props
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  
  // Card props
  title: string;
  description: string;
  
  // Filter props
  filters: UnifiedFilters;
  filterConfigs?: FilterConfig[];
  searchPlaceholder?: string;
  onSearchChange: (search: string) => void;
  onFilterChange: (key: string, values: string[]) => void;
  onResetFilters: () => void;
  
  // Pagination props
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  
  // Optional props
  className?: string;
}

export function UnifiedDataTable<TData>({
  columns,
  data,
  isLoading,
  title,
  description,
  filters,
  filterConfigs = [],
  searchPlaceholder,
  onSearchChange,
  onFilterChange,
  onResetFilters,
  totalCount,
  onPageChange,
  onPageSizeChange,
  className,
}: UnifiedDataTableProps<TData>) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          pagination={{
            totalCount,
            pageNumber: filters.page,
            pageSize: filters.limit,
          }}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          filtersToolbar={
            <FiltersToolbar
              filters={filters}
              filterConfigs={filterConfigs}
              onSearchChange={onSearchChange}
              onFilterChange={onFilterChange}
              onResetFilters={onResetFilters}
              searchPlaceholder={searchPlaceholder}
            />
          }
        />
      </CardContent>
    </Card>
  );
}
