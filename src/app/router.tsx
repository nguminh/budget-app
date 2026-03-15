import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import App from '@/App'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/shared/LoadingState'
import { ProtectedRoute, PublicOnlyRoute, RequireCompletedOnboarding } from '@/components/shared/ProtectedRoute'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage'))
const ImportTransactionsPage = lazy(() => import('@/pages/ImportTransactionsPage'))
const NewTransactionPage = lazy(() => import('@/pages/NewTransactionPage'))
const EditTransactionPage = lazy(() => import('@/pages/EditTransactionPage'))
const BudgetsPage = lazy(() => import('@/pages/BudgetsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))

function renderLazyPage(Component: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={<LoadingState label="Loading..." />}>
      <Component />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'login',
        element: (
          <PublicOnlyRoute>
            {renderLazyPage(LoginPage)}
          </PublicOnlyRoute>
        ),
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'onboarding', element: renderLazyPage(OnboardingPage) },
        ],
      },
      {
        element: (
          <ProtectedRoute>
            <RequireCompletedOnboarding>
              <AppShell />
            </RequireCompletedOnboarding>
          </ProtectedRoute>
        ),
        children: [
          { path: 'dashboard', element: renderLazyPage(DashboardPage) },
          { path: 'transactions', element: renderLazyPage(TransactionsPage) },
          { path: 'transactions/import', element: renderLazyPage(ImportTransactionsPage) },
          { path: 'transactions/new', element: renderLazyPage(NewTransactionPage) },
          { path: 'transactions/:id/edit', element: renderLazyPage(EditTransactionPage) },
          { path: 'budgets', element: renderLazyPage(BudgetsPage) },
          { path: 'settings', element: renderLazyPage(SettingsPage) },
        ],
      },
    ],
  },
])
