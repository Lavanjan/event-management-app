import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThreeTierPermissions } from '../../hooks/useThreeTierPermissions';
import { userPermissionService } from '../../services/userPermissionService';
import { api } from '../../services/api';
import { RoleManagementTab } from './RoleManagementTab';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Search, Users, Shield, Settings, Check, X, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  isActive: boolean;
}

// @ts-ignore
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface OrganizationPermissionManagerProps {
  className?: string;
  defaultTab?: 'users' | 'roles';
}

export const OrganizationPermissionManager: React.FC<OrganizationPermissionManagerProps> = ({
  className = '',
  defaultTab = 'users'
}) => {
  const {
    isOrganizationAdmin,
    hasPermission,
    organizationFeatures,
    // @ts-ignore
    permissionData
  } = useThreeTierPermissions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionFilter, setPermissionFilter] = useState<'all' | 'granted' | 'denied'>('all');

  // Fetch organization users
  const {
    data: users,
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ['organizationUsers'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.data || []; // Extract the data array from the response with fallback
    },
    enabled: hasPermission('users.read'),
    placeholderData: [], // Provide default empty array
  });

  // Fetch organization roles
  const {
    data: roles,
    isLoading: isLoadingRoles,
  } = useQuery({
    queryKey: ['organizationRoles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data.data || response.data || []; // Extract the data array from the response with fallback
    },
    enabled: hasPermission('roles.read'),
    placeholderData: [], // Provide default empty array
  });

  // Fetch user permissions for selected user
  const {
    data: userPermissions,
    isLoading: isLoadingUserPermissions,
  } = useQuery({
    queryKey: ['userPermissions', selectedUser?.id],
    queryFn: () => userPermissionService.getUserPermissions(selectedUser!.id),
    enabled: !!selectedUser && hasPermission('users.read'),
  });

  // Grant permission mutation
  const grantPermissionMutation = useMutation({
    mutationFn: ({ userId, permissionKey, reason }: { 
      userId: string; 
      permissionKey: string; 
      reason?: string; 
    }) => userPermissionService.grantPermission(userId, permissionKey, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPermissions'] });
    },
  });

  // Deny permission mutation
  const denyPermissionMutation = useMutation({
    mutationFn: ({ userId, permissionKey, reason }: { 
      userId: string; 
      permissionKey: string; 
      reason?: string; 
    }) => userPermissionService.denyPermission(userId, permissionKey, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPermissions'] });
    },
  });

  if (!isOrganizationAdmin() && !hasPermission('users.update')) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Insufficient Permissions</h3>
            <p className="text-sm text-yellow-700 mt-1">
              You need organization admin or user management permissions to access this feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleGrantPermission = (userId: string, permissionKey: string) => {
    const reason = prompt('Reason for granting this permission (optional):');
    grantPermissionMutation.mutate(
      { userId, permissionKey, reason: reason || undefined },
      {
        onSuccess: () => {
          toast({
            title: 'Permission Granted',
            description: `Successfully granted ${permissionKey} permission.`,
          });
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to grant permission. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDenyPermission = (userId: string, permissionKey: string) => {
    const reason = prompt('Reason for denying this permission (optional):');
    denyPermissionMutation.mutate(
      { userId, permissionKey, reason: reason || undefined },
      {
        onSuccess: () => {
          toast({
            title: 'Permission Denied',
            description: `Successfully denied ${permissionKey} permission.`,
          });
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to deny permission. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  // Fetch available permissions from backend
  const {
    data: availablePermissions,
    // @ts-ignore
    isLoading: isLoadingPermissions,
  } = useQuery({
    queryKey: ['availablePermissions'],
    queryFn: async () => {
      const response = await api.get('/permissions');
      return response.data.data; // Extract the data array from the response
    },
    enabled: hasPermission('users.read'),
  });

  const getAvailablePermissions = () => {
    if (!availablePermissions) return [];

    // Return permissions that are available based on organization's feature packages
    const allPermissions = availablePermissions.map((p: any) => `${p.module}.${p.action}`);

    // Filter based on organization features if available
    if (organizationFeatures && organizationFeatures.length > 0) {
      return allPermissions.filter((permission: string) => {
        const module = permission.split('.')[0];
        return organizationFeatures.includes(module) || organizationFeatures.includes(permission);
      });
    }

    return allPermissions;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
        <p className="text-gray-600 mt-1">
          Manage user permissions and roles within your organization's feature package limits
        </p>
      </div>

      {/* Organization Features Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Available Features</h3>
        <div className="flex flex-wrap gap-2">
          {organizationFeatures?.map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {feature}
            </span>
          )) || (
            <span className="text-blue-700 text-sm">Loading features...</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'users' | 'roles')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Permissions
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Role Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={permissionFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPermissionFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={permissionFilter === 'granted' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPermissionFilter('granted')}
                  >
                    Granted
                  </Button>
                  <Button
                    variant={permissionFilter === 'denied' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPermissionFilter('denied')}
                  >
                    Denied
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Organization Users
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {isLoadingUsers ? (
                    <div className="p-6">
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    (users.data || [])
                      .filter((user: User) =>
                        searchQuery === '' ||
                        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((user: User) => (
                        <div
                          key={user.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                            selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {user.firstName[0]}{user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <span className="text-xs text-gray-500">{user.userType}</span>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Permission Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {selectedUser ? `${selectedUser.firstName}'s Permissions` : 'Select a User'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedUser ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Select a user from the list to manage their permissions
                    </p>
                  </div>
                ) : isLoadingUserPermissions ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Available Permissions</h4>
                      <div className="space-y-3">
                        {getAvailablePermissions()
                          .filter((permission: any) => {
                            if (permissionFilter === 'granted') {
                              return userPermissions?.userOverrides.grants.includes(permission) ||
                                     userPermissions?.rolePermissions.includes(permission);
                            }
                            if (permissionFilter === 'denied') {
                              return userPermissions?.userOverrides.denies.includes(permission);
                            }
                            return true;
                          })
                          .map((permission: any) => {
                            const hasOverride = userPermissions?.userOverrides.grants.includes(permission) ||
                                              userPermissions?.userOverrides.denies.includes(permission);
                            const isGranted = userPermissions?.userOverrides.grants.includes(permission);
                            const isDenied = userPermissions?.userOverrides.denies.includes(permission);
                            const hasFromRole = userPermissions?.rolePermissions.includes(permission);

                            return (
                              <Card key={permission} className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{permission}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {hasFromRole && (
                                        <Badge variant="outline" className="text-xs">
                                          Role Permission
                                        </Badge>
                                      )}
                                      {hasOverride && (
                                        <Badge
                                          variant={isGranted ? "default" : "destructive"}
                                          className="text-xs"
                                        >
                                          Override: {isGranted ? 'Granted' : 'Denied'}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant={isGranted ? "default" : "outline"}
                                      onClick={() => handleGrantPermission(selectedUser.id, permission)}
                                      disabled={isGranted}
                                      className="h-8"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Grant
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={isDenied ? "destructive" : "outline"}
                                      onClick={() => handleDenyPermission(selectedUser.id, permission)}
                                      disabled={isDenied}
                                      className="h-8"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Deny
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <RoleManagementTab
            roles={roles}
            isLoadingRoles={isLoadingRoles}
            availablePermissions={getAvailablePermissions()}
            hasPermission={hasPermission}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
