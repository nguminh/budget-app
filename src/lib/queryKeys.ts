import type { QueryKey } from '@tanstack/react-query'

type TransactionsFilterKey = {
  currentMonthOnly?: boolean
  month?: string
  type?: string
}

export const queryKeys = {
  transactions: {
    root: (userId: string) => ['transactions', userId] as const,
    list: (userId: string, filters: TransactionsFilterKey) =>
      [
        'transactions',
        userId,
        filters.type ?? 'all',
        filters.currentMonthOnly ? 'current' : 'all',
        filters.month ?? 'none',
      ] as const satisfies QueryKey,
    detail: (userId: string, transactionId: string) => ['transactions', userId, 'detail', transactionId] as const,
  },
  budgets: {
    root: (userId: string) => ['budgets', userId] as const,
    month: (userId: string, month: string) => ['budgets', userId, month] as const,
  },
  categories: {
    root: (userId: string) => ['categories', userId] as const,
  },
}

