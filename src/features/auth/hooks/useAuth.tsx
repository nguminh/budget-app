import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import i18n from '@/i18n'
import { LANGUAGE_STORAGE_KEY } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

type AuthContextValue = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchProfile(userId: string, user: User | null) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (data) {
    return data
  }

  const fallbackProfile = {
    id: userId,
    full_name: (user?.user_metadata?.full_name as string | undefined) ?? null,
    locale: (window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? 'en') as 'en' | 'fr',
    default_currency: 'CAD',
    plan: 'free' as const,
  }

  const { data: inserted } = await supabase.from('profiles').upsert(fallbackProfile).select('*').maybeSingle()
  return inserted ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      return
    }

    const nextProfile = await fetchProfile(user.id, user)
    setProfile(nextProfile)
  }

  useEffect(() => {
    if (!profile?.locale) {
      return
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, profile.locale)
    void i18n.changeLanguage(profile.locale)
  }, [profile?.locale])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) {
        return
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        setProfile(await fetchProfile(data.session.user.id, data.session.user))
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      if (nextSession?.user) {
        setProfile(await fetchProfile(nextSession.user.id, nextSession.user))
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ user, session, profile, loading, refreshProfile }), [loading, profile, session, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

