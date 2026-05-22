import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import './index.css';
import { AppLayout } from './ui/AppLayout';
import { HomePage } from './ui/pages/HomePage';
import { MapWorkspacePage } from './ui/pages/MapWorkspacePage';
import { PlanExplainPage } from './ui/pages/PlanExplainPage';
import { WorkspaceDashboardPage } from './ui/pages/WorkspaceDashboardPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '/map-workspace', element: <MapWorkspacePage /> },
      { path: '/plan-explain', element: <PlanExplainPage /> },
      { path: '/workspace', element: <WorkspaceDashboardPage /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
