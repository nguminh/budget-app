import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { TransactionForm } from '@/features/transactions/components/TransactionForm'
import { createTransactionFromForm } from '@/features/transactions/lib/transactionWriteClient'
import { useCategories } from '@/hooks/useCategories'
import { useAppTranslation } from '@/hooks/useAppTranslation'

export function NewTransactionPage() {
  const { t } = useAppTranslation()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
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

    setSubmitting(true)

    try {
      await createTransactionFromForm(user.id, categories, values, profile?.default_currency ?? 'CAD')
      toast.success(t('transactions.successCreate'))
      navigate('/transactions')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
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
