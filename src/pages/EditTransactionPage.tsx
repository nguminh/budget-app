import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionForm } from '@/features/transactions/components/TransactionForm'
import { useCategories } from '@/hooks/useCategories'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']

export function EditTransactionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useAppTranslation()
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadTransaction() {
      if (!id) {
        setError('Missing transaction id.')
        setLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase.from('transactions').select('*').eq('id', id).maybeSingle()

        if (!active) {
          return
        }

        if (fetchError) {
          setError(fetchError.message)
          return
        }

        setError(null)
        setTransaction(data ?? null)
      } catch (nextError) {
        if (!active) {
          return
        }

        setError(nextError instanceof Error ? nextError.message : 'Unable to load this transaction right now.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadTransaction()

    return () => {
      active = false
    }
  }, [id])

  const handleSubmit = async (values: {
    type: 'expense' | 'income'
    amount: number
    merchant: string
    categoryId: string
    note?: string
    transactionDate: string
  }) => {
    if (!transaction) {
      return
    }

    const category = categories.find((item) => item.id === values.categoryId)
    if (!category) {
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        type: values.type,
        amount: values.amount,
        merchant: values.merchant,
        category_id: category.id,
        category_name: category.name,
        note: values.note || null,
        transaction_date: values.transactionDate,
      })
      .eq('id', transaction.id)
    setSubmitting(false)

    if (updateError) {
      toast.error(updateError.message)
      return
    }

    toast.success(t('transactions.successUpdate'))
    navigate('/transactions')
  }

  const handleDelete = async () => {
    if (!transaction || !window.confirm(t('transactions.deleteConfirm'))) {
      return
    }

    const { error: deleteError } = await supabase.from('transactions').delete().eq('id', transaction.id)
    if (deleteError) {
      toast.error(deleteError.message)
      return
    }

    toast.success(t('transactions.successDelete'))
    navigate('/transactions')
  }

  if (loading || categoriesLoading) {
    return <LoadingState label={t('common.loading')} />
  }

  if (error || categoriesError || !transaction) {
    return <ErrorState title={t('transactions.editTitle')} description={error || categoriesError || 'Transaction not found.'} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('transactions.editTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionForm
          categories={categories}
          initialValues={{
            type: transaction.type,
            amount: Number(transaction.amount),
            merchant: transaction.merchant,
            categoryId: transaction.category_id ?? '',
            note: transaction.note ?? '',
            transactionDate: transaction.transaction_date,
          }}
          submitting={submitting}
          submitLabel={t('transactions.save')}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      </CardContent>
    </Card>
  )
}
