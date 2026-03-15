type TransactionCategory = {
  id: string
  kind: 'expense' | 'income'
  name: string
}

type ExtractTransactionsRequest = {
  categories: TransactionCategory[]
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

type ImportedTransactionRecord = {
  amount: number
  categoryId?: string
  categoryName?: string
  confidence: 'high' | 'medium' | 'low'
  merchant: string
  note?: string
  transactionDate: string
  transactionTime?: string
  type: 'expense' | 'income'
  warnings: string[]
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
} as const

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: corsHeaders,
    status,
  })
}

function getRequiredEnv(key: string) {
  const value = Deno.env.get(key)?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

function readBearerToken(authorization: string | null) {
  if (!authorization) {
    return null
  }

  const [scheme, token] = authorization.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token.trim()
}

async function getAuthenticatedUser(accessToken: string) {
  const supabaseUrl = getRequiredEnv('SUPABASE_URL')
  const supabaseAnonKey = getRequiredEnv('SUPABASE_ANON_KEY')

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'GET',
  })

  if (!response.ok) {
    const errorText = await response.text()
    return {
      error: errorText || 'Unauthorized.',
      user: null,
    }
  }

  const user = await response.json()
  return {
    error: null,
    user,
  }
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

function validateRequestBody(value: unknown) {
  if (!value || typeof value !== 'object') {
    throw new Error('Request body must be a JSON object.')
  }

  const body = value as Partial<ExtractTransactionsRequest>
  if (!body.fileName || typeof body.fileName !== 'string') {
    throw new Error('fileName is required.')
  }

  if (!body.text || typeof body.text !== 'string') {
    throw new Error('text is required.')
  }

  if (!Array.isArray(body.categories) || body.categories.length === 0) {
    throw new Error('categories must include at least one category.')
  }

  const categories = body.categories.filter((category): category is TransactionCategory => {
    return Boolean(
      category
        && typeof category.id === 'string'
        && typeof category.name === 'string'
        && (category.kind === 'expense' || category.kind === 'income'),
    )
  })

  if (categories.length !== body.categories.length) {
    throw new Error('categories contains invalid entries.')
  }

  const inlineData = body.inlineData && typeof body.inlineData === 'object'
    && typeof body.inlineData.data === 'string'
    && typeof body.inlineData.mimeType === 'string'
    ? body.inlineData
    : undefined

  return {
    categories,
    fileName: body.fileName,
    inlineData,
    text: body.text,
  } satisfies ExtractTransactionsRequest
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    const accessToken = readBearerToken(request.headers.get('Authorization'))
    if (!accessToken) {
      return json({ error: 'Missing Authorization header.' }, 401)
    }

    const { error: authError, user } = await getAuthenticatedUser(accessToken)
    if (authError || !user) {
      return json({ error: authError || 'Unauthorized.' }, 401)
    }

    const body = validateRequestBody(await request.json())
    const apiKey = getRequiredEnv('GEMINI_API_KEY')
    const model = getRequiredEnv('GEMINI_MODEL')
    const categoryGuide = body.categories.map((category) => `${category.kind}: ${category.name} (${category.id})`).join('\n')

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: [
                  `File name: ${body.fileName}`,
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
                  body.text,
                ].join('\n'),
              },
              ...(body.inlineData ? [{ inlineData: body.inlineData }] : []),
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

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text()
      return json({ error: errorBody || 'Gemini could not parse that file.' }, 502)
    }

    const data = await geminiResponse.json() as {
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
      return json({ error: 'Gemini returned an empty response for this file.' }, 502)
    }

    const parsed = JSON.parse(extractJsonPayload(text)) as GeminiResponse
    const transactions = (parsed.transactions ?? []).map(validateTransaction).filter(Boolean) as ImportedTransactionRecord[]

    if (transactions.length === 0) {
      return json({ error: 'No transactions were detected in that file.' }, 422)
    }

    return json({ transactions })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error while extracting transactions.'
    return json({ error: message }, 500)
  }
})
