import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './auth/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Spinner, Center } from '@chakra-ui/react';

// เส้นทางสำหรับผู้ใช้ (User หรือ Admin) และ AdminRoute จาก ProtectedRoute
import { AdminRoute, UserOrAdminRoute, LabStaffOrAdminRoute } from './auth/ProtectedRoute';
// นำเข้าชั้นเพิ่มเติมสำหรับ Admin
import RoleGuard from './auth/RoleGuard';

import LandingPage from './pages/LandingPage'; // หน้า Landing (โหลดทันที)

// Lazy load หน้าอื่น ๆ
const AdminLogin = lazy(() => import('./auth/AdminLogin'));
const Mapping = lazy(() => import('./pages/user/Mapping'));
const MappingDetail = lazy(() => import('./pages/user/Mappingdetail'));
const ReportIssue = lazy(() => import('./pages/user/ReportIssue'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Manage = lazy(() => import('./pages/admin/Manage'));
const Report = lazy(() => import('./pages/admin/Report'));
const AdminIssues = lazy(() => import('./pages/admin/AdminIssues'));
const ServiceDetail = lazy(() => import('./pages/admin/Servicedetail'));
const AppForUser = lazy(() => import('./pages/user/AppForUser'));
const Labupload = lazy(() => import('./pages/admin/Labupload'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const UserLogs = lazy(() => import('./pages/admin/UserLogs'));
const Logout = lazy(() => import('./auth/Logout'));
const LabStaffLogin = lazy(() => import('./auth/LabStaffLogin'));

// สร้าง QueryClient instance สำหรับ React Query พร้อม optimized config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // Data stays fresh for 2 minutes
      gcTime: 1000 * 60 * 10, // Cache garbage collected after 10 minutes
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch when reconnecting
    },
  },
});

// Component fallback เป็น Spinner
function LoadingSpinner() {
  return (
    <Center minH="100vh">
      <Spinner size="xl" color="blue.500" />
    </Center>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
            {/* หน้า Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Admin Login */}
            <Route
              path="/adminlogin"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminLogin />
                </Suspense>
              }
            />

            {/* Lab Staff Login */}
            <Route
              path="/labstafflogin"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <LabStaffLogin />
                </Suspense>
              }
            />

            {/* เส้นทางสำหรับผู้ใช้ (User หรือ Admin) */}
            <Route
              path="/mapping"
              element={
                <UserOrAdminRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Mapping />
                  </Suspense>
                </UserOrAdminRoute>
              }
            />
            <Route
              path="/mappingdetail/:id"
              element={
                <UserOrAdminRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <MappingDetail />
                  </Suspense>
                </UserOrAdminRoute>
              }
            />
            <Route
              path="/reportissue"
              element={
                <UserOrAdminRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <ReportIssue />
                  </Suspense>
                </UserOrAdminRoute>
              }
            />
            <Route
              path="/appforuser"
              element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <AppForUser />
                  </Suspense>
              }
            />
            <Route
              path="/logout"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Logout />
                </Suspense>
              }
            />

            {/* เส้นทางสำหรับ Admin หรือ Lab Staff เท่านั้น */}
            <Route
              path="/dashboard"
              element={
                <LabStaffOrAdminRoute>
                  <RoleGuard>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Dashboard />
                    </Suspense>
                  </RoleGuard>
                </LabStaffOrAdminRoute>
              }
            />
            <Route
              path="/manage"
              element={
                <AdminRoute>
                  <RoleGuard>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Manage />
                    </Suspense>
                  </RoleGuard>
                </AdminRoute>
              }
            />
            <Route
              path="/report"
              element={
                <LabStaffOrAdminRoute>
                  <RoleGuard>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Report />
                    </Suspense>
                  </RoleGuard>
                </LabStaffOrAdminRoute>
              }
            />
            <Route
              path="/adminissues"
              element={
                <AdminRoute>
                  <RoleGuard>
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminIssues />
                    </Suspense>
                  </RoleGuard>
                </AdminRoute>
              }
            />
            <Route
              path="/servicedetail/:id"
              element={
                <LabStaffOrAdminRoute>
                  <RoleGuard>
                    <Suspense fallback={<LoadingSpinner />}>
                      <ServiceDetail />
                    </Suspense>
                  </RoleGuard>
                </LabStaffOrAdminRoute>
              }
            />
            <Route
              path="/labupload"
              element={
                <LabStaffOrAdminRoute>
                  <RoleGuard>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Labupload />
                    </Suspense>
                  </RoleGuard>
                </LabStaffOrAdminRoute>
              }
            />
            <Route
              path="/usermanagement"
              element={
                <AdminRoute>
                  <RoleGuard>
                    <Suspense fallback={<LoadingSpinner />}>
                      <UserManagement />
                    </Suspense>
                  </RoleGuard>
                </AdminRoute>
              }
            />
            <Route
              path="/userlogs"
              element={
                <AdminRoute>
                  <RoleGuard>
                    <Suspense fallback={<LoadingSpinner />}>
                      <UserLogs />
                    </Suspense>
                  </RoleGuard>
                </AdminRoute>
              }
            />
          
            </Routes>
          </Router>
        </QueryClientProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
