import { Injectable } from '@nestjs/common';
import { MenuItemDto, UserMenuDto } from '../dto/menu-item.dto';
import { User } from '../../../database/entities/user.entity';
import { PermissionCheckService } from '../permission-check.service';
import { ComprehensivePermissionService } from '../../permissions/comprehensive-permission.service';

@Injectable()
export class MenuService {
  constructor(
    private readonly permissionCheckService: PermissionCheckService,
    private readonly comprehensivePermissionService: ComprehensivePermissionService,
  ) {}

  async getUserMenu(user: User): Promise<UserMenuDto> {
    const userPermissions = await this.permissionCheckService.getUserPermissions(user);
    const isProductAdmin = userPermissions.isProductAdmin;
    const isOrganizationAdmin = user.userType === 'organization_admin';

    // Define menu items based on user type
    let allMenuItems: any[] = [];

    if (isProductAdmin) {
      // Product Admin gets only specific menu items
      allMenuItems = [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: 'LayoutDashboard',
          hasAccess: true,
        },
        {
          name: 'Organization Management',
          href: '/admin/organizations',
          icon: 'Building2',
          hasAccess: true,
        },
        {
          name: 'Feature Packages',
          href: '/admin/feature-packages',
          icon: 'Layers',
          hasAccess: true,
        },
        {
          name: 'Master Permissions',
          href: '/admin/permissions',
          icon: 'Shield',
          hasAccess: true,
        },
      ];
    } else {
      // Organization Admin and Users get permission-based menu items
      // First, get the organization's enabled features from their packages
      const organizationFeatures = await this.getOrganizationFeatures(user.organizationId);

      allMenuItems = [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: 'LayoutDashboard',
          permission: 'dashboard.view',
        },
        {
          name: 'Permission Management',
          icon: 'Shield',
          permissions: ['users.update', 'roles.update'],
          children: [
            {
              name: 'User Permissions',
              href: '/permissions/users',
              icon: 'UserCheck',
              permission: 'users.update',
            },
            {
              name: 'Role Management',
            href: '/permissions/roles',
            icon: 'Users',
            permission: 'roles.update',
          },
        ],
      },
      {
        name: 'Inventory Management',
        icon: 'Package',
        permission: 'inventory.read',
        feature: 'inventory',
        children: [
          {
            name: 'All Items',
            href: '/inventory',
            icon: 'List',
            permission: 'inventory.read',
          },
          {
            name: 'Low Stock Alerts',
            href: '/inventory/alerts',
            icon: 'Archive',
            permission: 'inventory.read',
          },
          {
            name: 'Categories',
            href: '/inventory/categories',
            icon: 'Tag',
            permission: 'inventory.create',
          },
        ],
      },
      {
        name: 'Event Management',
        icon: 'Calendar',
        permission: 'events.read',
        feature: 'events',
        children: [
          {
            name: 'All Events',
            href: '/events',
            icon: 'List',
            permission: 'events.read',
          },
          {
            name: 'Event Templates',
            href: '/events/templates',
            icon: 'FileText',
            permission: 'events.read',
          },
        ],
      },
      {
        name: 'Booking Management',
        icon: 'BookOpen',
        permission: 'bookings.read',
        feature: 'bookings',
        children: [
          {
            name: 'All Bookings',
            href: '/bookings',
            icon: 'List',
            permission: 'bookings.read',
          },
          {
            name: 'Payment Tracking',
            href: '/payments',
            icon: 'CreditCard',
            permission: 'payments.read',
          },
        ],
      },
      {
        name: 'Payment Management',
        icon: 'CreditCard',
        permission: 'payments.read',
        feature: 'payments',
        children: [
          {
            name: 'All Payments',
            href: '/payments',
            icon: 'List',
            permission: 'payments.read',
          },
          {
            name: 'Payment Plans',
            href: '/payments/plans',
            icon: 'FileText',
            permission: 'payments.read',
          },
          {
            name: 'Refunds',
            href: '/payments/refunds',
            icon: 'TrendingUp',
            permission: 'payments.refund',
          },
        ],
      },
      {
        name: 'User Management',
        icon: 'Users',
        permission: 'users.read',
        children: [
          {
            name: 'All Users',
            href: '/users',
            icon: 'User',
            permission: 'users.read',
          },
        ],
      },
      {
        name: 'Financial Reports',
        icon: 'DollarSign',
        permission: 'dashboard.reports',
        children: [
          {
            name: 'Revenue Reports',
            href: '/financial/revenue',
            icon: 'TrendingUp',
            permission: 'dashboard.reports',
          },
          {
            name: 'Expense Reports',
            href: '/financial/expenses',
            icon: 'BarChart3',
            permission: 'dashboard.reports',
          },
          {
            name: 'Profit & Loss',
            href: '/financial/profit-loss',
            icon: 'FileText',
            permission: 'dashboard.reports',
          },
        ],
      },
      {
        name: 'System Settings',
        icon: 'Settings',
        permission: 'settings.read',
        children: [
          {
            name: 'General Settings',
            href: '/settings',
            icon: 'Cog',
            permission: 'settings.read',
          },
          {
            name: 'User Profile',
            href: '/settings/profile',
            icon: 'User',
            permission: 'settings.read',
          },
        ],
      },
      ];

