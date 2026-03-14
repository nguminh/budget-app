import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { LoadingState } from '@/components/shared/LoadingState'

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingState fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children ? <>{children}</> : <Outlet />
}

export function PublicOnlyRoute({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState fullScreen />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

