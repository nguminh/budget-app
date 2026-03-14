import type { Database } from '@/types/database'
import type { TransactionCandidate, TransactionSource } from '@/shared/transactionIngestion'

export type TransactionRow = Database['public']['Tables']['transactions']['Row']
export type TransactionType = Database['public']['Tables']['transactions']['Row']['type']
export type CategoryRecord = Database['public']['Tables']['categories']['Row']

export type TransactionFormValues = {
  type: TransactionType
  amount: number
  merchant: string
  categoryId: string
  note?: string
  transactionDate: string
}

export type { TransactionCandidate, TransactionSource }
