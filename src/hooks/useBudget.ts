import { useEffect, useState } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { normalizeBudgetMonth } from '@/lib/utils'
import type { Database } from '@/types/database'

type Budget = Database['public']['Tables']['budgets']['Row']

export function useBudget(month: string) {
  const { user } = useAuth()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBudget = async () => {
    if (!user) {
      setBudget(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error: nextError } = await supabase
      .from('budgets')
      .select('*')
      .eq('period_month', normalizeBudgetMonth(month))
      .is('category_id', null)
      .maybeSingle()

    if (nextError) {
      setError(nextError.message)
      setBudget(null)
    } else {
      setError(null)
      setBudget(data ?? null)
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadBudget()
  }, [user?.id, month])

  return { budget, loading, error, reload: loadBudget }
}

