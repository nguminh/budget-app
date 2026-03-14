import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'
import { normalizeBudgetMonth } from '@/lib/utils'
import type { Database } from '@/types/database'

type Budget = Database['public']['Tables']['budgets']['Row']

type SaveBudgetValues = {
  amount: number
  budgetId?: string
  categoryAllocations: Array<{
    amount: number
    categoryId: string
  }>
  existingCategoryBudgets?: Budget[]
  month: string
}

export function useSaveBudget() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ amount, budgetId, categoryAllocations, existingCategoryBudgets = [], month }: SaveBudgetValues) => {
      if (!user) {
        throw new Error('You must be signed in to save budgets.')
      }

      const normalizedMonth = normalizeBudgetMonth(month)
      const overallBudgetOperation = budgetId
        ? supabase.from('budgets').update({ amount, period_month: normalizedMonth }).eq('id', budgetId)
        : supabase.from('budgets').insert({
            user_id: user.id,
            period_month: normalizedMonth,
            amount,
            currency: 'CAD',
            category_id: null,
          })

      const { error: overallBudgetError } = await overallBudgetOperation

      if (overallBudgetError) {
        throw overallBudgetError
      }

      const submittedAllocations = categoryAllocations.filter((allocation) => allocation.amount > 0)
      const existingCategoryBudgetById = new Map(existingCategoryBudgets.flatMap((budget) => (budget.category_id ? [[budget.category_id, budget]] : [])))
      const budgetsToUpsert = submittedAllocations
        .filter((allocation) => Boolean(existingCategoryBudgetById.get(allocation.categoryId)))
        .map((allocation) => ({
          id: existingCategoryBudgetById.get(allocation.categoryId)?.id,
          user_id: user.id,
          period_month: normalizedMonth,
          amount: allocation.amount,
          currency: 'CAD',
          category_id: allocation.categoryId,
        }))
      const budgetsToInsert = submittedAllocations
        .filter((allocation) => !existingCategoryBudgetById.has(allocation.categoryId))
        .map((allocation) => ({
          user_id: user.id,
          period_month: normalizedMonth,
          amount: allocation.amount,
          currency: 'CAD',
          category_id: allocation.categoryId,
        }))
      const submittedCategoryIds = new Set(submittedAllocations.map((allocation) => allocation.categoryId))
      const budgetIdsToDelete = existingCategoryBudgets
        .filter((budget) => budget.category_id && !submittedCategoryIds.has(budget.category_id))
        .map((budget) => budget.id)

      if (budgetsToUpsert.length > 0) {
        const { error: upsertError } = await supabase.from('budgets').upsert(budgetsToUpsert)

        if (upsertError) {
          throw upsertError
        }
      }

      if (budgetsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('budgets').insert(budgetsToInsert)

        if (insertError) {
          throw insertError
        }
      }

      if (budgetIdsToDelete.length > 0) {
        const { error: deleteError } = await supabase.from('budgets').delete().in('id', budgetIdsToDelete)

        if (deleteError) {
          throw deleteError
        }
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
