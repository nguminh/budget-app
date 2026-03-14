import { AI_TRANSACTION_INGEST_BUCKET, type IngestionCategory, type IngestionInputType, type TransactionCandidate, type TransactionIngestionResponse } from '@/shared/transactionIngestion'
import { supabase } from '@/lib/supabase'

const MAX_IMAGE_DIMENSION = 1600
const IMAGE_QUALITY = 0.82

function createObjectPath(userId: string, extension: string) {
  return `${userId}/${crypto.randomUUID()}.${extension}`
}

function getExtensionForMimeType(mimeType: string) {
  if (mimeType.includes('png')) {
    return 'png'
  }

  if (mimeType.includes('webp')) {
    return 'webp'
  }

  if (mimeType.includes('mpeg')) {
    return 'mp3'
  }

  if (mimeType.includes('mp4')) {
    return 'm4a'
  }

  if (mimeType.includes('ogg')) {
    return 'ogg'
  }

  if (mimeType.includes('wav')) {
    return 'wav'
  }

  return 'webm'
}

function getCanvasSize(width: number, height: number) {
  if (Math.max(width, height) <= MAX_IMAGE_DIMENSION) {
    return { width, height }
  }

  if (width >= height) {
    return {
      width: MAX_IMAGE_DIMENSION,
      height: Math.round((height / width) * MAX_IMAGE_DIMENSION),
    }
  }

  return {
    width: Math.round((width / height) * MAX_IMAGE_DIMENSION),
    height: MAX_IMAGE_DIMENSION,
  }
}

async function uploadIngestionObject(path: string, blob: Blob) {
  const { error } = await supabase.storage.from(AI_TRANSACTION_INGEST_BUCKET).upload(path, blob, {
    contentType: blob.type || undefined,
    upsert: false,
  })

  if (error) {
    throw error
  }
}

async function cleanupIngestionObject(path: string) {
  await supabase.storage.from(AI_TRANSACTION_INGEST_BUCKET).remove([path])
}

async function invokeIngestion(payload: {
  inputType: IngestionInputType
  filePath: string
  locale: string
  timezone: string
  todayIso: string
  currency: string
  categories: IngestionCategory[]
}) {
  const { data, error } = await supabase.functions.invoke<TransactionIngestionResponse>('transaction-ingest', {
    body: payload,
  })

  if (error) {
    throw error
  }

  return data?.items ?? []
}

export function getLocalDateIso(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export async function compressImageFile(file: File) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const size = getCanvasSize(bitmap.width, bitmap.height)
  canvas.width = size.width
  canvas.height = size.height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to prepare image upload.')
  }

  context.drawImage(bitmap, 0, 0, size.width, size.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY)
  })

  if (!blob) {
    throw new Error('Unable to compress image.')
  }

  return blob
}

export async function ingestImageFile(params: {
  userId: string
  file: File
  locale: string
  timezone: string
  todayIso: string
  currency: string
  categories: IngestionCategory[]
}) {
  const compressed = await compressImageFile(params.file)
  const objectPath = createObjectPath(params.userId, 'jpg')

  await uploadIngestionObject(objectPath, compressed)

  try {
    return await invokeIngestion({
      inputType: 'image',
      filePath: objectPath,
      locale: params.locale,
      timezone: params.timezone,
      todayIso: params.todayIso,
      currency: params.currency,
      categories: params.categories,
    })
  } finally {
    void cleanupIngestionObject(objectPath)
  }
}

export async function ingestAudioBlob(params: {
  userId: string
  blob: Blob
  locale: string
  timezone: string
  todayIso: string
  currency: string
  categories: IngestionCategory[]
}) {
  const mimeType = params.blob.type || 'audio/webm'
  const objectPath = createObjectPath(params.userId, getExtensionForMimeType(mimeType))

  await uploadIngestionObject(objectPath, params.blob)

  try {
    return await invokeIngestion({
      inputType: 'audio',
      filePath: objectPath,
      locale: params.locale,
      timezone: params.timezone,
      todayIso: params.todayIso,
      currency: params.currency,
      categories: params.categories,
    })
  } finally {
    void cleanupIngestionObject(objectPath)
  }
}

export function getPreferredAudioMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return null
  }

  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? ''
}

export type { TransactionCandidate }
