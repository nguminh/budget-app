import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionForm } from '@/features/transactions/components/TransactionForm'
import { useDeleteTransaction, useUpdateTransaction } from '@/features/transactions/hooks/useTransactionMutations'
import { useCategories } from '@/hooks/useCategories'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { useTransaction } from '@/hooks/useTransaction'

export function EditTransactionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useAppTranslation()
  const { categories, error: categoriesError, isLoading: categoriesLoading } = useCategories()
  const { transaction, error, isLoading } = useTransaction(id)
  const updateTransaction = useUpdateTransaction(id ?? '')
  const deleteTransaction = useDeleteTransaction()
  const [submitting, setSubmitting] = useState(false)

  if (!id) {
    return <ErrorState title={t('transactions.editTitle')} description="Missing transaction id." />
  }

  const handleSubmit = async (values: {
    type: 'expense' | 'income'
    amount: number
    merchant: string
    categoryId: string
    note?: string
    transactionDate: string
    transactionTime: string
  }) => {
    if (!transaction) {
      return
    }

    const category = categories.find((item) => item.id === values.categoryId)
    if (!category) {
      return
    }

    setSubmitting(true)

    try {
      await updateTransaction.mutateAsync({
        amount: values.amount,
        categoryId: category.id,
        categoryName: category.name,
        merchant: values.merchant,
        note: values.note,
        transactionDate: values.transactionDate,
        transactionTime: values.transactionTime,
        type: values.type,
      })
      toast.success(t('transactions.successUpdate'))
      navigate('/transactions')
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : t('transactions.loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!transaction || !window.confirm(t('transactions.deleteConfirm'))) {
      return
    }

    try {
      await deleteTransaction.mutateAsync(transaction.id)
      toast.success(t('transactions.successDelete'))
      navigate('/transactions')
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : t('transactions.loadError'))
    }
  }

  const showInitialLoading = (isLoading && !transaction) || (categoriesLoading && categories.length === 0)

  if (showInitialLoading) {
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
            transactionTime: transaction.transaction_time?.slice(0, 5) ?? '12:00',
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

export default EditTransactionPage