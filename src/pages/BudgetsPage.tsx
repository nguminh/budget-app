import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { BudgetForm } from '@/features/budgets/components/BudgetForm'
import { useBudget } from '@/hooks/useBudget'
import { useTransactions } from '@/hooks/useTransactions'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { formatCurrency, formatMonthInput, normalizeBudgetMonth } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export function BudgetsPage() {
  const { t, i18n } = useAppTranslation()
  const { user } = useAuth()
  const [month, setMonth] = useState(formatMonthInput())
  const [submitting, setSubmitting] = useState(false)
  const { budget, loading, refreshing, error, reload } = useBudget(month)
  const { transactions, loading: txLoading, refreshing: txRefreshing } = useTransactions({ month })
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'

  const expenses = useMemo(
    () => transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0),
    [transactions],
  )

  const budgetAmount = budget ? Number(budget.amount) : 0
  const remaining = budgetAmount - expenses

  const handleSubmit = async (values: { month: string; amount: number }) => {
    if (!user) {
      return
    }

    setSubmitting(true)
    const normalizedMonth = normalizeBudgetMonth(values.month)

    const operation = budget
      ? supabase.from('budgets').update({ amount: values.amount, period_month: normalizedMonth }).eq('id', budget.id)
      : supabase.from('budgets').insert({
          user_id: user.id,
          period_month: normalizedMonth,
          amount: values.amount,
          currency: 'CAD',
          category_id: null,
        })

    const { error: saveError } = await operation
    setSubmitting(false)

    if (saveError) {
      toast.error(saveError.message)
      return
    }

    setMonth(values.month)
    toast.success(t('budgets.success'))
    void reload()
  }

  if (loading || txLoading) {
    return <LoadingState label={t('common.loading')} />
  }

  if (error) {
    return <ErrorState title={t('budgets.title')} description={error} />
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t('budgets.current')}</CardTitle>
          {refreshing || txRefreshing ? <p className="font-body text-xs uppercase tracking-[0.2em] text-ink/50">{t('common.loading')}</p> : null}
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
