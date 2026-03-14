import { act, renderHook } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateTransaction, useDeleteTransaction, useUpdateTransaction } from '@/features/transactions/hooks/useTransactionMutations'
import { queryKeys } from '@/lib/queryKeys'
import { createQueryClientWrapper, createTestQueryClient } from '@/test/testQueryClient'

const user = { id: 'user-1' }

const authMock = vi.hoisted(() => ({
  useAuth: vi.fn(() => ({ user })),
}))

const supabaseMock = vi.hoisted(() => ({
  deleteEq: vi.fn(async () => ({ error: null })),
  insert: vi.fn(async () => ({ error: null })),
  updateEq: vi.fn(async () => ({ error: null })),
}))

vi.mock('@/features/auth/hooks/useAuth', () => authMock)
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table !== 'transactions') {
        throw new Error(`Unexpected table ${table}`)
      }

      return {
        delete: () => ({
          eq: supabaseMock.deleteEq,
        }),
        insert: supabaseMock.insert,
        update: () => ({
          eq: supabaseMock.updateEq,
        }),
      }
    }),
  },
}))

describe('transaction mutations', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.spyOn(queryClient, 'invalidateQueries')
    supabaseMock.deleteEq.mockClear()
    supabaseMock.insert.mockClear()
    supabaseMock.updateEq.mockClear()
  })

  it('invalidates transaction queries after create', async () => {
    const wrapper = createQueryClientWrapper(queryClient)
    const { result } = renderHook(() => useCreateTransaction(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        amount: 50,
        categoryId: 'cat-1',
        categoryName: 'Food',
        merchant: 'Cafe',
        transactionDate: '2026-03-14',
        type: 'expense',
      })
    })

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.transactions.root(user.id) })
  })

  it('invalidates transaction detail and lists after update', async () => {
    const wrapper = createQueryClientWrapper(queryClient)
    const { result } = renderHook(() => useUpdateTransaction('txn-1'), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        amount: 75,
        categoryId: 'cat-2',
        categoryName: 'Bills',
        merchant: 'Hydro',
        transactionDate: '2026-03-14',
        type: 'expense',
      })
    })

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.transactions.root(user.id) })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.transactions.detail(user.id, 'txn-1') })
  })

  it('invalidates transaction queries after delete', async () => {
    const wrapper = createQueryClientWrapper(queryClient)
    const { result } = renderHook(() => useDeleteTransaction(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync('txn-1')
    })

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.transactions.root(user.id) })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.transactions.detail(user.id, 'txn-1') })
  })
})

