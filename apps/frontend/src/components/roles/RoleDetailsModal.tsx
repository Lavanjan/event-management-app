import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Eye, 
  Shield, 
  Calendar, 
  Users,
  CheckCircle,
  Settings
} from 'lucide-react';

interface RolePermission {
  id: string;
  permissionKey: string;
  name: string;
  description: string;
  category: string;
  module: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  scope: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rolePermissions: RolePermission[];
  permissionKeys: string[];
}

interface RoleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
}

export const RoleDetailsModal: React.FC<RoleDetailsModalProps> = ({
  isOpen,
  onClose,
  role,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPermissionsByCategory = () => {
    return role.rolePermissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, RolePermission[]>);
  };

  const permissionsByCategory = getPermissionsByCategory();
  const categoryCount = Object.keys(permissionsByCategory).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Role Details: {role.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Role Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{role.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge variant={role.isActive ? 'default' : 'secondary'}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Scope:</span>
                  <Badge variant={role.scope === 'global' ? 'default' : 'secondary'}>
                    {role.scope.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total Permissions:</span>
                  <span className="font-medium">{role.rolePermissions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Categories:</span>
                  <span className="font-medium">{categoryCount}</span>
                </div>
                {role.description && (
                  <div>
                    <span className="text-gray-500 block mb-1">Description:</span>
                    <p className="text-sm">{role.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium text-sm">
                    {formatDate(role.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="font-medium text-sm">
                    {formatDate(role.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Role ID:</span>
                  <span className="font-mono text-xs">{role.id}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Permission Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Permission Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                  <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm">{category}</div>
                    <div className="text-2xl font-bold text-blue-600">{permissions.length}</div>
                    <div className="text-xs text-gray-500">permissions</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Detailed Permissions
            </h3>
            
            {Object.entries(permissionsByCategory).map(([category, permissions]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{category}</CardTitle>
                    <Badge variant="secondary">
                      {permissions.length} permissions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="font-medium text-sm">{permission.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{permission.description}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {permission.module}.{permission.action}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {permission.permissionKey}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {role.rolePermissions.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Permissions Assigned</h3>
                <p className="text-gray-500">
                  This role doesn't have any permissions assigned yet. 
                  Edit the role to add permissions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
