import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'

type ImportPayload = Array<{
  amount: number
  categoryId: string
  categoryName: string
  merchant: string
  note?: string
  transactionDate: string
  transactionTime: string
  type: 'expense' | 'income'
}>

export function useImportTransactionsMutation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transactions: ImportPayload) => {
      if (!user) {
        throw new Error('You must be signed in to import transactions.')
      }

      if (!transactions.length) {
        throw new Error('There are no transactions ready to import.')
      }

      const { error } = await supabase.from('transactions').insert(
        transactions.map((transaction) => ({
          amount: transaction.amount,
          category_id: transaction.categoryId,
          category_name: transaction.categoryName,
          currency: 'CAD',
          merchant: transaction.merchant,
          note: transaction.note || null,
          source: 'manual',
          transaction_date: transaction.transactionDate,
          transaction_time: transaction.transactionTime,
          type: transaction.type,
          user_id: user.id,
        })),
      )

      if (error) {
        throw error
      }
    },
    onSuccess: async () => {
      if (!user) {
        return
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root(user.id) })
    },
  })
}
