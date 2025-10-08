// @ts-ignore
import React from 'react';
import { X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { DataTableFacetedFilter } from './DataTableFacetedFilter';

interface OrganizationTableFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (values: string[]) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Inactive', value: 'inactive' },
];

export function OrganizationTableFilters({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  isLoading,
}: OrganizationTableFiltersProps) {
  const hasActiveFilters = searchValue || statusFilter.length > 0;

  return (
    <div className="flex flex-col lg:flex-row w-full items-start space-y-2 mb-2 lg:mb-0 lg:space-x-2 lg:space-y-0">
      <Input
        placeholder="Filter organizations..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8 w-full lg:w-[250px]"
      />

      <DataTableFacetedFilter
        title="Status"
        multiSelect={true}
        options={statusOptions}
        disabled={isLoading}
        selectedValues={statusFilter}
        onFilterChange={onStatusFilterChange}
      />

      {hasActiveFilters && (
        <Button
          disabled={isLoading}
          variant="ghost"
          className="h-8 px-2 lg:px-3"
          onClick={onClearFilters}
        >
          Reset
          <X />
        </Button>
      )}
    </div>
  );
}
