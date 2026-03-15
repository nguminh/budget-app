import type { ImportedTransactionRecord, TransactionCategory, TransactionImportDraft } from '@/features/transaction-import/types'

function normalizeValue(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s]/g, ' ')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchCategory(categories: TransactionCategory[], record: Pick<ImportedTransactionRecord, 'categoryId' | 'categoryName' | 'type'>) {
  if (record.categoryId) {
    const byId = categories.find((category) => category.id === record.categoryId && category.kind === record.type)
    if (byId) {
      return byId
    }
  }

  if (!record.categoryName) {
    return null
  }

  const normalizedTarget = normalizeValue(record.categoryName)
  if (!normalizedTarget) {
    return null
  }

  const sameType = categories.filter((category) => category.kind === record.type)
  const exact = sameType.find((category) => normalizeValue(category.name) === normalizedTarget)
  if (exact) {
    return exact
  }

  const partialMatches = sameType.filter((category) => {
    const normalizedName = normalizeValue(category.name)
    return normalizedName.includes(normalizedTarget) || normalizedTarget.includes(normalizedName)
  })

  return partialMatches.length === 1 ? partialMatches[0] : null
}

function normalizeDate(value: string) {
  if (!value) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const fromIso = value.match(/^(\d{4}-\d{2}-\d{2})[tT]/)
  if (fromIso) {
    return fromIso[1]
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeTime(value?: string) {
  if (!value) {
    return '12:00'
  }

  const trimmed = value.trim()
  const shortMatch = trimmed.match(/^(\d{2}):(\d{2})(?::\d{2})?$/)
  if (shortMatch) {
    return `${shortMatch[1]}:${shortMatch[2]}`
  }

  const parsed = new Date(`1970-01-01T${trimmed}`)
  if (Number.isNaN(parsed.getTime())) {
    return '12:00'
  }

  return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`
}

export function buildImportDrafts(records: ImportedTransactionRecord[], categories: TransactionCategory[]) {
  return records.map<TransactionImportDraft>((record) => {
    const matchedCategory = matchCategory(categories, record)

    return {
      amount: record.amount,
      categoryId: matchedCategory?.id ?? '',
      confidence: record.confidence ?? 'medium',
      id: crypto.randomUUID(),
      merchant: record.merchant.trim(),
      note: record.note?.trim() ?? '',
      suggestedCategoryName: matchedCategory?.name ?? record.categoryName?.trim() ?? '',
      transactionDate: normalizeDate(record.transactionDate),
      transactionTime: normalizeTime(record.transactionTime),
      type: record.type,
      warnings: record.warnings ?? [],
    }
  })
}
