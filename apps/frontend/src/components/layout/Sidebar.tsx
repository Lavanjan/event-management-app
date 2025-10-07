import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Package,
  Calendar,
  BookOpen,
  Users,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  User,
  UserPlus,
  Shield,
  UserCheck,
  BarChart3,
  FileText,
  CreditCard,
  TrendingUp,
  Archive,
  Search,
  Filter,
  Cog,
  Building2,
  Tag,
  Crown,
  Layers,
} from 'lucide-react';
import { RootState } from '../../store';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';
import { menuService, MenuItemDto } from '../../services/menuService';

// Icon mapping for backend icon names to actual icon components
const iconMap: Record<string, any> = {
  LayoutDashboard,
  Package,
  Calendar,
  BookOpen,
  Users,
  DollarSign,
  Settings,
  List,
  User,
  UserPlus,
  Shield,
  UserCheck,
  BarChart3,
  FileText,
  CreditCard,
  TrendingUp,
  Archive,
  Search,
  Filter,
  Cog,
  Building2,
  Tag,
  Crown,
  Layers,
};

// Convert backend menu item to frontend navigation item
const convertMenuItemToNavigation = (item: MenuItemDto): NavigationItem => {
  const IconComponent = iconMap[item.icon] || Package; // Default to Package icon if not found

  return {
    name: item.name,
    href: item.href,
    icon: IconComponent,
    hasAccess: item.hasAccess,
    children: item.children?.map(convertMenuItemToNavigation),
  };
};

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  hasAccess: boolean;
  children?: NavigationItem[];
}

