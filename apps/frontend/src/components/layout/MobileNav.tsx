import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Calendar,
  BookOpen,
  Users,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const mobileNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Package,
  },
  {
    name: 'Events',
    href: '/events',
    icon: Calendar,
  },
  {
    name: 'Bookings',
    href: '/bookings',
    icon: BookOpen,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
  },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="mobile-nav">
      <div className="flex justify-around items-center h-16 px-2">
        {mobileNavigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'mobile-nav-item',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
