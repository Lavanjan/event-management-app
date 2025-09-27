import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { RootState } from './store';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Dashboard
import { DashboardPage } from './pages/dashboard/DashboardPage';

// Inventory Pages
import { InventoryListPage } from './pages/inventory/InventoryListPage';
import { InventoryCreatePage } from './pages/inventory/InventoryCreatePage';
import { InventoryEditPage } from './pages/inventory/InventoryEditPage';
import { InventoryDetailPage } from './pages/inventory/InventoryDetailPage';

// Event Pages
import { EventListPage } from './pages/events/EventListPage';
import { EventCreatePage } from './pages/events/EventCreatePage';
import { EventEditPage } from './pages/events/EventEditPage';
import { EventDetailPage } from './pages/events/EventDetailPage';

// Booking Pages
import { BookingListPage } from './pages/bookings/BookingListPage';
import { BookingCreatePage } from './pages/bookings/BookingCreatePage';
import { BookingDetailPage } from './pages/bookings/BookingDetailPage';

// User Management Pages
import { UserListPage } from './pages/users/UserListPage';
import { UserCreatePage } from './pages/users/UserCreatePage';
import { UserEditPage } from './pages/users/UserEditPage';

// Role Management Pages
import { RoleListPage } from './pages/roles/RoleListPage';
import { RoleCreatePage } from './pages/roles/RoleCreatePage';

// Financial Pages
import { FinancialReportsPage } from './pages/financial/FinancialReportsPage';

// Settings Pages
import { SettingsPage } from './pages/settings/SettingsPage';
import { ProfilePage } from './pages/settings/ProfilePage';

// Organization Pages
import { OrganizationListPage } from './pages/organizations/OrganizationListPage';
import { CreateOrganizationPage } from './pages/organizations/CreateOrganizationPage';
import { OrganizationDetailPage } from './pages/organizations/OrganizationDetailPage';
import { EditOrganizationPage } from './pages/organizations/EditOrganizationPage';

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  {/* Dashboard */}
                  <Route path="/dashboard" element={<DashboardPage />} />

                  {/* Inventory Routes */}
                  <Route path="/inventory" element={<InventoryListPage />} />
                  <Route path="/inventory/create" element={<InventoryCreatePage />} />
                  <Route path="/inventory/:id" element={<InventoryDetailPage />} />
                  <Route path="/inventory/:id/edit" element={<InventoryEditPage />} />

                  {/* Event Routes */}
                  <Route path="/events" element={<EventListPage />} />
                  <Route path="/events/create" element={<EventCreatePage />} />
                  <Route path="/events/:id" element={<EventDetailPage />} />
                  <Route path="/events/:id/edit" element={<EventEditPage />} />

                  {/* Booking Routes */}
                  <Route path="/bookings" element={<BookingListPage />} />
                  <Route path="/bookings/create" element={<BookingCreatePage />} />
                  <Route path="/bookings/:id" element={<BookingDetailPage />} />

                  {/* Organization Management Routes */}
                  <Route path="/organizations" element={<OrganizationListPage />} />
                  <Route path="/organizations/create" element={<CreateOrganizationPage />} />
                  <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
                  <Route path="/organizations/:id/edit" element={<EditOrganizationPage />} />

                  {/* User Management Routes */}
                  <Route path="/users" element={<UserListPage />} />
                  <Route path="/users/create" element={<UserCreatePage />} />
                  <Route path="/users/:id/edit" element={<UserEditPage />} />

                  {/* Role Management Routes */}
                  <Route path="/roles" element={<RoleListPage />} />
                  <Route path="/roles/create" element={<RoleCreatePage />} />
                  <Route path="/roles/permissions" element={<RoleListPage />} />

                  {/* User Roles Route */}
                  <Route path="/users/roles" element={<RoleListPage />} />

                  {/* Financial Reports Routes */}
                  <Route path="/financial" element={<FinancialReportsPage />} />
                  <Route path="/financial/revenue" element={<FinancialReportsPage />} />
                  <Route path="/financial/expenses" element={<FinancialReportsPage />} />
                  <Route path="/financial/profit-loss" element={<FinancialReportsPage />} />

                  {/* Settings Routes */}
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/settings/profile" element={<ProfilePage />} />

                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
