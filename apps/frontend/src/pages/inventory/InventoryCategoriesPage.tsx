import React from 'react';
import { CategoryManagement } from '../../components/inventory/CategoryManagement';

export const InventoryCategoriesPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <CategoryManagement />
    </div>
  );
};
