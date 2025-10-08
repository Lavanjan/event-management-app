// @ts-ignore
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { api } from '../../services/api';

interface MasterPermission {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  module: string;
  action: string;
  isActive: boolean;
  defaultEnabled: boolean;
  sortOrder: number;
}

export function MasterPermissionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  // @ts-ignore
  const queryClient = useQueryClient();

  // Fetch master permissions
  const { data: permissions, isLoading } = useQuery({
    queryKey: ['masterPermissions'],
    queryFn: async () => {
      const response = await api.get('/permissions');
      return response.data.data; // Extract the data array from the response
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['permissionCategories'],
    queryFn: async () => {
      const response = await api.get('/permissions/categories');
      return response.data.data; // Extract the data array from the response
    },
  });

  // Filter permissions
  const filteredPermissions = permissions?.filter((permission: MasterPermission) => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || permission.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  // Group permissions by category
  const groupedPermissions = filteredPermissions.reduce((acc: Record<string, MasterPermission[]>, permission: MasterPermission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Permissions</h1>
          <p className="text-muted-foreground">
            Manage system-wide permissions and their configurations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Permission
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">All Categories</option>
                {categories?.map((category: string) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions by Category */}
      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category}
                <Badge variant="secondary">{(categoryPermissions as any).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission Key</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(categoryPermissions as any).map((permission: any) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-mono text-sm">
                        {permission.key}
                      </TableCell>
                      <TableCell className="font-medium">
                        {permission.name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {permission.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{permission.module}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{permission.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={permission.isActive ? "default" : "secondary"}>
                          {permission.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={permission.defaultEnabled ? "default" : "secondary"}>
                          {permission.defaultEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{permissions?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Permissions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Object.keys(groupedPermissions).length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {permissions?.filter((p: MasterPermission) => p.isActive).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {permissions?.filter((p: MasterPermission) => p.defaultEnabled).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Default Enabled</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
