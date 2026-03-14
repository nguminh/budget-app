import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { getQueryErrorMessage } from '@/lib/queryErrors'
import { queryKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

export function useCategories() {
  const { user } = useAuth()

  const query = useQuery({
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) {
        return [] as Category[]
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

      return (data ?? []) as Category[]
    },
    queryKey: user ? queryKeys.categories.root(user.id) : (['categories', 'anonymous'] as const),
    staleTime: 10 * 60_000,
  })

  return {
    ...query,
    categories: query.data ?? ([] as Category[]),
    error: query.error ? getQueryErrorMessage(query.error) : null,
  }
}

