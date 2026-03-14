import { RouterProvider, type RouterProviderProps } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AuthProvider } from '@/features/auth/hooks/useAuth'

export function Providers({ router }: { router: RouterProviderProps['router'] }) {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  )
}

