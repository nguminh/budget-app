import { act, renderHook } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSaveBudget } from '@/features/budgets/hooks/useBudgetMutations'
import { queryKeys } from '@/lib/queryKeys'
import { createQueryClientWrapper, createTestQueryClient } from '@/test/testQueryClient'

const user = { id: 'user-1' }

const authMock = vi.hoisted(() => ({
  useAuth: vi.fn(() => ({ user })),
}))

const supabaseMock = vi.hoisted(() => ({
  insert: vi.fn(async () => ({ error: null })),
  updateEq: vi.fn(async () => ({ error: null })),
}))

vi.mock('@/features/auth/hooks/useAuth', () => authMock)
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table !== 'budgets') {
        throw new Error(`Unexpected table ${table}`)
      }

      return {
        insert: supabaseMock.insert,
        update: () => ({
          eq: supabaseMock.updateEq,
        }),
      }
    }),
  },
}))

describe('useSaveBudget', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.spyOn(queryClient, 'invalidateQueries')
    supabaseMock.insert.mockClear()
    supabaseMock.updateEq.mockClear()
  })

  it('invalidates budget queries after save', async () => {
    const wrapper = createQueryClientWrapper(queryClient)
    const { result } = renderHook(() => useSaveBudget(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        amount: 1000,
        month: '2026-03',
      })
    })

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.budgets.root(user.id) })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.budgets.month(user.id, '2026-03-01') })
  })
})

