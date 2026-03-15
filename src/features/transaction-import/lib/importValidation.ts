import type { ZodType } from 'zod'

import type { TransactionImportDraft } from '@/features/transaction-import/types'

export function getImportDraftIssues(
  row: TransactionImportDraft,
  schema: ZodType<{
    amount: number
    categoryId: string
    merchant: string
    note?: string
    transactionDate: string
    transactionTime: string
    type: 'expense' | 'income'
  }>,
) {
  const issues = new Set<string>()
  const parsed = schema.safeParse({
    amount: row.amount,
    categoryId: row.categoryId,
    merchant: row.merchant,
    note: row.note,
    transactionDate: row.transactionDate,
    transactionTime: row.transactionTime,
    type: row.type,
  })

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.add(issue.message)
    }
  }

  return Array.from(issues)
}