// Navigation is now fetched from backend
const staticNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard.view',
  },
  {
    name: 'Organizations',
    href: '/organizations',
    icon: Building2,
    permission: 'organizations.read',
  },
  {
    name: 'Product Admin',
    icon: Crown,
    requireProductAdmin: true,
    children: [
      {
        name: 'Feature Packages',
        href: '/admin/feature-packages',
        icon: Layers,
        requireProductAdmin: true,
      },
      {
        name: 'Organization Management',
        href: '/admin/organizations',
        icon: Building2,
        requireProductAdmin: true,
      },
      {
        name: 'Master Permissions',
        href: '/admin/permissions',
        icon: Shield,
        requireProductAdmin: true,
      },
    ],
  },
  {
    name: 'Permission Management',
    icon: Shield,
    permissions: ['users.update', 'roles.update'],
    children: [
      {
        name: 'User Permissions',
        href: '/permissions/users',
        icon: UserCheck,
        permission: 'users.update',
      },
      {
        name: 'Role Management',
        href: '/permissions/roles',
        icon: Users,
        permission: 'roles.update',
      },
    ],
  },
  {
    name: 'Inventory Management',
    icon: Package,
    permission: 'inventory.read',
    children: [
      {
        name: 'All Items',
        href: '/inventory',
        icon: List,
        permission: 'inventory.read',
      },

      {
        name: 'Low Stock Alerts',
        href: '/inventory/alerts',
        icon: Archive,
        permission: 'inventory.read',
      },
      {
        name: 'Categories',
        href: '/inventory/categories',
        icon: Tag,
        permission: 'inventory.create',
      },
    ],
  },
  {
    name: 'Event Management',
    icon: Calendar,
    permission: 'events.read',
    children: [
      {
        name: 'All Events',
        href: '/events',
        icon: List,
        permission: 'events.read',
      },

      {
        name: 'Event Templates',
        href: '/events/templates',
        icon: FileText,
        permission: 'events.read',
      },
    ],
  },
  {
    name: 'Booking Management',
    icon: BookOpen,
    permission: 'bookings.read',
    children: [
      {
        name: 'All Bookings',
        href: '/bookings',
        icon: List,
        permission: 'bookings.read',
      },

      {
        name: 'Payment Tracking',
        href: '/payments',
        icon: CreditCard,
        permission: 'payments.read',
      },
    ],
  },
  {
    name: 'Payment Management',
    icon: CreditCard,
    permission: 'payments.read',
    children: [
      {
        name: 'All Payments',
        href: '/payments',
        icon: List,
        permission: 'payments.read',
      },
      {
        name: 'Payment Plans',
        href: '/payments/plans',
        icon: FileText,
        permission: 'payments.read',
      },
      {
        name: 'Refunds',
        href: '/payments/refunds',
        icon: TrendingUp,
        permission: 'payments.refund',
      },
    ],
  },
  {
    name: 'User Management',
    icon: Users,
    permission: 'users.read',
    children: [
      {
        name: 'All Users',
        href: '/users',
        icon: User,
        permission: 'users.read',
      },

      {
        name: 'User Roles',
        href: '/users/roles',
        icon: UserCheck,
        permission: 'users.read',
      },
    ],
  },
  {
    name: 'Role Management',
    icon: Shield,
    permission: 'roles.read',
    children: [
      {
        name: 'All Roles',
        href: '/roles',
        icon: List,
        permission: 'roles.read',
      },

      {
        name: 'Permissions',
        href: '/roles/permissions',
        icon: Shield,
        permission: 'roles.read',
      },
    ],
  },
  {
    name: 'Financial Reports',
    icon: DollarSign,
    permission: 'dashboard.reports',
    children: [
      {
        name: 'Revenue Reports',
        href: '/financial/revenue',
        icon: TrendingUp,
        permission: 'dashboard.reports',
      },
      {
        name: 'Expense Reports',
        href: '/financial/expenses',
        icon: BarChart3,
        permission: 'dashboard.reports',
      },
      {
        name: 'Profit & Loss',
        href: '/financial/profit-loss',
        icon: FileText,
        permission: 'dashboard.reports',
      },
    ],
  },
  {
    name: 'System Settings',
    icon: Settings,
    permission: 'settings.read',
    children: [
      {
        name: 'General Settings',
        href: '/settings',
        icon: Cog,
        permission: 'settings.read',
      },
      {
        name: 'User Profile',
        href: '/settings/profile',
        icon: User,
        permission: 'settings.read',
      },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Fetch menu items from backend
  const { data: menuData, isLoading, error } = useQuery({
    queryKey: ['userMenu'],
    queryFn: () => menuService.getUserMenu(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const navigation = menuData?.menuItems?.map(convertMenuItemToNavigation) || [];


  // Access control is now handled by the backend
  const canAccessMenuItem = (item: NavigationItem): boolean => {
    return item.hasAccess;
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isMenuExpanded = (menuName: string) => {
    return expandedMenus.includes(menuName);
  };

  const isActiveMenu = (item: NavigationItem) => {
    if (item.href) {
      return location.pathname === item.href || location.pathname.startsWith(item.href + '/');
    }
    if (item.children) {
      return item.children.some(child =>
        child.href && (location.pathname === child.href || location.pathname.startsWith(child.href + '/'))
      );
    }
    return false;
  };

  // Auto-expand parent menu when child is active
  useEffect(() => {
    const activeParentMenus: string[] = [];

    navigation.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child =>
          child.href && (location.pathname === child.href || location.pathname.startsWith(child.href + '/'))
        );
        if (hasActiveChild) {
          activeParentMenus.push(item.name);
        }
      }
    });

    if (activeParentMenus.length > 0) {
      setExpandedMenus(prev => {
        const newExpanded = [...prev];
        activeParentMenus.forEach(menu => {
          if (!newExpanded.includes(menu)) {
            newExpanded.push(menu);
          }
        });
        return newExpanded;
      });
    }
  }, [location.pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">EB</span>
              </div>
              <span className="font-semibold text-foreground">Event Booking</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Loading menu...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">EB</span>
              </div>
              <span className="font-semibold text-foreground">Event Booking</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-red-500">Failed to load menu</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
      {/* Desktop Sidebar - Always Visible */}
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <div className="flex items-center space-x-2">
            <img
              src="/src/assets/eventorra.png"
              alt="Eventorra"
              className="h-8 w-auto"
            />
            {/* <span className="font-semibold text-foreground">Eventorra</span> */}
          </div>
          <Button variant="ghost" size="icon" className="sm:hidden">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>



        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {navigation.map((item) => {
            if (!canAccessMenuItem(item)) return null;

            const isActive = isActiveMenu(item);
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = isMenuExpanded(item.name);

            if (hasChildren) {
              // For parent menus, only highlight if a child is active, not the parent itself
              const hasActiveChild = item.children?.some(child =>
                child.href && (location.pathname === child.href || location.pathname.startsWith(child.href + '/'))
              );

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      'group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      hasActiveChild
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <div className="flex items-center">
                      <Icon
                        className={cn(
                          'mr-3 h-5 w-5 flex-shrink-0',
                          hasActiveChild ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      />
                      {item.name}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="ml-6 space-y-1">
                      {item.children?.map((child) => {
                        if (!canAccessMenuItem(child)) return null;

                        const isChildActive = child.href && (
                          location.pathname === child.href ||
                          location.pathname.startsWith(child.href + '/')
                        );
                        const ChildIcon = child.icon;

                        return (
                          <NavLink
                            key={child.name}
                            to={child.href!}
                            className={cn(
                              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                              isChildActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            )}
                          >
                            <ChildIcon
                              className={cn(
                                'mr-3 h-4 w-4 flex-shrink-0',
                                isChildActive ? 'text-primary-foreground' : 'text-muted-foreground'
                              )}
                            />
                            {child.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <NavLink
                  key={item.name}
                  to={item.href!}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}
                  />
                  {item.name}
                </NavLink>
              );
            }
          })}
        </nav>

        {/* User Info */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-secondary-foreground text-sm font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
