import type { ImportedTransactionRecord, TransactionCategory } from '@/features/transaction-import/types'

type GeminiInput = {
  fileName: string
  inlineData?: {
    data: string
    mimeType: string
  }
  text: string
}

type GeminiResponse = {
  transactions?: Array<{
    amount?: number
    categoryId?: string
    categoryName?: string
    confidence?: 'high' | 'medium' | 'low'
    merchant?: string
    note?: string
    transactionDate?: string
    transactionTime?: string
    type?: 'expense' | 'income'
    warnings?: string[]
  }>
}

const env = import.meta.env as ImportMetaEnv

function readGeminiEnv(key: 'GEMINI_API_KEY' | 'GEMINI_MODEL') {
  if (key === 'GEMINI_API_KEY') {
    return env.GEMINI_API_KEY ?? env.VITE_GEMINI_API_KEY
  }

  return env.GEMINI_MODEL ?? env.VITE_GEMINI_MODEL
}

function extractJsonPayload(value: string) {
  const fencedMatch = value.match(/```json\s*([\s\S]*?)```/i)
  return fencedMatch ? fencedMatch[1].trim() : value.trim()
}

function validateTransaction(record: GeminiResponse['transactions'][number]) {
  if (!record) {
    return null
  }

  if (record.type !== 'expense' && record.type !== 'income') {
    return null
  }

  if (!record.merchant || typeof record.merchant !== 'string') {
    return null
  }

  if (typeof record.amount !== 'number' || !Number.isFinite(record.amount)) {
    return null
  }

  if (!record.transactionDate || typeof record.transactionDate !== 'string') {
    return null
  }

  return {
    amount: record.amount,
    categoryId: typeof record.categoryId === 'string' ? record.categoryId : undefined,
    categoryName: typeof record.categoryName === 'string' ? record.categoryName : undefined,
    confidence: record.confidence ?? 'medium',
    merchant: record.merchant,
    note: typeof record.note === 'string' ? record.note : undefined,
    transactionDate: record.transactionDate,
    transactionTime: typeof record.transactionTime === 'string' ? record.transactionTime : undefined,
    type: record.type,
    warnings: Array.isArray(record.warnings) ? record.warnings.filter((warning): warning is string => typeof warning === 'string') : [],
  } satisfies ImportedTransactionRecord
}

export async function extractTransactionsWithGemini(input: GeminiInput, categories: TransactionCategory[]) {
  const apiKey = readGeminiEnv('GEMINI_API_KEY')?.trim()
  const model = readGeminiEnv('GEMINI_MODEL')?.trim()

  if (!apiKey || !model) {
    throw new Error('Gemini is not configured. Add GEMINI_API_KEY and GEMINI_MODEL to your environment and restart Vite.')
  }

  const categoryGuide = categories.map((category) => `${category.kind}: ${category.name} (${category.id})`).join('\n')
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: [
                `File name: ${input.fileName}`,
                'Extract every transaction you can identify from the provided content.',
                'Return JSON only with this shape: {"transactions":[{"type":"expense"|"income","amount":number,"merchant":string,"categoryName":string,"categoryId":string,"note":string,"transactionDate":"YYYY-MM-DD","transactionTime":"HH:MM","confidence":"high"|"medium"|"low","warnings":["..."]}]}',
                'Rules:',
                '- Never invent transactions not supported by the file.',
                '- Amounts must be positive numbers without currency symbols.',
                '- Use YYYY-MM-DD dates and HH:MM 24-hour times. If time is missing, use 12:00.',
                '- Choose a category from the allowed list when possible. Prefer the exact category name and id from the list.',
                '- If a field is uncertain, still include the transaction and explain the uncertainty in warnings.',
                '- Merchant values should stay concise and human-readable.',
                'Allowed categories:',
                categoryGuide,
                '',
                'Content to parse:',
                input.text,
              ].join('\n'),
            },
            ...(input.inlineData ? [{ inlineData: input.inlineData }] : []),
          ],
          role: 'user',
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Gemini could not parse that file.')
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string
        }>
      }
    }>
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()
  if (!text) {
    throw new Error('Gemini returned an empty response for this file.')
  }

  const parsed = JSON.parse(extractJsonPayload(text)) as GeminiResponse
  const transactions = (parsed.transactions ?? []).map(validateTransaction).filter(Boolean) as ImportedTransactionRecord[]

  if (!transactions.length) {
    throw new Error('No transactions were detected in that file.')
  }

  return transactions
}
