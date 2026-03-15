import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'

type TransactionPayload = {
  amount: number
  categoryId: string
  categoryName: string
  merchant: string
  note?: string
  transactionDate: string
  transactionTime: string
  type: 'expense' | 'income'
}

function useInvalidateTransactions() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return async (transactionId?: string) => {
    if (!user) {
      return
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root(user.id) })

    if (transactionId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.detail(user.id, transactionId) })
    }
  }
}

export function useCreateTransaction() {
  const { user } = useAuth()
  const invalidateTransactions = useInvalidateTransactions()

  return useMutation({
    mutationFn: async (values: TransactionPayload) => {
      if (!user) {
        throw new Error('You must be signed in to save transactions.')
      }

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: values.type,
        amount: values.amount,
        merchant: values.merchant,
        category_id: values.categoryId,
        category_name: values.categoryName,
        note: values.note || null,
        transaction_date: values.transactionDate,
        transaction_time: values.transactionTime,
        currency: 'CAD',
        source: 'manual',
      })

      if (error) {
        throw error
      }
    },
    onSuccess: async () => {
      await invalidateTransactions()
    },
  })
}

export function useUpdateTransaction(transactionId: string) {
  const invalidateTransactions = useInvalidateTransactions()

  return useMutation({
    mutationFn: async (values: TransactionPayload) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          type: values.type,
          amount: values.amount,
          merchant: values.merchant,
          category_id: values.categoryId,
          category_name: values.categoryName,
          note: values.note || null,
          transaction_date: values.transactionDate,
          transaction_time: values.transactionTime,
        })
        .eq('id', transactionId)

      if (error) {
        throw error
      }
    },
    onSuccess: async () => {
      await invalidateTransactions(transactionId)
    },
  })
}

export function useDeleteTransaction() {
  const invalidateTransactions = useInvalidateTransactions()

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', transactionId)

      if (error) {
        throw error
      }
    },
    onSuccess: async (_data, transactionId) => {
      await invalidateTransactions(transactionId)
    },
  })
}