import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'
import { normalizeBudgetMonth } from '@/lib/utils'

type SaveBudgetValues = {
  amount: number
  budgetId?: string
  month: string
}

export function useSaveBudget() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ amount, budgetId, month }: SaveBudgetValues) => {
      if (!user) {
        throw new Error('You must be signed in to save budgets.')
      }

      const normalizedMonth = normalizeBudgetMonth(month)
      const operation = budgetId
        ? supabase.from('budgets').update({ amount, period_month: normalizedMonth }).eq('id', budgetId)
        : supabase.from('budgets').insert({
            user_id: user.id,
            period_month: normalizedMonth,
            amount,
            currency: 'CAD',
            category_id: null,
          })

      const { error } = await operation

      if (error) {
        throw error
      }

      return normalizedMonth
    },
    onSuccess: async (normalizedMonth) => {
      if (!user) {
        return
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.budgets.root(user.id) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.budgets.month(user.id, normalizedMonth) })
    },
  })
}

