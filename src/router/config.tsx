
import type { RouteObject } from 'react-router-dom';

// Main pages
import HomePage from '../pages/home/page';
import VehicleListPage from '../pages/vehicles/list';
import VehicleDetailPage from '../pages/vehicles/detail';
import VehiclePostPage from '../pages/vehicles/post';
import VehicleEditPage from '../pages/vehicles/edit';
import RequirementsListPage from '../pages/requirements/list';
import ContactSupportPage from '../pages/contact-support';
import NotFoundPage from '../pages/NotFound';

// Auth pages
import LoginPage from '../pages/auth/login';
import RegisterPage from '../pages/auth/register';
import AdminLoginPage from '../pages/auth/admin-login';
import ForgotPasswordPage from '../pages/auth/forgot-password';
import ResetPasswordPage from '../pages/auth/reset-password';

// Dashboard pages
import Dashboard from '../pages/dashboard/page';
import AdminDashboard from '../pages/admin/dashboard';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/vehicles',
    element: <VehicleListPage />,
  },
  {
    path: '/vehicles/post',
    element: <VehiclePostPage />,
  },
  {
    path: '/vehicles/edit/:id',
    element: <VehicleEditPage />,
  },
  {
    path: '/vehicles/:id',
    element: <VehicleDetailPage />,
  },
  {
    path: '/requirements',
    element: <RequirementsListPage />,
  },
  {
    path: '/contact-support',
    element: <ContactSupportPage />,
  },
  // Auth routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/admin-login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // Dashboard routes
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/admin/dashboard',
    element: <AdminDashboard />,
  },

  // 404 page
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
