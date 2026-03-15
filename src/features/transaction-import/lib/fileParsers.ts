import type { ImportedTransactionRecord } from '@/features/transaction-import/types'

const MAX_TEXT_IMPORT_CHARS = 120_000

type PreparedDirectImport = {
  parser: 'direct'
  records: ImportedTransactionRecord[]
}

type PreparedGeminiImport = {
  inlineData?: {
    data: string
    mimeType: string
  }
  parser: 'gemini'
  text: string
}

export type PreparedImportPayload = PreparedDirectImport | PreparedGeminiImport

type ParsedSheet = {
  name: string
  rows: string[][]
}

type ZipEntry = {
  compressedSize: number
  compression: number
  localHeaderOffset: number
  name: string
}

const DIRECT_FIELD_ALIASES: Record<string, string[]> = {
  amount: ['amount'],
  categoryId: ['categoryid', 'category_id'],
  categoryName: ['categoryname', 'category_name', 'category'],
  merchant: ['merchant'],
  note: ['note'],
  transactionDate: ['transactiondate', 'transaction_date', 'date'],
  transactionTime: ['transactiontime', 'transaction_time', 'time'],
  type: ['type'],
}

function normalizeHeader(header: string) {
  return header.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function getCanonicalField(header: string) {
  const normalized = normalizeHeader(header)
  return Object.entries(DIRECT_FIELD_ALIASES).find(([, aliases]) => aliases.includes(normalized))?.[0] ?? null
}

function parseAmount(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : Number.NaN
  }

  if (typeof value !== 'string') {
    return Number.NaN
  }

  const normalized = value.replace(/[$,\s]/g, '')
  const amount = Number.parseFloat(normalized)
  return Number.isFinite(amount) ? amount : Number.NaN
}

function parseType(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (normalized === 'expense' || normalized === 'income') {
    return normalized
  }

  return null
}

function parseExactRecord(record: Record<string, unknown>) {
  const type = parseType(record.type)
  const amount = parseAmount(record.amount)
  const merchant = typeof record.merchant === 'string' ? record.merchant.trim() : ''
  const transactionDate = typeof record.transactionDate === 'string' ? record.transactionDate.trim() : ''
  const transactionTime = typeof record.transactionTime === 'string' ? record.transactionTime.trim() : undefined
  const note = typeof record.note === 'string' ? record.note : undefined
  const categoryName = typeof record.categoryName === 'string' ? record.categoryName.trim() : undefined
  const categoryId = typeof record.categoryId === 'string' ? record.categoryId.trim() : undefined

  if (!type || !Number.isFinite(amount) || !merchant || !transactionDate || (!categoryName && !categoryId)) {
    return null
  }

  return {
    amount,
    categoryId,
    categoryName,
    merchant,
    note,
    transactionDate,
    transactionTime,
    type,
    warnings: ['Parsed directly from exact transaction fields.'],
  } satisfies ImportedTransactionRecord
}

function toExactRecords(records: Array<Record<string, unknown>>) {
  if (!records.length) {
    return null
  }

  const parsed = records.map(parseExactRecord)
  return parsed.every(Boolean) ? (parsed as ImportedTransactionRecord[]) : null
}

function parseCsvRows(text: string) {
  const rows: string[][] = []
  let currentCell = ''
  let currentRow: string[] = []
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (char === '"') {
      const nextChar = text[index + 1]
      if (inQuotes && nextChar === '"') {
        currentCell += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell)
      currentCell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[index + 1] === '\n') {
        index += 1
      }

      currentRow.push(currentCell)
      rows.push(currentRow)
      currentCell = ''
      currentRow = []
      continue
    }

    currentCell += char
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell)
    rows.push(currentRow)
  }

  return rows.filter((row) => row.some((cell) => cell.trim().length > 0))
}

function parseExactCsv(text: string) {
  const rows = parseCsvRows(text)
  if (rows.length < 2) {
    return null
  }

  const headers = rows[0].map(getCanonicalField)
  if (!headers.every(Boolean)) {
    return null
  }

  const records = rows.slice(1).map((row) =>
    headers.reduce<Record<string, unknown>>((accumulator, field, index) => {
      if (field) {
        accumulator[field] = row[index] ?? ''
      }
      return accumulator
    }, {}),
  )

  return toExactRecords(records)
}

