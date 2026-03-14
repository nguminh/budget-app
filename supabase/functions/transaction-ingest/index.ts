import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

import { AI_TRANSACTION_INGEST_BUCKET, type IngestionCategory, type IngestionInputType, type TransactionCandidate, type TransactionIngestionRequest, type TransactionKind } from '../../../src/shared/transactionIngestion.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getGeminiConfig, requestStructuredJson } from '../_shared/gemini.ts'

type ParsedCandidate = {
  type?: unknown
  amount?: unknown
  merchant?: unknown
  transactionDate?: unknown
  categoryId?: unknown
  categoryName?: unknown
  note?: unknown
  confidence?: unknown
  transcript?: unknown
  warnings?: unknown
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function ensureRequestBody(value: unknown): TransactionIngestionRequest {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid request body.')
  }

  const body = value as Record<string, unknown>
  const categories = Array.isArray(body.categories) ? body.categories : []

  if ((body.inputType !== 'image' && body.inputType !== 'audio') || typeof body.filePath !== 'string') {
    throw new Error('inputType and filePath are required.')
  }

  if (typeof body.locale !== 'string' || typeof body.timezone !== 'string' || typeof body.todayIso !== 'string' || typeof body.currency !== 'string') {
    throw new Error('locale, timezone, todayIso, and currency are required.')
  }

  return {
    inputType: body.inputType,
    filePath: body.filePath,
    locale: body.locale,
    timezone: body.timezone,
    todayIso: body.todayIso,
    currency: body.currency,
    categories: categories
      .filter((item): item is IngestionCategory => Boolean(item && typeof item === 'object'))
      .map((item) => ({
        id: String((item as Record<string, unknown>).id ?? ''),
        name: String((item as Record<string, unknown>).name ?? ''),
        kind: ((item as Record<string, unknown>).kind === 'income' ? 'income' : 'expense') as TransactionKind,
      }))
      .filter((item) => item.id && item.name),
  }
}

function normalizeAmount(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(/[^\d.-]/g, ''))
    if (Number.isFinite(normalized)) {
      return normalized
    }
  }

  return 0
}

function normalizeConfidence(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(1, Math.max(0, value))
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      if (parsed > 1) {
        return Math.min(1, Math.max(0, parsed / 100))
      }

      return Math.min(1, Math.max(0, parsed))
    }
  }

  return 0.55
}

function normalizeWarnings(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[]
  }

  return value.map((entry) => String(entry)).filter(Boolean)
}

function normalizeTransactionDate(value: unknown, todayIso: string) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  return todayIso
}

function normalizeType(value: unknown): TransactionKind {
  return value === 'income' ? 'income' : 'expense'
}

function findFallbackCategory(categories: IngestionCategory[], type: TransactionKind) {
  return categories.find((item) => item.kind === type && item.name.toLowerCase() === 'other')
    ?? categories.find((item) => item.kind === type)
    ?? categories[0]
}

function resolveCategory(parsed: ParsedCandidate, categories: IngestionCategory[], type: TransactionKind, confidence: number) {
  const byId = categories.find((item) => item.id === String(parsed.categoryId ?? '') && item.kind === type)
  const byName = categories.find((item) => item.kind === type && item.name.toLowerCase() === String(parsed.categoryName ?? '').trim().toLowerCase())
  const fallback = findFallbackCategory(categories, type)

  if (confidence < 0.45) {
    return fallback
  }

  return byId ?? byName ?? fallback
}

function buildPrompt(params: {
  inputType: IngestionInputType
  categories: IngestionCategory[]
  locale: string
  timezone: string
  todayIso: string
  currency: string
}) {
  const instructions = [
    `User locale: ${params.locale}`,
    `User timezone: ${params.timezone}`,
    `Today's date for this user is ${params.todayIso}`,
    `Default currency: ${params.currency}`,
    'Extract a single transaction candidate.',
    'Return only a JSON object with keys: type, amount, merchant, transactionDate, categoryId, categoryName, note, confidence, transcript, warnings.',
    'type must be expense or income.',
    'amount must be a positive number.',
    'transactionDate must be YYYY-MM-DD and resolve relative dates like today or yesterday against the provided date and timezone.',
    'Use categoryId and categoryName from this category list when possible.',
    'confidence must be between 0 and 1.',
    'warnings must be an array of strings for uncertainty or missing details.',
    'For audio input, transcript must be the cleaned spoken content. For image input, transcript should be omitted or an empty string.',
    `Available categories: ${JSON.stringify(params.categories)}`,
  ]

  if (params.inputType === 'audio') {
    instructions.push('The attached file is an audio recording describing a single consumer finance transaction. Parse it directly and include transcript.')
  } else {
    instructions.push('The attached file is a receipt or purchase image. Infer a single transaction from it.')
  }

  return instructions.join('\n')
}

function normalizeCandidate(params: {
  parsed: ParsedCandidate
  request: TransactionIngestionRequest
}): TransactionCandidate {
  const type = normalizeType(params.parsed.type)
  const confidence = normalizeConfidence(params.parsed.confidence)
  const category = resolveCategory(params.parsed, params.request.categories, type, confidence)
  const merchant = typeof params.parsed.merchant === 'string' ? params.parsed.merchant.trim() : ''
  const amount = Math.abs(normalizeAmount(params.parsed.amount))
  const warnings = normalizeWarnings(params.parsed.warnings)
  const transcript = typeof params.parsed.transcript === 'string' ? params.parsed.transcript.trim() : undefined

  if (!category) {
    throw new Error('No categories are available for AI ingestion.')
  }

  if (!merchant || amount <= 0) {
    throw new Error('Unable to extract a valid transaction from this input.')
  }

  const note = typeof params.parsed.note === 'string' ? params.parsed.note.trim().slice(0, 280) : undefined

  return {
    source: params.request.inputType === 'audio' ? 'voice' : 'receipt',
    type,
    amount: Number(amount.toFixed(2)),
    merchant,
    transactionDate: normalizeTransactionDate(params.parsed.transactionDate, params.request.todayIso),
    categoryId: category.id,
    categoryName: category.name,
    note: note || undefined,
    confidence,
    transcript: transcript || undefined,
    warnings,
  }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim()
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
    const authHeader = request.headers.get('Authorization')

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      throw new Error('Supabase function environment is not configured.')
    }

    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header.' }, 401)
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser()

    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized.' }, 401)
    }

    const body = ensureRequestBody(await request.json())

    if (!body.filePath.startsWith(`${user.id}/`)) {
      return jsonResponse({ error: 'Forbidden file path.' }, 403)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: blob, error: downloadError } = await adminClient.storage.from(AI_TRANSACTION_INGEST_BUCKET).download(body.filePath)

    if (downloadError || !blob) {
      throw new Error(downloadError?.message || 'Unable to download ingestion file.')
    }

    const config = getGeminiConfig()
    const parsed = await requestStructuredJson({
      config,
      prompt: buildPrompt({
        inputType: body.inputType,
        categories: body.categories,
        locale: body.locale,
        timezone: body.timezone,
        todayIso: body.todayIso,
        currency: body.currency,
      }),
      blob,
    })

    const item = normalizeCandidate({
      parsed,
      request: body,
    })

    return jsonResponse({ items: [item] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ingestion error.'
    return jsonResponse({ error: message }, 400)
  }
})
