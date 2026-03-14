import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, type RouterProviderProps } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AuthProvider } from '@/features/auth/hooks/useAuth'
import { queryClient } from '@/lib/queryClient'

export function Providers({ router }: { router: RouterProviderProps['router'] }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}

