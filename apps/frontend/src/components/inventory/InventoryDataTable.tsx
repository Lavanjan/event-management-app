import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableFilter } from '../common/DataTable';
import { Package } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterOptions {
  categories: FilterOption[];
  brands: FilterOption[];
  quantityUnits: FilterOption[];
  stockStatuses: FilterOption[];
}

interface InventoryDataTableProps<TData, TValue> {
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

export function InventoryDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search inventory...',
  filterOptions,
  onFiltersChange,
  isLoading = false,
  totalCount = 0,
  pageCount = 0,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
}: InventoryDataTableProps<TData, TValue>) {

  // Convert filter options to DataTable format
  const filters: DataTableFilter[] = [
    ...(filterOptions?.categories ? [{
      key: 'category',
      title: 'Category',
      options: filterOptions.categories,
    }] : []),
    ...(filterOptions?.brands ? [{
      key: 'brand',
      title: 'Brand',
      options: filterOptions.brands,
    }] : []),
    // Note: quantityUnit is not a separate column, it's part of the quantity display
    // ...(filterOptions?.quantityUnits ? [{
    //   key: 'quantityUnit',
    //   title: 'Unit',
    //   options: filterOptions.quantityUnits,
    // }] : []),
    ...(filterOptions?.stockStatuses ? [{
      key: 'stockStatus',
      title: 'Stock Status',
      options: filterOptions.stockStatuses,
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
      emptyStateIcon={Package}
      emptyStateTitle="No inventory items found"
      emptyStateDescription="No items match your search criteria."
    />
  );
}
