import { describe, expect, it } from 'vitest'

import { getBudgetBucketTracking } from '@/features/budgets/lib/budgetBuckets'

const categories = [
  {
    color: '#ef4444',
    created_at: '2026-03-01T00:00:00Z',
    id: 'bills-id',
    is_default: true,
    kind: 'expense' as const,
    name: 'Bills',
    updated_at: '2026-03-01T00:00:00Z',
    user_id: null,
  },
  {
    color: '#eab308',
    created_at: '2026-03-01T00:00:00Z',
    id: 'entertainment-id',
    is_default: true,
    kind: 'expense' as const,
    name: 'Entertainment',
    updated_at: '2026-03-01T00:00:00Z',
    user_id: null,
  },
  {
    color: '#14b8a6',
    created_at: '2026-03-01T00:00:00Z',
    id: 'health-id',
    is_default: true,
    kind: 'expense' as const,
    name: 'Health',
    updated_at: '2026-03-01T00:00:00Z',
    user_id: null,
  },
  {
    color: '#22c55e',
    created_at: '2026-03-01T00:00:00Z',
    id: 'groceries-id',
    is_default: true,
    kind: 'expense' as const,
    name: 'Groceries',
    updated_at: '2026-03-01T00:00:00Z',
    user_id: null,
  },
  {
    color: '#6b7280',
    created_at: '2026-03-01T00:00:00Z',
    id: 'other-id',
    is_default: true,
    kind: 'expense' as const,
    name: 'Other',
    updated_at: '2026-03-01T00:00:00Z',
    user_id: null,
  },
  {
    color: '#3b82f6',
    created_at: '2026-03-01T00:00:00Z',
    id: 'transport-id',
    is_default: true,
    kind: 'expense' as const,
    name: 'Transport',
    updated_at: '2026-03-01T00:00:00Z',
    user_id: null,
  },
]

describe('budget bucket tracking', () => {
  it('maps stored budget rows and raw expense categories into runtime budget buckets', () => {
    const tracking = getBudgetBucketTracking({
      categories,
      categoryBudgets: [
        { amount: 400, category_id: 'bills-id', created_at: '', currency: 'CAD', id: '1', period_month: '2026-03-01', updated_at: '', user_id: 'user-1' },
        { amount: 300, category_id: 'entertainment-id', created_at: '', currency: 'CAD', id: '2', period_month: '2026-03-01', updated_at: '', user_id: 'user-1' },
        { amount: 120, category_id: 'health-id', created_at: '', currency: 'CAD', id: '3', period_month: '2026-03-01', updated_at: '', user_id: 'user-1' },
        { amount: 250, category_id: 'groceries-id', created_at: '', currency: 'CAD', id: '4', period_month: '2026-03-01', updated_at: '', user_id: 'user-1' },
        { amount: 180, category_id: 'transport-id', created_at: '', currency: 'CAD', id: '5', period_month: '2026-03-01', updated_at: '', user_id: 'user-1' },
        { amount: 90, category_id: 'other-id', created_at: '', currency: 'CAD', id: '6', period_month: '2026-03-01', updated_at: '', user_id: 'user-1' },
      ],
      transactions: [
        { amount: 80, category_id: null, category_name: 'Dining', created_at: '', currency: 'CAD', id: 'tx-1', merchant: 'Cafe', note: null, source: 'manual', transaction_date: '2026-03-12', type: 'expense', updated_at: '', user_id: 'user-1' },
        { amount: 60, category_id: null, category_name: 'Shopping', created_at: '', currency: 'CAD', id: 'tx-2', merchant: 'Store', note: null, source: 'manual', transaction_date: '2026-03-13', type: 'expense', updated_at: '', user_id: 'user-1' },
        { amount: 45, category_id: null, category_name: 'Health', created_at: '', currency: 'CAD', id: 'tx-3', merchant: 'Clinic', note: null, source: 'manual', transaction_date: '2026-03-14', type: 'expense', updated_at: '', user_id: 'user-1' },
        { amount: 110, category_id: null, category_name: 'Transport', created_at: '', currency: 'CAD', id: 'tx-4', merchant: 'Transit', note: null, source: 'manual', transaction_date: '2026-03-15', type: 'expense', updated_at: '', user_id: 'user-1' },
      ],
    })

    expect(tracking.find((bucket) => bucket.key === 'leisure')).toMatchObject({
      budgetAmount: 300,
      spentAmount: 140,
    })
    expect(tracking.find((bucket) => bucket.key === 'other')).toMatchObject({
      budgetAmount: 90,
      spentAmount: 45,
    })
    expect(tracking.find((bucket) => bucket.key === 'travel')).toMatchObject({
      budgetAmount: 180,
      spentAmount: 110,
    })
  })
})
