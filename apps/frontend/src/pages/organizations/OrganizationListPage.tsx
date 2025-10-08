import { useState, useEffect } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { organizationService, Organization, OrganizationQueryParams } from '../../services/organizationService';
import { CreateOrganizationModal } from '../../components/organizations/CreateOrganizationModal';
import { ViewOrganizationModal } from '../../components/organizations/ViewOrganizationModal';
import { EditOrganizationModal } from '../../components/organizations/EditOrganizationModal';

import { OrganizationDataTable } from '../../components/organizations/OrganizationDataTable';
import { OrganizationTableFilters } from '../../components/organizations/OrganizationTableFilters';
import { useToast } from '../../hooks/use-toast';
import { LoadingSpinner } from '../../components/ui/loading-spinner';

export function OrganizationListPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const params: OrganizationQueryParams = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter.length > 0 ? statusFilter[0] as any : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const response = await organizationService.getOrganizations(params);
      // @ts-ignore
      setOrganizations(response.data?.data || response.data || []);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load organizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organizations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (values: string[]) => {
    setStatusFilter(values);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter([]);
    setCurrentPage(1);
  };

  // Modal handlers
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  const handleView = (organization: Organization) => {
    setSelectedOrganization(organization);
    setViewModalOpen(true);
  };

  const handleEdit = (organization: Organization) => {
    setSelectedOrganization(organization);
    setEditModalOpen(true);
  };



  const handleDelete = async (organization: Organization) => {
    if (organization.status === 'active') {
      toast({
        title: 'Cannot Delete',
        description: 'Cannot delete active organization. Please suspend it first.',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete "${organization.name}"? This action cannot be undone.`)) {
      try {
        await organizationService.deleteOrganization(organization.id);
        toast({
          title: 'Success',
          description: 'Organization deleted successfully.',
        });
        loadOrganizations();
      } catch (error) {
        console.error('Failed to delete organization:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete organization. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSuspend = async (organization: Organization) => {
    if (confirm(`Are you sure you want to suspend "${organization.name}"?`)) {
      try {
        await organizationService.suspendOrganization(organization.id);
        toast({
          title: 'Success',
          description: 'Organization suspended successfully.',
        });
        loadOrganizations();
      } catch (error) {
        console.error('Failed to suspend organization:', error);
        toast({
          title: 'Error',
          description: 'Failed to suspend organization. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleResendVerification = async (organization: Organization) => {
    try {
      await organizationService.resendVerificationEmail(organization.id);
      toast({
        title: 'Success',
        description: 'Verification email sent successfully.',
      });
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend verification email. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // @ts-ignore
  const handleStatusChange = async (organizationId: string, action: 'activate' | 'suspend' | 'deactivate') => {
    try {
      let updatedOrg: Organization;
      switch (action) {
        case 'activate':
          updatedOrg = await organizationService.activateOrganization(organizationId);
          break;
        case 'suspend':
          updatedOrg = await organizationService.suspendOrganization(organizationId);
          break;
        case 'deactivate':
          updatedOrg = await organizationService.deactivateOrganization(organizationId);
          break;
      }

      setOrganizations(prev =>
        prev.map(org => org.id === organizationId ? updatedOrg : org)
      );

      toast({
        title: 'Success',
        description: `Organization ${action}d successfully.`,
      });
    } catch (error) {
      console.error(`Failed to ${action} organization:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} organization. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  if (loading && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage organizations and their settings
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
      </div>

      {/* Data Table with Filters */}
      <OrganizationDataTable
        data={organizations}
        isLoading={loading}
        totalCount={total}
        pageNumber={currentPage}
        pageSize={10}
        onPageChange={setCurrentPage}
        onPageSizeChange={(_size) => {
          // Handle page size change if needed
        }}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSuspend={handleSuspend}
        onResendVerification={handleResendVerification}
        filtersToolbar={
          <OrganizationTableFilters
            searchValue={searchTerm}
            onSearchChange={handleSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            onClearFilters={handleClearFilters}
            isLoading={loading}
          />
        }
      />



      {/* Empty State */}
      {organizations.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter.length > 0
                ? 'No organizations match your current filters.'
                : 'Get started by creating your first organization.'}
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Organization
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={loadOrganizations}
      />

      {/* View/Edit/Permissions Modals */}
      {selectedOrganization && (
        <>
          <ViewOrganizationModal
            open={viewModalOpen}
            onOpenChange={setViewModalOpen}
            organization={selectedOrganization}
          />
          <EditOrganizationModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            organization={selectedOrganization}
            onSuccess={() => {
              loadOrganizations();
              setEditModalOpen(false);
            }}
          />

        </>
      )}
    </div>
  );
}
