import { useMemo } from 'react'

import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Budget = Database['public']['Tables']['budgets']['Row']

export function useDashboardSummary({
  budget,
  noCategoryLabel,
  transactions,
}: {
  budget: Budget | null | undefined
  noCategoryLabel: string
  transactions: Transaction[]
}) {
  return useMemo(() => {
    const summary = transactions.reduce(
      (acc, item) => {
        const amount = Number(item.amount)

        if (item.type === 'income') {
          acc.income += amount
        } else {
          acc.expenses += amount
          const key = item.category_name || noCategoryLabel
          acc.grouped[key] = { name: key, value: (acc.grouped[key]?.value ?? 0) + amount }
        }

        return acc
      },
      {
        expenses: 0,
        grouped: {} as Record<string, { name: string; value: number }>,
        income: 0,
      },
    )

    const budgetAmount = budget ? Number(budget.amount) : 0

    return {
      budgetAmount,
      expenses: summary.expenses,
      grouped: Object.values(summary.grouped),
      income: summary.income,
      recent: transactions.slice(0, 5),
      remaining: budgetAmount - summary.expenses,
    }
  }, [budget, noCategoryLabel, transactions])
}

