import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { getMonthDateRange } from '@/lib/utils'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']

export function useTransactions(filters: { type?: string; currentMonthOnly?: boolean; month?: string } = {}) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTransactions = async () => {
    if (!user) {
      setTransactions([])
      setLoading(false)
      return
    }

    setLoading(true)
    let query = supabase.from('transactions').select('*').order('transaction_date', { ascending: false })

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type as 'expense' | 'income')
    }

    if (filters.currentMonthOnly || filters.month) {
      const baseDate = filters.month ? new Date(`${filters.month}-02`) : new Date()
      const range = getMonthDateRange(baseDate)
      query = query.gte('transaction_date', range.start).lte('transaction_date', range.end)
    }

    const { data, error: nextError } = await query

    if (nextError) {
      setError(nextError.message)
      setTransactions([])
    } else {
      setError(null)
      setTransactions(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadTransactions()
  }, [user?.id, filters.type, filters.currentMonthOnly, filters.month])

  return useMemo(() => ({ transactions, loading, error, reload: loadTransactions }), [error, loading, transactions])
}

