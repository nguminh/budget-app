import { useCallback, useMemo } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { supabase } from '@/lib/supabase'
import { normalizeBudgetMonth } from '@/lib/utils'
import type { Database } from '@/types/database'

type Budget = Database['public']['Tables']['budgets']['Row']

export function useBudget(month: string) {
  const { user } = useAuth()
  const cacheKey = user ? `budget:${user.id}:${normalizeBudgetMonth(month)}` : undefined

  const loadBudget = useCallback(async () => {
    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('period_month', normalizeBudgetMonth(month))
      .is('category_id', null)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data ?? null
  }, [month, user?.id])

  const { data, error, loading, refreshing, hasLoaded, reload } = useAsyncResource({
    enabled: Boolean(user),
    initialData: null as Budget | null,
    load: loadBudget,
    dependencies: [user?.id, month],
    cacheKey,
  })

  return useMemo(
    () => ({ budget: data, error, loading, refreshing, hasLoaded, reload }),
    [data, error, hasLoaded, loading, refreshing, reload],
  )
}
