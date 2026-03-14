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
    queryFn: async () => {
      if (!user) {
        return [] as Budget[]
      }

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_month', normalizedMonth)

      if (error) {
        throw error
      }

      return (data ?? []) as Budget[]
    },
    queryKey: user ? queryKeys.budgets.month(user.id, normalizedMonth) : (['budgets', 'anonymous', normalizedMonth] as const),
    staleTime: 60_000,
  })

  const budgets = query.data ?? ([] as Budget[])

  return {
    ...query,
    budget: budgets.find((entry) => entry.category_id === null) ?? null,
    budgets,
    categoryBudgets: budgets.filter((entry) => entry.category_id !== null),
    error: query.error ? getQueryErrorMessage(query.error) : null,
  }
}
