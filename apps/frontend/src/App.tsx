import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { RootState } from './store';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PermissionRoute } from './components/auth/PermissionRoute';
import { AuthInitializer } from './components/auth/AuthInitializer';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyOtpPage } from './pages/auth/VerifyOtpPage';
import { VerificationSuccessPage } from './pages/auth/VerificationSuccessPage';

// Dashboard
import { DashboardPage } from './pages/dashboard/DashboardPage';

// Inventory Pages
import { InventoryListPage } from './pages/inventory/InventoryListPage';
import { InventoryCreatePage } from './pages/inventory/InventoryCreatePage';
import { InventoryEditPage } from './pages/inventory/InventoryEditPage';
import { InventoryDetailPage } from './pages/inventory/InventoryDetailPage';
import { LowStockAlertsPage } from './pages/inventory/LowStockAlertsPage';
import { InventoryCategoriesPage } from './pages/inventory/InventoryCategoriesPage';

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

// Payment Management Pages
import { PaymentListPage } from './pages/payments/PaymentListPage';

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

// Three-Tier Permission System Pages
import { FeaturePackagesPage } from './pages/admin/FeaturePackagesPage';
import { MasterPermissionsPage } from './pages/admin/MasterPermissionsPage';
import { UserPermissionsPage } from './pages/permissions/UserPermissionsPage';
import { RoleManagementPage } from './pages/permissions/RoleManagementPage';

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <AuthInitializer>
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

        <Route
          path="/verify"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <VerifyOtpPage />
            )
          }
        />
        <Route
          path="/verify-otp"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <VerifyOtpPage />
            )
          }
        />
        <Route
          path="/auth/verification-success"
          element={<VerificationSuccessPage />}
        />
        <Route
          path="/auth/verification-error"
          element={<VerificationSuccessPage />}
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
                  <Route path="/inventory" element={
                    <PermissionRoute permission="inventory.read">
                      <InventoryListPage />
                    </PermissionRoute>
                  } />
                  <Route path="/inventory/create" element={
                    <PermissionRoute permission="inventory.create">
                      <InventoryCreatePage />
                    </PermissionRoute>
                  } />
                  <Route path="/inventory/:id" element={
                    <PermissionRoute permission="inventory.read">
                      <InventoryDetailPage />
                    </PermissionRoute>
                  } />
                  <Route path="/inventory/:id/edit" element={
                    <PermissionRoute permission="inventory.update">
                      <InventoryEditPage />
                    </PermissionRoute>
                  } />
                  <Route path="/inventory/alerts" element={
                    <PermissionRoute permission="inventory.read">
                      <LowStockAlertsPage />
                    </PermissionRoute>
                  } />
                  <Route path="/inventory/categories" element={
                    <PermissionRoute permission="inventory.create">
                      <InventoryCategoriesPage />
                    </PermissionRoute>
                  } />

                  {/* Event Routes */}
                  <Route path="/events" element={
                    <PermissionRoute permission="events.read">
                      <EventListPage />
                    </PermissionRoute>
                  } />
                  <Route path="/events/create" element={
                    <PermissionRoute permission="events.create">
                      <EventCreatePage />
                    </PermissionRoute>
                  } />
                  <Route path="/events/:id" element={
                    <PermissionRoute permission="events.read">
                      <EventDetailPage />
                    </PermissionRoute>
                  } />
                  <Route path="/events/:id/edit" element={
                    <PermissionRoute permission="events.update">
                      <EventEditPage />
                    </PermissionRoute>
                  } />

                  {/* Booking Routes */}
                  <Route path="/bookings" element={
                    <PermissionRoute permission="bookings.read">
                      <BookingListPage />
                    </PermissionRoute>
                  } />
                  <Route path="/bookings/create" element={
                    <PermissionRoute permission="bookings.create">
                      <BookingCreatePage />
                    </PermissionRoute>
                  } />
                  <Route path="/bookings/:id" element={
                    <PermissionRoute permission="bookings.read">
                      <BookingDetailPage />
                    </PermissionRoute>
                  } />

                  {/* Organization Management Routes */}
                  <Route path="/organizations" element={
                    <PermissionRoute permission="organizations.read">
                      <OrganizationListPage />
                    </PermissionRoute>
                  } />
                  <Route path="/organizations/create" element={
                    <PermissionRoute permission="organizations.create">
                      <CreateOrganizationPage />
                    </PermissionRoute>
                  } />
                  <Route path="/organizations/:id" element={
                    <PermissionRoute permission="organizations.read">
                      <OrganizationDetailPage />
                    </PermissionRoute>
                  } />
                  <Route path="/organizations/:id/edit" element={
                    <PermissionRoute permission="organizations.update">
                      <EditOrganizationPage />
                    </PermissionRoute>
                  } />

                  {/* User Management Routes */}
                  <Route path="/users" element={
                    <PermissionRoute permission="users.read">
                      <UserListPage />
                    </PermissionRoute>
                  } />
                  <Route path="/users/create" element={
                    <PermissionRoute permission="users.create">
                      <UserCreatePage />
                    </PermissionRoute>
                  } />
                  <Route path="/users/:id/edit" element={
                    <PermissionRoute permission="users.update">
                      <UserEditPage />
                    </PermissionRoute>
                  } />

                  {/* Role Management Routes */}
                  <Route path="/roles" element={
                    <PermissionRoute permission="roles.read">
                      <RoleListPage />
                    </PermissionRoute>
                  } />
                  <Route path="/roles/create" element={
                    <PermissionRoute permission="roles.create">
                      <RoleCreatePage />
                    </PermissionRoute>
                  } />
                  <Route path="/roles/permissions" element={
                    <PermissionRoute permission="roles.read">
                      <RoleListPage />
                    </PermissionRoute>
                  } />

                  {/* User Roles Route */}
                  <Route path="/users/roles" element={
                    <PermissionRoute permission="roles.read">
                      <RoleListPage />
                    </PermissionRoute>
                  } />

                  {/* Payment Management Routes */}
                  <Route path="/payments" element={
                    <PermissionRoute permission="payments.read">
                      <PaymentListPage />
                    </PermissionRoute>
                  } />

                  {/* Financial Reports Routes */}
                  <Route path="/financial" element={
                    <PermissionRoute permission="reports:read">
                      <FinancialReportsPage />
                    </PermissionRoute>
                  } />
                  <Route path="/financial/revenue" element={
                    <PermissionRoute permission="reports:read">
                      <FinancialReportsPage />
                    </PermissionRoute>
                  } />
                  <Route path="/financial/expenses" element={
                    <PermissionRoute permission="reports:read">
                      <FinancialReportsPage />
                    </PermissionRoute>
                  } />
                  <Route path="/financial/profit-loss" element={
                    <PermissionRoute permission="reports:read">
                      <FinancialReportsPage />
                    </PermissionRoute>
                  } />

                  {/* Three-Tier Permission System Routes */}
                  <Route path="/admin/feature-packages" element={
                    <PermissionRoute permission="isProductAdmin">
                      <FeaturePackagesPage />
                    </PermissionRoute>
                  } />
                  <Route path="/admin/organizations" element={
                    <PermissionRoute permission="isProductAdmin">
                      <OrganizationListPage />
                    </PermissionRoute>
                  } />
                  <Route path="/admin/permissions" element={
                    <PermissionRoute permission="isProductAdmin">
                      <MasterPermissionsPage />
                    </PermissionRoute>
                  } />
                  <Route path="/permissions/users" element={
                    <PermissionRoute permission="users.update">
                      <UserPermissionsPage />
                    </PermissionRoute>
                  } />
                  <Route path="/permissions/roles" element={
                    <PermissionRoute permission="roles.read">
                      <RoleManagementPage />
                    </PermissionRoute>
                  } />

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
    </AuthInitializer>
  );
}

export default App;
