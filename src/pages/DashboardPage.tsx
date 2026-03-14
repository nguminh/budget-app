import { lazy, Suspense } from 'react'
import { ArrowUpRight, PiggyBank, Receipt, TrendingDown, TrendingUp } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { SummaryCard } from '@/components/shared/SummaryCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardChartFallback } from '@/features/dashboard/components/ExpensesPieChart'
import { useDashboardSummary } from '@/features/dashboard/hooks/useDashboardSummary'
import { useBudget } from '@/hooks/useBudget'
import { useTransactions } from '@/hooks/useTransactions'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { formatCurrency, formatMonthInput } from '@/lib/utils'

const ExpensesPieChart = lazy(async () => ({ default: (await import('@/features/dashboard/components/ExpensesPieChart')).ExpensesPieChart }))

export function DashboardPage() {
  const month = formatMonthInput()
  const { t, i18n } = useAppTranslation()
  const { transactions, error, isError, isFetching, isLoading } = useTransactions({ currentMonthOnly: true })
  const { budget } = useBudget(month)
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'
  const { budgetAmount, expenses, grouped, income, recent, remaining } = useDashboardSummary({
    budget,
    noCategoryLabel: t('common.noCategory'),
    transactions,
  })

  if (isLoading && transactions.length === 0) {
    return <LoadingState label={t('common.loading')} />
  }

  if (isError && error) {
    return <ErrorState title={t('dashboard.title')} description={error} />
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
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Suspense fallback={<DashboardChartFallback />}>
            <ExpensesPieChart data={grouped} locale={locale} title={t('dashboard.chartTitle')} />
          </Suspense>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.budgetTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${budgetAmount > 0 ? Math.min((expenses / budgetAmount) * 100, 100) : 0}%` }} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-muted p-4">
                      <p className="font-body text-xs uppercase tracking-[0.2em] text-ink/55">{t('dashboard.budgetUsed')}</p>
                      <p className="mt-2 text-2xl font-semibold">{formatCurrency(expenses, 'CAD', locale)}</p>
                    </div>
                    <div className="rounded-2xl bg-muted p-4">
                      <p className="font-body text-xs uppercase tracking-[0.2em] text-ink/55">{t('dashboard.budgetLeft')}</p>
                      <p className="mt-2 text-2xl font-semibold">{formatCurrency(remaining, 'CAD', locale)}</p>
                    </div>
                  </div>
                </div>
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

