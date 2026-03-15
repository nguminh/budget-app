import type { ImportedTransactionRecord, TransactionCategory } from '@/features/transaction-import/types'
import { supabase } from '@/lib/supabase'

type GeminiInput = {
  fileName: string
  inlineData?: {
    data: string
    mimeType: string
  }
  text: string
}

type ExtractTransactionsResponse = {
  transactions?: ImportedTransactionRecord[]
}

async function getFunctionErrorMessage(error: { message?: string; context?: Response }) {
  const fallbackMessage = error.message || 'Gemini could not parse that file.'

  if (!error.context) {
    return fallbackMessage
  }

  try {
    const payload = await error.context.json() as { error?: string }
    return payload.error || fallbackMessage
  } catch {
    return fallbackMessage
  }
}

export async function extractTransactionsWithGemini(input: GeminiInput, categories: TransactionCategory[]) {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    throw new Error('You need to be signed in to use transaction import.')
  }

  const { data, error } = await supabase.functions.invoke<ExtractTransactionsResponse>('extract-transactions', {
    body: {
      categories,
      fileName: input.fileName,
      inlineData: input.inlineData,
      text: input.text,
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (error) {
    throw new Error(await getFunctionErrorMessage(error))
  }

  if (!data?.transactions?.length) {
    throw new Error('No transactions were detected in that file.')
  }

  return data.transactions
}
