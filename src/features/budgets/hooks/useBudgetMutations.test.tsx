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
  deleteIn: vi.fn(async () => ({ error: null })),
  insert: vi.fn(async () => ({ error: null })),
  updateEq: vi.fn(async () => ({ error: null })),
  upsert: vi.fn(async () => ({ error: null })),
}))

vi.mock('@/features/auth/hooks/useAuth', () => authMock)
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table !== 'budgets') {
        throw new Error(`Unexpected table ${table}`)
      }

      return {
        delete: () => ({
          in: supabaseMock.deleteIn,
        }),
        insert: supabaseMock.insert,
        update: () => ({
          eq: supabaseMock.updateEq,
        }),
        upsert: supabaseMock.upsert,
      }
    }),
  },
}))

describe('useSaveBudget', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.spyOn(queryClient, 'invalidateQueries')
    supabaseMock.deleteIn.mockClear()
    supabaseMock.insert.mockClear()
    supabaseMock.updateEq.mockClear()
    supabaseMock.upsert.mockClear()
  })

  it('invalidates budget queries after save', async () => {
    const wrapper = createQueryClientWrapper(queryClient)
    const { result } = renderHook(() => useSaveBudget(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        amount: 1000,
        categoryAllocations: [
          { amount: 250, categoryId: 'groceries' },
          { amount: 750, categoryId: 'other' },
        ],
        month: '2026-03',
      })
    })

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.budgets.root(user.id) })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.budgets.month(user.id, '2026-03-01') })
    expect(supabaseMock.insert).toHaveBeenNthCalledWith(1, {
      amount: 1000,
      category_id: null,
      currency: 'CAD',
      period_month: '2026-03-01',
      user_id: user.id,
    })
    expect(supabaseMock.insert).toHaveBeenNthCalledWith(2, [
      {
        amount: 250,
        category_id: 'groceries',
        currency: 'CAD',
        period_month: '2026-03-01',
        user_id: user.id,
      },
      {
        amount: 750,
        category_id: 'other',
        currency: 'CAD',
        period_month: '2026-03-01',
        user_id: user.id,
      },
    ])
  })

  it('upserts existing category rows and deletes removed ones', async () => {
    const wrapper = createQueryClientWrapper(queryClient)
    const { result } = renderHook(() => useSaveBudget(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        amount: 900,
        budgetId: 'overall-budget',
        categoryAllocations: [
          { amount: 400, categoryId: 'groceries' },
          { amount: 500, categoryId: 'other' },
        ],
        existingCategoryBudgets: [
          {
            amount: 350,
            category_id: 'groceries',
            created_at: '2026-03-01T00:00:00Z',
            currency: 'CAD',
            id: 'budget-groceries',
            period_month: '2026-03-01',
            updated_at: '2026-03-01T00:00:00Z',
            user_id: user.id,
          },
          {
            amount: 200,
            category_id: 'transport',
            created_at: '2026-03-01T00:00:00Z',
            currency: 'CAD',
            id: 'budget-transport',
            period_month: '2026-03-01',
            updated_at: '2026-03-01T00:00:00Z',
            user_id: user.id,
          },
        ],
        month: '2026-03',
      })
    })

    expect(supabaseMock.updateEq).toHaveBeenCalledWith('id', 'overall-budget')
    expect(supabaseMock.upsert).toHaveBeenCalledWith([
      {
        amount: 400,
        category_id: 'groceries',
        currency: 'CAD',
        id: 'budget-groceries',
        period_month: '2026-03-01',
        user_id: user.id,
      },
    ])
    expect(supabaseMock.insert).toHaveBeenCalledWith([
      {
        amount: 500,
        category_id: 'other',
        currency: 'CAD',
        period_month: '2026-03-01',
        user_id: user.id,
      },
    ])
    expect(supabaseMock.deleteIn).toHaveBeenCalledWith('id', ['budget-transport'])
  })
})
