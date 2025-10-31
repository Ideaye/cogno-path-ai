import { createBrowserRouter } from 'react-router-dom';
import DashboardNew from '@/pages/DashboardNew';
import CalibrationNew from '@/pages/CalibrationNew';
import PracticeNew from '@/pages/PracticeNew';
import AdminContentNew from '@/pages/AdminContentNew';
import SettingsNew from '@/pages/SettingsNew';

export const router = createBrowserRouter([
  { path: '/', element: <DashboardNew /> },
  { path: '/dashboard', element: <DashboardNew /> },
  { path: '/calibration', element: <CalibrationNew /> },
  { path: '/practice', element: <PracticeNew /> },
  { path: '/admin/content', element: <AdminContentNew /> },
  { path: '/settings', element: <SettingsNew /> },
]);
