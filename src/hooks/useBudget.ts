import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { getQueryErrorMessage } from '@/lib/queryErrors'
import { queryKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'
import { normalizeBudgetMonth } from '@/lib/utils'
import type { Database } from '@/types/database'

type Budget = Database['public']['Tables']['budgets']['Row']

export function useBudget(month: string) {
  const { user } = useAuth()
  const normalizedMonth = normalizeBudgetMonth(month)

  const query = useQuery({
    enabled: Boolean(user),
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      if (!user) {
        return null as Budget | null
      }

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_month', normalizedMonth)
        .is('category_id', null)
        .maybeSingle()

      if (error) {
        throw error
      }

      return (data ?? null) as Budget | null
    },
    queryKey: user ? queryKeys.budgets.month(user.id, normalizedMonth) : (['budgets', 'anonymous', normalizedMonth] as const),
    staleTime: 60_000,
  })

  return {
    ...query,
    budget: query.data,
    error: query.error ? getQueryErrorMessage(query.error) : null,
  }
}

