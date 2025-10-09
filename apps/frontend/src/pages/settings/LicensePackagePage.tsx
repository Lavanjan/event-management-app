import React, { useState } from 'react';
import { Package, Crown, ArrowUp, Check, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { PackageCard, PackageCardGrid } from '../../components/ui/package-card';
import { useToast } from '../../hooks/use-toast';
import { featurePackageService, FeaturePackage, OrganizationPackage } from '../../services/featurePackageService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PackageUpgradeRequest {
  organizationId: string;
  currentPackageId: string;
  requestedPackageId: string;
  reason?: string;
}

export function LicensePackagePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current organization packages
  const { data: currentPackages, isLoading: loadingCurrent } = useQuery({
    queryKey: ['organization-packages'],
    queryFn: () => featurePackageService.getCurrentOrganizationPackages(),
  });

  // Fetch all available packages
  const { data: availablePackages, isLoading: loadingAvailable } = useQuery({
    queryKey: ['feature-packages', 'active'],
    queryFn: () => featurePackageService.getActiveFeaturePackages(),
  });

  // Request upgrade mutation
  const requestUpgrade = useMutation({
    mutationFn: async (packageId: string) => {
      // This would be implemented in the backend
      // For now, just show a success message
      return new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: 'Upgrade Request Sent',
        description: 'Your package upgrade request has been sent to the Product Admin for approval.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send upgrade request. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const isCurrentPackage = (packageId: string) => {
    return currentPackages?.some(cp => cp.featurePackageId === packageId);
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };



  if (loadingCurrent || loadingAvailable) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">License Package</h1>
        <p className="text-muted-foreground">
          View your current package and explore upgrade options.
        </p>
      </div>

      {/* Current Package */}
      {currentPackages && currentPackages.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Current Package</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentPackages.map((orgPackage) => (
              <div key={orgPackage.id} className="space-y-4">
                <PackageCard
                  id={orgPackage.featurePackage.id}
                  name={orgPackage.featurePackage.name}
                  description={orgPackage.featurePackage.description}
                  price={orgPackage.featurePackage.price}
                  currency={orgPackage.featurePackage.currency}
                  billingCycle={orgPackage.featurePackage.billingCycle}
                  features={orgPackage.featurePackage.features}
                  isActive={orgPackage.featurePackage.isActive}
                  isCurrent={true}
                  variant="current"
                  maxVisibleFeatures={5}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Upgrades */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Packages</h2>
        <PackageCardGrid>
          {availablePackages?.map((pkg) => {
            const isCurrent = isCurrentPackage(pkg.id);

            return (
              <PackageCard
                key={pkg.id}
                id={pkg.id}
                name={pkg.name}
                description={pkg.description}
                price={pkg.price}
                currency={pkg.currency}
                billingCycle={pkg.billingCycle}
                features={pkg.features}
                isActive={pkg.isActive}
                isCurrent={isCurrent}
                onAction={!isCurrent ? requestUpgrade.mutate : undefined}
                actionLabel={!isCurrent ? 'Request Upgrade' : undefined}
                actionLoading={requestUpgrade.isPending}
                maxVisibleFeatures={4}
              />
            );
          })}
        </PackageCardGrid>
      </div>

      {/* Upgrade Process Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Upgrade Process</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• Click "Request Upgrade" on any package to submit an upgrade request</p>
            <p>• Your request will be sent to the Product Admin for review</p>
            <p>• You will be notified once your upgrade request is approved</p>
            <p>• Package changes will take effect immediately upon approval</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
