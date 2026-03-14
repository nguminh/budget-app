export const AI_TRANSACTION_INGEST_BUCKET = 'transaction-ingestion'

export type TransactionSource = 'manual' | 'receipt' | 'voice'
export type CandidateSource = Exclude<TransactionSource, 'manual'>
export type TransactionKind = 'expense' | 'income'
export type IngestionInputType = 'image' | 'audio'

export type IngestionCategory = {
  id: string
  name: string
  kind: TransactionKind
}

export type TransactionCandidate = {
  source: CandidateSource
  type: TransactionKind
  amount: number
  merchant: string
  transactionDate: string
  categoryId: string
  categoryName: string
  note?: string
  confidence: number
  transcript?: string
  warnings?: string[]
}

export type TransactionIngestionRequest = {
  inputType: IngestionInputType
  filePath: string
  locale: string
  timezone: string
  todayIso: string
  currency: string
  categories: IngestionCategory[]
}

export type TransactionIngestionResponse = {
  items: TransactionCandidate[]
}
