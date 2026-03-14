import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

function readEnv(key: string) {
  return import.meta.env[key] ?? import.meta.env[String.fromCharCode(0xfeff) + key]
}

const supabaseUrl = readEnv('VITE_SUPABASE_URL')?.trim()
const supabaseAnonKey = readEnv('VITE_SUPABASE_ANON_KEY')?.trim()

function getSupabaseConfigError() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return 'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart Vite.'
  }

  try {
    new URL(supabaseUrl)
    return null
  } catch {
    return `Invalid VITE_SUPABASE_URL: "${supabaseUrl}"`
  }
}

export const supabaseConfigError = getSupabaseConfigError()

export const supabase = createClient<Database>(supabaseUrl ?? 'http://127.0.0.1', supabaseAnonKey ?? 'missing-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})