function extractJsonRecords(value: unknown): Array<Record<string, unknown>> | null {
  if (Array.isArray(value) && value.every((item) => item && typeof item === 'object')) {
    return value as Array<Record<string, unknown>>
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const container = value as Record<string, unknown>
  const candidates = [container.transactions, container.items, container.data]
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.every((item) => item && typeof item === 'object')) {
      return candidate as Array<Record<string, unknown>>
    }
  }

  return null
}

function parseExactJson(text: string) {
  const parsed = JSON.parse(text)
  const records = extractJsonRecords(parsed)
  return records ? toExactRecords(records) : null
}

function truncateText(value: string) {
  return value.length > MAX_TEXT_IMPORT_CHARS ? `${value.slice(0, MAX_TEXT_IMPORT_CHARS)}\n[truncated]` : value
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function guessMimeType(file: File) {
  if (file.type) {
    return file.type
  }

  const extension = getFileExtension(file.name)
  if (extension === 'csv') return 'text/csv'
  if (extension === 'json') return 'application/json'
  if (extension === 'pdf') return 'application/pdf'
  if (extension === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (extension === 'png') return 'image/png'
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  if (extension === 'webp') return 'image/webp'
  return 'application/octet-stream'
}

async function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }

  return btoa(binary)
}

function readZipEntries(buffer: ArrayBuffer) {
  const view = new DataView(buffer)
  let endOfCentralDirectoryOffset = -1

  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endOfCentralDirectoryOffset = offset
      break
    }
  }

  if (endOfCentralDirectoryOffset === -1) {
    throw new Error('This spreadsheet could not be read.')
  }

  const totalEntries = view.getUint16(endOfCentralDirectoryOffset + 10, true)
  let cursor = view.getUint32(endOfCentralDirectoryOffset + 16, true)
  const entries: ZipEntry[] = []

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) {
      throw new Error('This spreadsheet could not be read.')
    }

    const compression = view.getUint16(cursor + 10, true)
    const compressedSize = view.getUint32(cursor + 20, true)
    const fileNameLength = view.getUint16(cursor + 28, true)
    const extraLength = view.getUint16(cursor + 30, true)
    const commentLength = view.getUint16(cursor + 32, true)
    const localHeaderOffset = view.getUint32(cursor + 42, true)
    const name = new TextDecoder().decode(new Uint8Array(buffer, cursor + 46, fileNameLength))

    entries.push({
      compressedSize,
      compression,
      localHeaderOffset,
      name,
    })

    cursor += 46 + fileNameLength + extraLength + commentLength
  }

  return entries
}

async function extractZipEntryBuffer(buffer: ArrayBuffer, entry: ZipEntry) {
  const view = new DataView(buffer)
  const cursor = entry.localHeaderOffset

  if (view.getUint32(cursor, true) !== 0x04034b50) {
    throw new Error('This spreadsheet could not be read.')
  }

  const fileNameLength = view.getUint16(cursor + 26, true)
  const extraLength = view.getUint16(cursor + 28, true)
  const start = cursor + 30 + fileNameLength + extraLength
  const bytes = new Uint8Array(buffer.slice(start, start + entry.compressedSize))

  if (entry.compression === 0) {
    return bytes
  }

  if (entry.compression === 8) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    const inflated = await new Response(stream).arrayBuffer()
    return new Uint8Array(inflated)
  }

  throw new Error('This spreadsheet uses an unsupported compression format.')
}

function resolveZipPath(basePath: string, relativePath: string) {
  const baseSegments = basePath.split('/').slice(0, -1)
  const relativeSegments = relativePath.split('/')
  const combined = [...baseSegments, ...relativeSegments]
  const resolved: string[] = []

  for (const segment of combined) {
    if (!segment || segment === '.') {
      continue
    }

    if (segment === '..') {
      resolved.pop()
      continue
    }

    resolved.push(segment)
  }

  return resolved.join('/')
}

function parseXmlDocument(xml: string) {
  return new DOMParser().parseFromString(xml, 'application/xml')
}

function getSheetCellValue(cell: Element, sharedStrings: string[]) {
  const type = cell.getAttribute('t')

  if (type === 'inlineStr') {
    return Array.from(cell.getElementsByTagName('t')).map((node) => node.textContent ?? '').join('')
  }

  const raw = cell.getElementsByTagName('v')[0]?.textContent ?? ''
  if (type === 's') {
    return sharedStrings[Number(raw)] ?? ''
  }

  return raw
}

function getColumnIndex(reference: string) {
  const letters = reference.replace(/\d+/g, '')
  let total = 0

  for (let index = 0; index < letters.length; index += 1) {
    total = (total * 26) + (letters.charCodeAt(index) - 64)
  }

  return Math.max(0, total - 1)
}

