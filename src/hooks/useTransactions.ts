import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { getQueryErrorMessage } from '@/lib/queryErrors'
import { queryKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'
import { getMonthDateRange } from '@/lib/utils'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']

export function useTransactions(filters: { type?: string; currentMonthOnly?: boolean; month?: string } = {}) {
  const { user } = useAuth()

  const query = useQuery({
    enabled: Boolean(user),
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      if (!user) {
        return [] as Transaction[]
      }

      let queryBuilder = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('transaction_time', { ascending: false })

      if (filters.type && filters.type !== 'all') {
        queryBuilder = queryBuilder.eq('type', filters.type as 'expense' | 'income')
      }

      if (filters.currentMonthOnly || filters.month) {
        const baseDate = filters.month ? new Date(`${filters.month}-02`) : new Date()
        const range = getMonthDateRange(baseDate)
        queryBuilder = queryBuilder.gte('transaction_date', range.start).lte('transaction_date', range.end)
      }

      const { data, error } = await queryBuilder

      if (error) {
        throw error
      }

      return (data ?? []) as Transaction[]
    },
    queryKey: user ? queryKeys.transactions.list(user.id, filters) : (['transactions', 'anonymous', filters] as const),
    staleTime: 0,
  })

  return {
    ...query,
    error: query.error ? getQueryErrorMessage(query.error) : null,
    transactions: query.data ?? ([] as Transaction[]),
  }
}