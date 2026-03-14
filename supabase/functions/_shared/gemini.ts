export type GeminiConfig = {
  apiKey: string
  model: string
  baseUrl: string
}

function readRequiredEnv(key: string) {
  const value = Deno.env.get(key)?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export function getGeminiConfig(): GeminiConfig {
  return {
    apiKey: readRequiredEnv('GEMINI_API_KEY'),
    model: Deno.env.get('GEMINI_MODEL')?.trim() || 'gemini-3.1-flash-lite-preview',
    baseUrl: Deno.env.get('GEMINI_BASE_URL')?.trim() || 'https://generativelanguage.googleapis.com/v1beta',
  }
}

async function readResponseJson(response: Response) {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.error?.message || `Gemini request failed with status ${response.status}`
    throw new Error(message)
  }

  return payload
}

function bytesToBase64(bytes: Uint8Array) {
  let output = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    output += String.fromCharCode(...chunk)
  }

  return btoa(output)
}

export async function requestStructuredJson(params: {
  config: GeminiConfig
  prompt: string
  blob?: Blob
}) {
  const parts: Array<Record<string, unknown>> = [
    {
      text: params.prompt,
    },
  ]

  if (params.blob) {
    const bytes = new Uint8Array(await params.blob.arrayBuffer())

    parts.push({
      inlineData: {
        mimeType: params.blob.type || 'application/octet-stream',
        data: bytesToBase64(bytes),
      },
    })
  }

  const response = await fetch(`${params.config.baseUrl}/models/${params.config.model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': params.config.apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  })

  const payload = await readResponseJson(response)
  const content = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('')
    .trim()

  if (!content) {
    throw new Error('Gemini did not return structured content.')
  }

  return JSON.parse(content) as Record<string, unknown>
}
