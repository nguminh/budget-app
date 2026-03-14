import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BudgetForm } from '@/features/budgets/components/BudgetForm'
import { useSaveBudget } from '@/features/budgets/hooks/useBudgetMutations'
import { useBudget } from '@/hooks/useBudget'
import { useTransactions } from '@/hooks/useTransactions'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { formatCurrency, formatMonthInput } from '@/lib/utils'

export function BudgetsPage() {
  const { t, i18n } = useAppTranslation()
  const [month, setMonth] = useState(formatMonthInput())
  const [submitting, setSubmitting] = useState(false)
  const saveBudget = useSaveBudget()
  const { budget, error, isError, isFetched, isFetching, isLoading } = useBudget(month)
  const transactionsQuery = useTransactions({ month })
  const { transactions, isFetched: txFetched, isFetching: txFetching, isLoading: txLoading } = transactionsQuery
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'

  const expenses = useMemo(
    () => transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0),
    [transactions],
  )

  const budgetAmount = budget ? Number(budget.amount) : 0
  const remaining = budgetAmount - expenses
  const showInitialLoading = (!isFetched && isLoading) || (!txFetched && txLoading)

  const handleSubmit = async (values: { month: string; amount: number }) => {
    setSubmitting(true)

    try {
      await saveBudget.mutateAsync({
        amount: values.amount,
        budgetId: budget?.id,
        month: values.month,
      })
      setMonth(values.month)
      toast.success(t('budgets.success'))
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : t('common.loading'))
    } finally {
      setSubmitting(false)
    }
  }

  if (showInitialLoading) {
    return <LoadingState label={t('common.loading')} />
  }

  if (isError && error) {
    return <ErrorState title={t('budgets.title')} description={error} />
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t('budgets.current')}</CardTitle>
          {isFetching || txFetching ? <p className="font-body text-xs uppercase tracking-[0.2em] text-ink/50">{t('common.loading')}</p> : null}
        </CardHeader>
        <CardContent>
          <BudgetForm initialValues={{ month, amount: budget ? Number(budget.amount) : 0 }} submitting={submitting} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
      <div className="space-y-6">
        {!budget ? <EmptyState title={t('budgets.empty')} description={t('dashboard.budgetMissing')} /> : null}
        <Card>
          <CardHeader>
            <CardTitle>{t('budgets.progress')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-accent" style={{ width: `${budgetAmount > 0 ? Math.min((expenses / budgetAmount) * 100, 100) : 0}%` }} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-muted p-4">
                <p className="font-body text-xs uppercase tracking-[0.2em] text-ink/55">{t('budgets.amount')}</p>
                <p className="mt-2 text-xl font-semibold">{formatCurrency(budgetAmount, 'CAD', locale)}</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="font-body text-xs uppercase tracking-[0.2em] text-ink/55">{t('budgets.spent')}</p>
                <p className="mt-2 text-xl font-semibold">{formatCurrency(expenses, 'CAD', locale)}</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="font-body text-xs uppercase tracking-[0.2em] text-ink/55">{t('budgets.remaining')}</p>
                <p className="mt-2 text-xl font-semibold">{formatCurrency(remaining, 'CAD', locale)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

