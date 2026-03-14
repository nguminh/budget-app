import { useCallback, useMemo } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

export function useCategories() {
  const { user } = useAuth()
  const cacheKey = user ? `categories:${user.id}` : undefined

  const loadCategories = useCallback(async () => {
    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    return data ?? []
  }, [user?.id])

  const { data, error, loading, refreshing, hasLoaded, reload } = useAsyncResource({
    enabled: Boolean(user),
    initialData: [] as Category[],
    load: loadCategories,
    dependencies: [user?.id],
    cacheKey,
  })

  return useMemo(
    () => ({ categories: data, error, loading, refreshing, hasLoaded, reload }),
    [data, error, hasLoaded, loading, refreshing, reload],
  )
}
