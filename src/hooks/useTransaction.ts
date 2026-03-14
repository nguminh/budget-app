import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { getQueryErrorMessage } from '@/lib/queryErrors'
import { queryKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']

export function useTransaction(transactionId?: string) {
  const { user } = useAuth()

  const query = useQuery({
    enabled: Boolean(user && transactionId),
    queryFn: async () => {
      if (!transactionId) {
        throw new Error('Missing transaction id.')
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle()

      if (error) {
        throw error
      }

      return (data ?? null) as Transaction | null
    },
    queryKey:
      user && transactionId
        ? queryKeys.transactions.detail(user.id, transactionId)
        : (['transactions', 'anonymous', 'detail', transactionId ?? 'missing'] as const),
    staleTime: 60_000,
  })

  return {
    ...query,
    error: query.error ? getQueryErrorMessage(query.error) : null,
    transaction: query.data,
  }
}

