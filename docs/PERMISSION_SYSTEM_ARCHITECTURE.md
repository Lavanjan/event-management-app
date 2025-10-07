# Three-Tier Permission System Architecture

## Overview

This document describes the comprehensive three-tier permission system implemented for the Event Management Application. The system provides granular access control through three hierarchical levels: Product-level, Organization-level, and User-level permissions.

## 🏗️ Architecture Overview

### Three Permission Levels

1. **Product-Level Permissions** (Managed by Product Admin)
   - Define system-wide features and capabilities
   - Create and manage feature packages
   - Assign packages to organizations
   - Control which features are available to each organization

2. **Organization-Level Permissions** (Managed by Organization Admin)
   - Create and manage roles within the organization
   - Assign permissions to roles (limited to organization's available features)
   - Manage user role assignments

3. **User-Level Permissions** (Individual overrides)
   - Grant specific permissions to individual users
   - Deny specific permissions to individual users
   - Override role-based permissions on a per-user basis

### Permission Evaluation Flow

```
Package Features → Role Permissions → User Overrides → Final Permissions
```

**Priority Order (highest to lowest):**
1. User-specific denies (highest priority)
2. User-specific grants
3. Role-based permissions
4. Package-level features (base level)

## 🗄️ Database Schema

### Core Entities

#### MasterPermission
- System-wide permission definitions
- Managed only by Product Admin
- Source of truth for all available permissions

#### FeaturePackage
- Collections of features with pricing
- Created by Product Admin
- Can be assigned to organizations

#### OrganizationPackage
- Links organizations to feature packages
- Tracks assignment details and expiration
- Determines what features an organization has access to

#### OrganizationPermission
- Organization-specific permission enablement
- Synced from MasterPermissions
- Controls which permissions are available within an organization

#### RolePermission
- Links roles to specific permissions
- Limited to organization's available features
- Managed by Organization Admin

#### UserPermission
- Individual user permission overrides
- Can grant or deny specific permissions
- Highest priority in permission evaluation

## 🔧 Implementation Details

### Services

#### ComprehensivePermissionService
- Main service for permission evaluation
- Implements three-tier permission logic
- Provides methods for checking user permissions

#### FeaturePackagesService
- Manages feature packages
- Handles package assignment to organizations
- Validates package features

### Guards

#### ComprehensivePermissionGuard
- NestJS guard for API endpoint protection
- Uses ComprehensivePermissionService for permission checks
- Supports both "any" and "all" permission requirements

### Decorators

```typescript
// Single permission
@RequirePermission('inventory.read')

// Multiple permissions (any)
@RequirePermissions(['users.create', 'users.update'])

// Multiple permissions (all required)
@RequirePermissions(['users.create', 'users.update'], true)

// Module-specific shortcuts
@RequireInventoryRead()
@RequireEventsWrite()
@RequireUsersDelete()
```

## 📊 Permission Flow Examples

### Example 1: Basic User Access

1. **Organization** has "Professional Event Management" package
2. **User** has "Event Manager" role
3. **Role** has permissions: `['events.read', 'events.create', 'bookings.read']`
4. **User** has no individual overrides
5. **Final permissions**: `['events.read', 'events.create', 'bookings.read']`

### Example 2: User with Overrides

1. **Organization** has "Basic Event Management" package
2. **User** has "Basic User" role
3. **Role** has permissions: `['events.read', 'bookings.read']`
4. **User** has individual grant: `['events.create']`
5. **User** has individual deny: `['bookings.read']`
6. **Final permissions**: `['events.read', 'events.create']` (deny overrides role permission)

### Example 3: Product Admin

1. **User** has `userType: 'product_admin'`
2. **Final permissions**: All system permissions (bypasses all restrictions)

## 🚀 Usage Examples

### Backend API Protection

```typescript
@Controller('inventory')
export class InventoryController {
  @Get()
  @RequireInventoryRead()
  async getInventory() {
    // Only users with inventory.read permission can access
  }

  @Post()
  @RequirePermissions(['inventory.create'], true)
  async createInventory() {
    // Requires inventory.create permission
  }

  @Delete(':id')
  @RequirePermissions(['inventory.delete', 'inventory.update'], false)
  async deleteInventory() {
    // Requires either inventory.delete OR inventory.update
  }
}
```

### Frontend Permission Checks

```typescript
// Check single permission
const canViewInventory = hasPermission('inventory.read');

// Check multiple permissions
const canManageUsers = hasAllPermissions(['users.create', 'users.update']);

// Conditional rendering
{hasPermission('events.create') && (
  <CreateEventButton />
)}
```

## 🎯 Feature Packages

### Default Packages

1. **Basic Event Management** ($29.99/month)
   - Essential event and booking features
   - Limited user management

2. **Professional Event Management** ($79.99/month)
   - Advanced event features
   - Inventory management
   - Analytics and reporting

3. **Enterprise Event Management** ($199.99/month)
   - Complete feature set
   - Advanced user management
   - Financial management

4. **Add-on Packages**
   - Inventory Management ($19.99/month)
   - Financial Management ($39.99/month)
   - User Management ($24.99/month)

### Package Management

```typescript
// Create package
await featurePackagesService.createFeaturePackage({
  name: 'Custom Package',
  features: ['events.read', 'events.create', 'bookings.read'],
  price: 49.99,
  billingCycle: 'monthly'
});

// Assign to organization
await featurePackagesService.assignPackageToOrganization({
  organizationId: 'org-id',
  featurePackageId: 'package-id',
  assignedBy: 'admin-id'
});
```

## 🔒 Security Considerations

### Permission Validation
- All permissions are validated against MasterPermissions
- Package features are validated during creation
- Role permissions are limited to organization's available features

### Audit Trail
- All permission grants/denies are logged with timestamps
- Assignment history is maintained
- Soft deletes preserve permission history

### Performance Optimization
- Permission checks are cached per request
- Database queries are optimized with proper indexing
- Bulk permission checks are supported

## 🧪 Testing

### Permission Testing Utilities

```typescript
// Test permission evaluation
const permissions = await comprehensivePermissionService.getUserPermissions(
  userId, 
  organizationId
);

// Test specific permission
const hasPermission = await comprehensivePermissionService.hasPermission(
  userId, 
  organizationId, 
  'inventory.read'
);
```

### Test Scenarios
- Product admin access
- Organization admin access
- Role-based access
- User override scenarios
- Package expiration handling
- Permission inheritance

## 📈 Future Enhancements

### Planned Features
1. **Time-based Permissions**: Permissions that expire automatically
2. **Conditional Permissions**: Permissions based on business rules
3. **Permission Templates**: Pre-defined permission sets for common roles
4. **Advanced Analytics**: Permission usage tracking and optimization
5. **API Rate Limiting**: Per-permission rate limiting
6. **Multi-tenant Isolation**: Enhanced security for multi-tenant scenarios

### Scalability Considerations
- Redis caching for permission lookups
- Permission denormalization for faster queries
- Async permission evaluation for bulk operations
- Microservice architecture for permission service

## 🔧 Maintenance

### Regular Tasks
1. **Permission Audit**: Review and cleanup unused permissions
2. **Package Optimization**: Analyze package usage and optimize offerings
3. **Performance Monitoring**: Monitor permission check performance
4. **Security Review**: Regular security audits of permission logic

### Troubleshooting
- Check permission evaluation logs
- Verify package assignments
- Validate role configurations
- Review user override settings
