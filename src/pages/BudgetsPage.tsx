import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BudgetForm } from '@/features/budgets/components/BudgetForm'
import { getBudgetBucketAllocations } from '@/features/budgets/lib/budgetBuckets'
import { useSaveBudget } from '@/features/budgets/hooks/useBudgetMutations'
import { useBudget } from '@/hooks/useBudget'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { formatCurrency, formatMonthInput } from '@/lib/utils'

export function BudgetsPage() {
  const { t, i18n } = useAppTranslation()
  const [month, setMonth] = useState(formatMonthInput())
  const [submitting, setSubmitting] = useState(false)
  const saveBudget = useSaveBudget()
  const { budget, categoryBudgets, error, isError, isFetched, isFetching, isLoading } = useBudget(month)
  const { categories, error: categoriesError, isLoading: categoriesLoading } = useCategories()
  const transactionsQuery = useTransactions({ month })
  const { transactions, isFetched: txFetched, isFetching: txFetching, isLoading: txLoading } = transactionsQuery
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'

  const budgetBuckets = useMemo(
    () => getBudgetBucketAllocations({ categories, categoryBudgets }).filter((bucket) => Boolean(bucket.categoryId)),
    [categories, categoryBudgets],
  )
  const expenses = useMemo(
    () => transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0),
    [transactions],
  )

  const budgetAmount = budget ? Number(budget.amount) : budgetBuckets.reduce((sum, bucket) => sum + bucket.amount, 0)
  const remaining = budgetAmount - expenses
  const progressPercent = budgetAmount > 0 ? Math.min((expenses / budgetAmount) * 100, 100) : 0
  const showInitialLoading = (!isFetched && isLoading) || (!txFetched && txLoading) || categoriesLoading
  const initialValues = useMemo(
    () => ({
      amount: budgetAmount,
      allocations: budgetBuckets.map((bucket) => ({ amount: bucket.amount, categoryId: bucket.categoryId })),
      month,
    }),
    [budgetAmount, budgetBuckets, month],
  )

  const handleSubmit = async (values: { amount: number; allocations: Array<{ amount: number; categoryId: string }>; month: string }) => {
    setSubmitting(true)

    try {
      await saveBudget.mutateAsync({
        amount: values.amount,
        budgetId: budget?.id,
        categoryAllocations: values.allocations,
        existingCategoryBudgets: categoryBudgets,
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

  if ((isError && error) || categoriesError) {
    return <ErrorState title={t('budgets.title')} description={error || categoriesError || t('common.loading')} />
  }

  return (
    <div className="space-y-4">
      {!budget && categoryBudgets.length === 0 ? <EmptyState title={t('budgets.empty')} description={t('dashboard.budgetMissing')} /> : null}
      <Card className="rounded-[20px]">
        <CardHeader className="gap-3 p-4 pb-0 md:p-5 md:pb-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{t('budgets.current')}</CardTitle>
              {isFetching || txFetching ? <p className="mt-1 font-body text-xs uppercase tracking-[0.2em] text-ink/50">{t('common.loading')}</p> : null}
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold">{formatCurrency(remaining, 'CAD', locale)}</p>
              <p className="mt-0.5 font-body text-xs uppercase tracking-[0.18em] text-ink/50">{t('dashboard.budgetLeft')}</p>
            </div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progressPercent}%` }} />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-3 md:p-5 md:pt-4">
          <BudgetForm
            categories={budgetBuckets.map((bucket) => ({ color: bucket.color, id: bucket.categoryId, name: bucket.label }))}
            initialValues={initialValues}
            onMonthChange={setMonth}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default BudgetsPage
