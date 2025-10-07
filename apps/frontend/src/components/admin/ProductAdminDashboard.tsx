import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featurePackageService, FeaturePackage, CreateFeaturePackageDto } from '../../services/featurePackageService';
import { useThreeTierPermissions } from '../../hooks/useThreeTierPermissions';
import { CreateFeaturePackageModal } from './CreateFeaturePackageModal';
import { EditFeaturePackageModal } from './EditFeaturePackageModal';
import { useToast } from '../../hooks/use-toast';
import { Edit, Trash2, Eye } from 'lucide-react';

interface ProductAdminDashboardProps {
  className?: string;
}

export const ProductAdminDashboard: React.FC<ProductAdminDashboardProps> = ({ className = '' }) => {
  const { isProductAdmin, hasPermission } = useThreeTierPermissions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<FeaturePackage | null>(null);

  // Fetch all feature packages
  const {
    data: featurePackages,
    isLoading: isLoadingPackages,
    error: packagesError,
  } = useQuery({
    queryKey: ['featurePackages'],
    queryFn: featurePackageService.getAllFeaturePackages,
    enabled: hasPermission('isProductAdmin'),
  });

  // Delete feature package mutation
  const deletePackageMutation = useMutation({
    mutationFn: featurePackageService.deleteFeaturePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featurePackages'] });
      toast({
        title: 'Success',
        description: 'Feature package deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete feature package.',
        variant: 'destructive',
      });
    },
  });



  if (!hasPermission('isProductAdmin')) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
            <p className="text-sm text-red-700 mt-1">
              You need Product Admin permissions to access this dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleEditPackage = (pkg: FeaturePackage) => {
    setEditingPackage(pkg);
    setShowEditModal(true);
  };

  const handleDeletePackage = (pkg: FeaturePackage) => {
    if (window.confirm(`Are you sure you want to delete the feature package "${pkg.name}"? This action cannot be undone.`)) {
      deletePackageMutation.mutate(pkg.id);
    }
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['featurePackages'] });
  };

  if (isLoadingPackages) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (packagesError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Feature Packages</h3>
        <p className="text-red-700">
          {packagesError instanceof Error ? packagesError.message : 'An unknown error occurred'}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage feature packages and organization assignments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Feature Package
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Packages</p>
              <p className="text-2xl font-semibold text-gray-900">{featurePackages?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Packages</p>
              <p className="text-2xl font-semibold text-gray-900">
                {featurePackages?.filter(pkg => pkg.isActive).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Organizations</p>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Packages List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Feature Packages</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {featurePackages?.map((pkg) => (
            <div key={pkg.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{pkg.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      pkg.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{pkg.description}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>${pkg.price}/{pkg.billingCycle}</span>
                    <span>{pkg.features.length} features</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditPackage(pkg)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeletePackage(pkg)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-50"
                    disabled={deletePackageMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{deletePackageMutation.isPending ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <CreateFeaturePackageModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleModalSuccess}
      />

      <EditFeaturePackageModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={handleModalSuccess}
        featurePackage={editingPackage}
      />
    </div>
  );
};
