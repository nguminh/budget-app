import { describe, expect, it } from 'vitest'

import {
  createBudgetAllocationMap,
  getCategoryAllocationLimit,
  rebalanceAllocationsForTotal,
  setCategoryAllocationAmount,
} from '@/features/budgets/lib/allocations'

const categories = [
  { id: 'groceries', name: 'Groceries' },
  { id: 'transport', name: 'Transport' },
  { id: 'other', name: 'Other' },
]

describe('budget allocation helpers', () => {
  it('routes any unassigned budget into Other', () => {
    const allocations = createBudgetAllocationMap({
      allocations: [{ amount: 220, categoryId: 'groceries' }],
      autoBalanceCategoryId: 'other',
      categories,
      totalAmount: 500,
    })

    expect(allocations).toEqual({
      groceries: 220,
      other: 280,
      transport: 0,
    })
  })

  it('caps an edited category at the remaining available budget', () => {
    const allocations = setCategoryAllocationAmount({
      allocations: {
        groceries: 200,
        other: 300,
        transport: 0,
      },
      autoBalanceCategoryId: 'other',
      amount: 450,
      categoryId: 'transport',
      categories,
      totalAmount: 500,
    })

    expect(allocations).toEqual({
      groceries: 200,
      other: 0,
      transport: 300,
    })
  })

  it('scales manual allocations down proportionally when the total drops below them', () => {
    const allocations = rebalanceAllocationsForTotal({
      allocations: {
        groceries: 350,
        other: 0,
        transport: 250,
      },
      autoBalanceCategoryId: 'other',
      categories,
      totalAmount: 300,
    })

    expect(allocations).toEqual({
      groceries: 175,
      other: 0,
      transport: 125,
    })
  })

  it('computes per-category slider limits from the remaining budget', () => {
    const limit = getCategoryAllocationLimit({
      allocations: {
        groceries: 175,
        other: 200,
        transport: 125,
      },
      autoBalanceCategoryId: 'other',
      categoryId: 'groceries',
      categories,
      totalAmount: 500,
    })

    expect(limit).toBe(375)
  })
})
