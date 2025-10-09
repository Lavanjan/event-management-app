import { Link } from 'react-router-dom';
import { User, Shield, Lock, Package, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useThreeTierPermissions } from '../../hooks/useThreeTierPermissions';

const settingsItems = [
  {
    title: 'User Profile',
    description: 'View your personal information and account details',
    icon: User,
    href: '/settings/profile',
    permission: null, // Available to all users
  },
  {
    title: 'Change Password',
    description: 'Update your account password and security settings',
    icon: Lock,
    href: '/settings/change-password',
    permission: null, // Available to all users
  },
  {
    title: 'Theme Settings',
    description: 'Customize your interface theme and appearance',
    icon: Palette,
    href: '/settings/theme',
    permission: null, // Available to all users
  },
  {
    title: 'License Package',
    description: 'View current package and request upgrades',
    icon: Package,
    href: '/settings/license',
    permission: null, // Available to all users
  },
];

export function SettingsPage() {
  const { hasPermission } = useThreeTierPermissions();

  // Filter items based on permissions
  const availableItems = settingsItems.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={item.href}>
                    Configure
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {availableItems.length === 0 && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Settings Available</h3>
            <p className="text-gray-600">You don't have permission to access any settings.</p>
          </div>
        </div>
      )}
    </div>
  );
}
