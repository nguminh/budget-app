import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import App from '@/App'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/shared/LoadingState'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/shared/ProtectedRoute'

const DashboardPage = lazy(async () => ({ default: (await import('@/pages/DashboardPage')).DashboardPage }))
const TransactionsPage = lazy(async () => ({ default: (await import('@/pages/TransactionsPage')).TransactionsPage }))
const NewTransactionPage = lazy(async () => ({ default: (await import('@/pages/NewTransactionPage')).NewTransactionPage }))
const EditTransactionPage = lazy(async () => ({ default: (await import('@/pages/EditTransactionPage')).EditTransactionPage }))
const BudgetsPage = lazy(async () => ({ default: (await import('@/pages/BudgetsPage')).BudgetsPage }))
const SettingsPage = lazy(async () => ({ default: (await import('@/pages/SettingsPage')).SettingsPage }))
const LoginPage = lazy(async () => ({ default: (await import('@/pages/LoginPage')).LoginPage }))

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
        element: (
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        ),
        children: [
          { path: 'dashboard', element: renderLazyPage(DashboardPage) },
          { path: 'transactions', element: renderLazyPage(TransactionsPage) },
          { path: 'transactions/new', element: renderLazyPage(NewTransactionPage) },
          { path: 'transactions/:id/edit', element: renderLazyPage(EditTransactionPage) },
          { path: 'budgets', element: renderLazyPage(BudgetsPage) },
          { path: 'settings', element: renderLazyPage(SettingsPage) },
        ],
      },
    ],
  },
])

