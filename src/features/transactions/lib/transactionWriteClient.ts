import { supabase } from '@/lib/supabase'

import type { CategoryRecord, TransactionCandidate, TransactionFormValues, TransactionSource } from '@/features/transactions/lib/transactionTypes'

function normalizeNote(note?: string | null) {
  const trimmed = note?.trim()
  return trimmed ? trimmed : null
}

function findCategory(categories: CategoryRecord[], categoryId: string) {
  return categories.find((item) => item.id === categoryId) ?? null
}

export async function createTransactionFromForm(
  userId: string,
  categories: CategoryRecord[],
  values: TransactionFormValues,
  currency = 'CAD',
) {
  const category = findCategory(categories, values.categoryId)
  if (!category) {
    throw new Error('Invalid category selection.')
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    type: values.type,
    amount: values.amount,
    merchant: values.merchant.trim(),
    category_id: category.id,
    category_name: category.name,
    note: normalizeNote(values.note),
    transaction_date: values.transactionDate,
    currency,
    source: 'manual',
  })

  if (error) {
    throw error
  }
}

export async function createTransactionFromCandidate(userId: string, candidate: TransactionCandidate, currency = 'CAD') {
  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    type: candidate.type,
    amount: candidate.amount,
    merchant: candidate.merchant.trim(),
    category_id: candidate.categoryId,
    category_name: candidate.categoryName,
    note: normalizeNote(candidate.note),
    transaction_date: candidate.transactionDate,
    currency,
    source: candidate.source,
  })

  if (error) {
    throw error
  }
}

export async function updateTransaction(transactionId: string, categories: CategoryRecord[], values: TransactionFormValues) {
  const category = findCategory(categories, values.categoryId)
  if (!category) {
    throw new Error('Invalid category selection.')
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      type: values.type,
      amount: values.amount,
      merchant: values.merchant.trim(),
      category_id: category.id,
      category_name: category.name,
      note: normalizeNote(values.note),
      transaction_date: values.transactionDate,
    })
    .eq('id', transactionId)

  if (error) {
    throw error
  }
}

export async function deleteTransaction(transactionId: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', transactionId)

  if (error) {
    throw error
  }
}

export function getSourceLabelKey(source: TransactionSource) {
  if (source === 'receipt') {
    return 'transactions.ai.sourceReceipt'
  }

  if (source === 'voice') {
    return 'transactions.ai.sourceVoice'
  }

  return 'transactions.ai.sourceManual'
}
