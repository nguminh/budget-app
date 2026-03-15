import type { Database } from '@/types/database'

export type TransactionCategory = Database['public']['Tables']['categories']['Row']

export type ImportConfidence = 'high' | 'medium' | 'low'

export type ImportedTransactionRecord = {
  amount: number
  categoryId?: string
  categoryName?: string
  confidence?: ImportConfidence
  merchant: string
  note?: string
  transactionDate: string
  transactionTime?: string
  type: 'expense' | 'income'
  warnings?: string[]
}

export type TransactionImportDraft = {
  amount: number
  categoryId: string
  confidence: ImportConfidence
  id: string
  merchant: string
  note: string
  suggestedCategoryName: string
  transactionDate: string
  transactionTime: string
  type: 'expense' | 'income'
  warnings: string[]
}

export type TransactionImportResult = {
  fileName: string
  fileType: string
  parser: 'direct' | 'gemini'
  transactions: TransactionImportDraft[]
}
