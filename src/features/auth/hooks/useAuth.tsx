import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import i18n from '@/i18n'
import { LANGUAGE_STORAGE_KEY } from '@/lib/constants'
import { queryClient } from '@/lib/queryClient'
import { supabase, supabaseConfigError } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

type AuthContextValue = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
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

  const { data: inserted } = await supabase.from('profiles').upsert(fallbackProfile as never).select('*').maybeSingle()
  return inserted ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const currentUserIdRef = useRef<string | null>(null)

  const applySession = useCallback((nextSession: Session | null) => {
    const nextUser = nextSession?.user ?? null
    const nextUserId = nextUser?.id ?? null
    const previousUserId = currentUserIdRef.current

    currentUserIdRef.current = nextUserId
    setSession(nextSession)
    setUser(nextUser)
    setLoading(false)

    if (!nextUserId || supabaseConfigError) {
      queryClient.clear()
      setProfile(null)
      setProfileLoading(false)
      return
    }

    if (previousUserId && previousUserId !== nextUserId) {
      queryClient.clear()
      setProfile(null)
    }
  }, [])

  const loadProfile = useCallback(async (nextUser: User | null) => {
    if (!nextUser || supabaseConfigError) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    setProfileLoading(true)

    try {
      const nextProfile = await fetchProfile(nextUser.id, nextUser)
      setProfile(nextProfile)
    } catch {
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    await loadProfile(user)
  }, [loadProfile, user])

  useEffect(() => {
    if (!profile?.locale) {
      return
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, profile.locale)
    void i18n.changeLanguage(profile.locale)
  }, [profile?.locale])

  useEffect(() => {
    void loadProfile(user)
  }, [loadProfile, user])

  useEffect(() => {
    if (supabaseConfigError) {
      setLoading(false)
      return
    }

    let mounted = true

    const bootstrapSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()

        if (!mounted) {
          return
        }

        applySession(data.session)
      } catch {
        if (!mounted) {
          return
        }

        queryClient.clear()
        setSession(null)
        setUser(null)
        setProfile(null)
        setProfileLoading(false)
        setLoading(false)
      }
    }

    void bootstrapSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return
      }

      applySession(nextSession)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [applySession])

  const value = useMemo(
    () => ({ user, session, profile, loading, profileLoading, refreshProfile }),
    [loading, profile, profileLoading, refreshProfile, session, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}