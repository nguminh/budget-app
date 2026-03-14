import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTransactions } from '@/hooks/useTransactions'
import { createQueryClientWrapper, createTestQueryClient } from '@/test/testQueryClient'

type TransactionStub = {
  amount: number
  id: string
  transaction_date: string
  type: 'expense' | 'income'
}

const user = { id: 'user-1' }

const authMock = vi.hoisted(() => ({
  useAuth: vi.fn(() => ({ user })),
}))

const supabaseState = vi.hoisted(() => ({
  responses: [] as Array<Promise<TransactionStub[]>>,
}))

vi.mock('@/features/auth/hooks/useAuth', () => authMock)
vi.mock('@/lib/supabase', () => {
  const createBuilder = () => {
    const builder = {
      eq: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      lte: vi.fn(() => builder),
      order: vi.fn(() => builder),
      select: vi.fn(() => builder),
      then: (resolve: (value: unknown) => void, reject?: (reason: unknown) => void) => {
        const nextResponse = supabaseState.responses.shift() ?? Promise.resolve([])
        return nextResponse.then(
          (data) => resolve({ data, error: null }),
          (error) => reject?.(error),
        )
      },
    }

    return builder
  }

  return {
    supabase: {
      from: vi.fn(() => createBuilder()),
    },
  }
})

describe('useTransactions', () => {
  beforeEach(() => {
    supabaseState.responses = []
  })

  it('keeps stale content visible while a filter change refetches', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryClientWrapper(queryClient)

    let resolveAll: ((value: TransactionStub[]) => void) | undefined
    let resolveCurrent: ((value: TransactionStub[]) => void) | undefined

    supabaseState.responses.push(
      new Promise((resolve) => {
        resolveAll = resolve
      }),
    )

    const { result, rerender } = renderHook(
      ({ currentMonthOnly }) => useTransactions({ currentMonthOnly }),
      {
        initialProps: { currentMonthOnly: false },
        wrapper,
      },
    )

    act(() => {
      resolveAll?.([{ amount: 25, id: 'txn-1', transaction_date: '2026-03-01', type: 'expense' }])
    })

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(1)
    })

    supabaseState.responses.push(
      new Promise((resolve) => {
        resolveCurrent = resolve
      }),
    )

    rerender({ currentMonthOnly: true })

    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.isFetching).toBe(true)

    act(() => {
      resolveCurrent?.([])
    })

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(0)
    })
  })
})