      // Filter menu items based on organization features
      allMenuItems = allMenuItems.filter(item => {
        // Always show items without feature requirement
        if (!item.feature) return true;

        // Check if organization has access to this feature by checking if any permission from this feature exists
        const hasFeaturePermissions = organizationFeatures.some(feature =>
          feature.startsWith(item.feature + '.')
        );
        return hasFeaturePermissions;
      });
    }

    // Filter menu items based on user permissions
    const accessibleMenuItems = await this.filterMenuItems(
      allMenuItems,
      userPermissions.permissions,
      isProductAdmin,
      isOrganizationAdmin,
    );

    return {
      menuItems: accessibleMenuItems,
      userInfo: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        isProductAdmin,
        isOrganizationAdmin,
      },
    };
  }

  private async filterMenuItems(
    items: any[],
    userPermissions: string[],
    isProductAdmin: boolean,
    isOrganizationAdmin: boolean,
  ): Promise<MenuItemDto[]> {
    const result: MenuItemDto[] = [];

    for (const item of items) {
      const hasAccess = this.checkItemAccess(item, userPermissions, isProductAdmin, isOrganizationAdmin);
      
      if (hasAccess) {
        const menuItem: MenuItemDto = {
          name: item.name,
          href: item.href,
          icon: item.icon,
          hasAccess: true,
        };

        // Process children if they exist
        if (item.children && item.children.length > 0) {
          const accessibleChildren = await this.filterMenuItems(
            item.children,
            userPermissions,
            isProductAdmin,
            isOrganizationAdmin,
          );
          
          // Only include parent if it has accessible children or has its own href
          if (accessibleChildren.length > 0 || item.href) {
            menuItem.children = accessibleChildren;
            result.push(menuItem);
          }
        } else {
          result.push(menuItem);
        }
      }
    }

    return result;
  }

  private checkItemAccess(
    item: any,
    userPermissions: string[],
    isProductAdmin: boolean,
    isOrganizationAdmin: boolean,
  ): boolean {
    // Check product admin requirement
    if (item.requireProductAdmin && !isProductAdmin) {
      return false;
    }

    // Check organization admin requirement
    if (item.requireOrganizationAdmin && !isOrganizationAdmin) {
      return false;
    }

    // Check single permission
    if (item.permission && !userPermissions.includes(item.permission)) {
      return false;
    }

    // Check multiple permissions (user needs ANY of them)
    if (item.permissions && !item.permissions.some((perm: string) => userPermissions.includes(perm))) {
      return false;
    }

    return true;
  }

  /**
   * Get organization's enabled features from their feature packages
   */
  private async getOrganizationFeatures(organizationId: string): Promise<string[]> {
    try {
      // Use the comprehensive permission service to get organization features
      return await this.comprehensivePermissionService.getOrganizationFeatures(organizationId);
    } catch (error) {
      console.error('Error getting organization features:', error);
      // Return empty array if there's an error - this will hide all feature-specific menus
      return [];
    }
  }
}
