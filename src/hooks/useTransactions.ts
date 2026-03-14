import { useCallback, useMemo } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { supabase } from '@/lib/supabase'
import { getMonthDateRange } from '@/lib/utils'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']

export function useTransactions(filters: { type?: string; currentMonthOnly?: boolean; month?: string } = {}) {
  const { user } = useAuth()
  const cacheKey = user
    ? `transactions:${user.id}:${filters.type ?? 'all'}:${filters.currentMonthOnly ? 'current' : 'all'}:${filters.month ?? 'none'}`
    : undefined

  const loadTransactions = useCallback(async () => {
    if (!user) {
      return []
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type as 'expense' | 'income')
    }

    if (filters.currentMonthOnly || filters.month) {
      const baseDate = filters.month ? new Date(`${filters.month}-02`) : new Date()
      const range = getMonthDateRange(baseDate)
      query = query.gte('transaction_date', range.start).lte('transaction_date', range.end)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data ?? []
  }, [filters.currentMonthOnly, filters.month, filters.type, user?.id])

  const { data, error, loading, refreshing, hasLoaded, reload } = useAsyncResource({
    enabled: Boolean(user),
    initialData: [] as Transaction[],
    load: loadTransactions,
    dependencies: [user?.id, filters.type, filters.currentMonthOnly, filters.month],
    cacheKey,
  })

  return useMemo(
    () => ({
      transactions: data,
      error,
      loading,
      refreshing,
      hasLoaded,
      reload,
    }),
    [data, error, hasLoaded, loading, refreshing, reload],
  )
}
