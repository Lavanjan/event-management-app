import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ProductAdminDashboard } from './ProductAdminDashboard';
import { OrganizationAdminDashboard } from './OrganizationAdminDashboard';
import { UserType } from '../../types';

export function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  // Render different dashboards based on user type
  if (user?.userType === UserType.PRODUCT_ADMIN) {
    return <ProductAdminDashboard />;
  }

  if (user?.userType === UserType.ORGANIZATION_ADMIN) {
    return <OrganizationAdminDashboard />;
  }

  // Default dashboard for organization users
  return <OrganizationAdminDashboard />;
}


