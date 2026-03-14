import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { TransactionForm } from '@/features/transactions/components/TransactionForm'
import { useCategories } from '@/hooks/useCategories'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { supabase } from '@/lib/supabase'

export function NewTransactionPage() {
  const { t } = useAppTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { categories, loading, error } = useCategories()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (values: {
    type: 'expense' | 'income'
    amount: number
    merchant: string
    categoryId: string
    note?: string
    transactionDate: string
  }) => {
    if (!user) {
      return
    }

    const category = categories.find((item) => item.id === values.categoryId)
    if (!category) {
      return
    }

    setSubmitting(true)
    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: values.type,
      amount: values.amount,
      merchant: values.merchant,
      category_id: category.id,
      category_name: category.name,
      note: values.note || null,
      transaction_date: values.transactionDate,
      currency: 'CAD',
      source: 'manual',
    })
    setSubmitting(false)

    if (insertError) {
      toast.error(insertError.message)
      return
    }

    toast.success(t('transactions.successCreate'))
    navigate('/transactions')
  }

  if (loading) {
    return <LoadingState label={t('common.loading')} />
  }

  if (error) {
    return <ErrorState title={t('transactions.createTitle')} description={error} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('transactions.createTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionForm categories={categories} submitting={submitting} submitLabel={t('transactions.save')} onSubmit={handleSubmit} />
      </CardContent>
    </Card>
  )
}