function parseSheetRows(sheetXml: string, sharedStrings: string[]) {
  const document = parseXmlDocument(sheetXml)
  const rows = Array.from(document.getElementsByTagName('row'))

  return rows.map((row) => {
    const parsedRow: string[] = []
    const cells = Array.from(row.getElementsByTagName('c'))

    for (const cell of cells) {
      const reference = cell.getAttribute('r') ?? 'A1'
      parsedRow[getColumnIndex(reference)] = getSheetCellValue(cell, sharedStrings)
    }

    while (parsedRow.length > 0 && !parsedRow[parsedRow.length - 1]) {
      parsedRow.pop()
    }

    return parsedRow
  }).filter((row) => row.some(Boolean))
}

async function extractWorkbookText(buffer: ArrayBuffer) {
  const decoder = new TextDecoder()
  const entries = readZipEntries(buffer)
  const entryMap = new Map(entries.map((entry) => [entry.name, entry]))

  async function readText(path: string) {
    const entry = entryMap.get(path)
    if (!entry) {
      return ''
    }

    const bytes = await extractZipEntryBuffer(buffer, entry)
    return decoder.decode(bytes)
  }

  const workbookXml = await readText('xl/workbook.xml')
  const workbookRelsXml = await readText('xl/_rels/workbook.xml.rels')
  if (!workbookXml || !workbookRelsXml) {
    throw new Error('This spreadsheet could not be read.')
  }

  const sharedStringsXml = await readText('xl/sharedStrings.xml')
  const sharedStrings = sharedStringsXml
    ? Array.from(parseXmlDocument(sharedStringsXml).getElementsByTagName('si')).map((item) =>
      Array.from(item.getElementsByTagName('t')).map((node) => node.textContent ?? '').join(''),
    )
    : []

  const workbookDocument = parseXmlDocument(workbookXml)
  const relationships = Array.from(parseXmlDocument(workbookRelsXml).getElementsByTagName('Relationship')).reduce<Record<string, string>>(
    (accumulator, relationship) => {
      const id = relationship.getAttribute('Id')
      const target = relationship.getAttribute('Target')
      if (id && target) {
        accumulator[id] = resolveZipPath('xl/workbook.xml', target)
      }
      return accumulator
    },
    {},
  )

  const sheets: ParsedSheet[] = []

  for (const sheet of Array.from(workbookDocument.getElementsByTagName('sheet'))) {
    const relationshipId = sheet.getAttribute('r:id')
    if (!relationshipId) {
      continue
    }

    const path = relationships[relationshipId]
    if (!path) {
      continue
    }

    const xml = await readText(path)
    if (!xml) {
      continue
    }

    sheets.push({
      name: sheet.getAttribute('name') ?? 'Sheet',
      rows: parseSheetRows(xml, sharedStrings),
    })
  }

  if (!sheets.length) {
    throw new Error('This spreadsheet did not contain readable sheets.')
  }

  return truncateText(
    sheets
      .map((sheet) => [`Sheet: ${sheet.name}`, ...sheet.rows.map((row) => row.join('\t'))].join('\n'))
      .join('\n\n'),
  )
}

export async function prepareImportPayload(file: File): Promise<PreparedImportPayload> {
  const mimeType = guessMimeType(file)
  const extension = getFileExtension(file.name)

  if (extension === 'csv' || mimeType === 'text/csv') {
    const text = await file.text()
    const exactRecords = parseExactCsv(text)
    return exactRecords
      ? { parser: 'direct', records: exactRecords }
      : { parser: 'gemini', text: truncateText(text) }
  }

  if (extension === 'json' || mimeType === 'application/json') {
    const text = await file.text()
    const exactRecords = parseExactJson(text)
    return exactRecords
      ? { parser: 'direct', records: exactRecords }
      : { parser: 'gemini', text: truncateText(text) }
  }

  if (extension === 'xlsx' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    const text = await extractWorkbookText(await file.arrayBuffer())
    return {
      parser: 'gemini',
      text,
    }
  }

  if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
    return {
      inlineData: {
        data: await arrayBufferToBase64(await file.arrayBuffer()),
        mimeType,
      },
      parser: 'gemini',
      text: `Parse the uploaded file named "${file.name}".`,
    }
  }

  throw new Error('This file type is not supported yet. Use CSV, JSON, XLSX, PDF, or an image.')
}
