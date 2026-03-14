import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider, useAuth } from '@/features/auth/hooks/useAuth'

const supabaseMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}))

vi.mock('@/i18n', () => ({
  default: {
    changeLanguage: vi.fn(),
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabaseConfigError: null,
  supabase: {
    auth: {
      getSession: supabaseMocks.getSession,
      onAuthStateChange: supabaseMocks.onAuthStateChange,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: null })),
        })),
      })),
    })),
  },
}))

function AuthProbe() {
  const { loading, user } = useAuth()

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user?.id ?? 'none'}</span>
    </div>
  )
}

describe('AuthProvider bootstrap', () => {
  beforeEach(() => {
    supabaseMocks.getSession.mockReset()
    supabaseMocks.onAuthStateChange.mockReset()
    supabaseMocks.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })
  })

  it('clears the loading state when session bootstrap fails', async () => {
    supabaseMocks.getSession.mockRejectedValue(new Error('bootstrap failed'))

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })
})
