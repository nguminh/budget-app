import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { SummaryCard } from '@/components/shared/SummaryCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ExpensesPieChart from '@/features/dashboard/components/ExpensesPieChart'
import { useDashboardSummary } from '@/features/dashboard/hooks/useDashboardSummary'
import { getBudgetBucketTracking } from '@/features/budgets/lib/budgetBuckets'
import { useBudget } from '@/hooks/useBudget'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { formatCurrency, formatMonthInput } from '@/lib/utils'

function formatTransactionDateTime(date: string, time: string | null | undefined, locale: string) {
  const formattedDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`))
  return time ? `${formattedDate} - ${time.slice(0, 5)}` : formattedDate
}

export function DashboardPage() {
  const month = formatMonthInput()
  const { t, i18n } = useAppTranslation()
  const navigate = useNavigate()
  const longPressTimerRef = useRef<number | null>(null)
  const [pressedId, setPressedId] = useState<string | null>(null)
  const { transactions, error, isError, isFetching, isLoading } = useTransactions({ currentMonthOnly: true })
  const { budget, categoryBudgets } = useBudget(month)
  const { categories, error: categoriesError, isLoading: categoriesLoading } = useCategories()
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'
  const { expenses, grouped, income, recent, remaining } = useDashboardSummary({
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

  function startLongPress(transactionId: string) {
    setPressedId(transactionId)
    longPressTimerRef.current = window.setTimeout(() => {
      navigate('/transactions/new')
      setPressedId(null)
    }, 550)
  }

  function cancelLongPress() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setPressedId(null)
  }

  if ((isLoading && transactions.length === 0) || categoriesLoading) {
    return <LoadingState label={t('common.loading')} />
  }

  if ((isError && error) || categoriesError) {
    return <ErrorState title={t('dashboard.title')} description={error || categoriesError || t('common.loading')} />
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="grid grid-cols-3 gap-2.5 md:gap-3">
        <SummaryCard title={t('dashboard.expenses')} value={formatCurrency(expenses, 'CAD', locale)} description={t('dashboard.subtitle')} icon={TrendingDown} tone="warning" />
        <SummaryCard title={t('dashboard.income')} value={formatCurrency(income, 'CAD', locale)} description={t('dashboard.subtitle')} icon={TrendingUp} tone="success" />
        <SummaryCard title={t('dashboard.remaining')} value={formatCurrency(remaining, 'CAD', locale)} description={budget ? t('dashboard.ofBudget') : t('dashboard.budgetMissing')} icon={PiggyBank} />
      </section>
      {transactions.length === 0 ? (
        <EmptyState title={t('dashboard.empty')} description={t('dashboard.emptyHint')} />
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr] items-start">
          <ExpensesPieChart data={grouped} locale={locale} title={t('dashboard.chartTitle')} />
          <div className="space-y-4">
            <Card>
              <CardHeader className="space-y-2">
                <CardTitle>{t('dashboard.budgetTitle')}</CardTitle>
                <div className="flex items-end justify-between gap-4">
                  <p className="text-xl font-semibold md:text-2xl">{formatCurrency(expenses, 'CAD', locale)}</p>
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">{t('dashboard.budgetUsed')}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {categoryTracking.map((bucket) => {
                  const progress = bucket.budgetAmount > 0 ? Math.min((bucket.spentAmount / bucket.budgetAmount) * 100, 100) : 0

                  return (
                    <div key={bucket.key} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-foreground">{bucket.label}</p>
                        <p className="font-body text-sm text-ink/60">
                          {formatCurrency(bucket.spentAmount, 'CAD', locale)} / {formatCurrency(bucket.budgetAmount, 'CAD', locale)}
                        </p>
                      </div>
                      <div className="h-3.5 overflow-hidden rounded-full bg-muted/80 transition-all duration-200" style={{ border: `1px solid ${bucket.color}55` }}>
                        <div className="h-full rounded-full transition-[width] duration-300" style={{ backgroundColor: bucket.color, width: `${progress}%` }} />
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
              <CardContent className="space-y-1 pt-0.5">
                {recent.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={[
                      'flex items-center justify-between rounded-[14px] border border-border/35 bg-transparent px-3 py-2.5 transition duration-200',
                      pressedId === transaction.id ? 'scale-[0.99] border-foreground/20' : 'hover:border-border/65 hover:bg-card/20',
                    ].join(' ')}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    onTouchStart={() => startLongPress(transaction.id)}
                  >
                    <div>
                      <p className="font-medium text-foreground">{transaction.merchant}</p>
                      <p className="font-body text-sm text-ink/60">{formatTransactionDateTime(transaction.transaction_date, transaction.transaction_time, locale)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(Number(transaction.amount), transaction.currency, locale)}</p>
                      <Badge className="mt-1 bg-card/0"><ArrowUpRight className="mr-1 size-3" />{transaction.type === 'expense' ? t('common.expense') : t('common.income')}</Badge>
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
