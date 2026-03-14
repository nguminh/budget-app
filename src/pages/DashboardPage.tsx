import { lazy, Suspense, useMemo } from 'react'
import { ArrowUpRight, PiggyBank, Receipt, TrendingDown, TrendingUp } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { SummaryCard } from '@/components/shared/SummaryCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardChartFallback } from '@/features/dashboard/components/ExpensesPieChart'
import { useDashboardSummary } from '@/features/dashboard/hooks/useDashboardSummary'
import { getBudgetBucketTracking } from '@/features/budgets/lib/budgetBuckets'
import { useBudget } from '@/hooks/useBudget'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { formatCurrency, formatMonthInput } from '@/lib/utils'

const ExpensesPieChart = lazy(() => import('@/features/dashboard/components/ExpensesPieChart'))

export function DashboardPage() {
  const month = formatMonthInput()
  const { t, i18n } = useAppTranslation()
  const { transactions, error, isError, isFetching, isLoading } = useTransactions({ currentMonthOnly: true })
  const { budget, categoryBudgets } = useBudget(month)
  const { categories, error: categoriesError, isLoading: categoriesLoading } = useCategories()
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'
  const { budgetAmount, expenses, grouped, income, recent, remaining } = useDashboardSummary({
    budget,
    noCategoryLabel: t('common.noCategory'),
    transactions,
  })
  const categoryTracking = useMemo(
    () =>
      getBudgetBucketTracking({ categories, categoryBudgets, transactions })
        .filter((bucket) => bucket.showInDashboard)
        .slice(0, 5),
    [categories, categoryBudgets, transactions],
  )

  if ((isLoading && transactions.length === 0) || categoriesLoading) {
    return <LoadingState label={t('common.loading')} />
  }

  if ((isError && error) || categoriesError) {
    return <ErrorState title={t('dashboard.title')} description={error || categoriesError || t('common.loading')} />
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title={t('dashboard.expenses')} value={formatCurrency(expenses, 'CAD', locale)} description={t('dashboard.subtitle')} icon={TrendingDown} tone="warning" />
        <SummaryCard title={t('dashboard.income')} value={formatCurrency(income, 'CAD', locale)} description={t('dashboard.subtitle')} icon={TrendingUp} tone="success" />
        <SummaryCard title={t('dashboard.remaining')} value={formatCurrency(remaining, 'CAD', locale)} description={budget ? t('dashboard.ofBudget') : t('dashboard.budgetMissing')} icon={PiggyBank} />
        <SummaryCard title={t('dashboard.count')} value={String(transactions.length)} description={isFetching ? t('common.loading') : t('dashboard.subtitle')} icon={Receipt} />
      </section>
      {transactions.length === 0 ? (
        <EmptyState title={t('dashboard.empty')} description={t('dashboard.emptyHint')} />
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <Suspense fallback={<DashboardChartFallback />}>
            <ExpensesPieChart data={grouped} locale={locale} title={t('dashboard.chartTitle')} />
          </Suspense>
          <div className="space-y-6">
            <Card>
              <CardHeader className="space-y-3">
                <CardTitle>{t('dashboard.budgetTitle')}</CardTitle>
                <div className="flex items-end gap-6">
                  <p className="text-2xl font-semibold">{formatCurrency(expenses, 'CAD', locale)}</p>
                  <p className="text-2xl font-semibold text-ink/60">{formatCurrency(remaining, 'CAD', locale)}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {categoryTracking.map((bucket) => {
                  const progress = bucket.budgetAmount > 0 ? Math.min((bucket.spentAmount / bucket.budgetAmount) * 100, 100) : 0

                  return (
                    <div key={bucket.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-foreground">{bucket.label}</p>
                        <p className="font-body text-sm text-ink/60">
                          {formatCurrency(bucket.spentAmount, 'CAD', locale)} / {formatCurrency(bucket.budgetAmount, 'CAD', locale)}
                        </p>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-muted/80" style={{ border: `1px solid ${bucket.color}55` }}>
                        <div className="h-full rounded-full" style={{ backgroundColor: bucket.color, width: `${progress}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.recent')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recent.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{transaction.merchant}</p>
                      <p className="font-body text-sm text-ink/60">{transaction.category_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(Number(transaction.amount), transaction.currency, locale)}</p>
                      <Badge className="mt-1 bg-card"><ArrowUpRight className="mr-1 size-3" />{transaction.type === 'expense' ? t('common.expense') : t('common.income')}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  )
}

export default DashboardPage


