import { createBrowserRouter } from 'react-router-dom';
import Landing from '@/pages/Landing';
import DashboardNew from '@/pages/DashboardNew';
import CalibrationNew from '@/pages/CalibrationNew';
import PracticeNew from '@/pages/PracticeNew';
import AdminContentNew from '@/pages/AdminContentNew';
import SettingsNew from '@/pages/SettingsNew';
import ProfileNew from '@/pages/ProfileNew';
import Courses from '@/pages/Courses';
import AuthPage from '@/components/auth/AuthPage';
import AdminRoute from '@/components/AdminRoute';
import { ExamOnboarding } from '@/components/onboarding/ExamOnboarding';

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/auth', element: <AuthPage /> },
  { path: '/onboarding', element: <ExamOnboarding /> },
  { path: '/dashboard', element: <DashboardNew /> },
  { path: '/courses', element: <Courses /> },
  { path: '/calibration', element: <CalibrationNew /> },
  { path: '/practice', element: <PracticeNew /> },
  { path: '/admin/content', element: <AdminRoute><AdminContentNew /></AdminRoute> },
  { path: '/settings', element: <SettingsNew /> },
  { path: '/profile', element: <ProfileNew /> },
]);
