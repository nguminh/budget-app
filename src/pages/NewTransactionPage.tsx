import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionForm } from '@/features/transactions/components/TransactionForm'
import { useCreateTransaction } from '@/features/transactions/hooks/useTransactionMutations'
import { useCategories } from '@/hooks/useCategories'
import { useAppTranslation } from '@/hooks/useAppTranslation'

export function NewTransactionPage() {
  const { t } = useAppTranslation()
  const navigate = useNavigate()
  const { categories, error, isLoading } = useCategories()
  const createTransaction = useCreateTransaction()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (values: {
    type: 'expense' | 'income'
    amount: number
    merchant: string
    categoryId: string
    note?: string
    transactionDate: string
  }) => {
    const category = categories.find((item) => item.id === values.categoryId)
    if (!category) {
      return
    }

    setSubmitting(true)

    try {
      await createTransaction.mutateAsync({
        amount: values.amount,
        categoryId: category.id,
        categoryName: category.name,
        merchant: values.merchant,
        note: values.note,
        transactionDate: values.transactionDate,
        type: values.type,
      })
      toast.success(t('transactions.successCreate'))
      navigate('/transactions')
    } catch (insertError) {
      toast.error(insertError instanceof Error ? insertError.message : t('transactions.loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading && categories.length === 0) {
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

