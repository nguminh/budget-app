import { ArrowUpRight, PiggyBank, Receipt, TrendingDown, TrendingUp } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { SummaryCard } from '@/components/shared/SummaryCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBudget } from '@/hooks/useBudget'
import { useTransactions } from '@/hooks/useTransactions'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { formatCurrency, formatMonthInput } from '@/lib/utils'

const COLORS = ['#1f6f5f', '#cb7c2c', '#b74f3b', '#6a8caf', '#92735f', '#8c5f7a']

export function DashboardPage() {
  const month = formatMonthInput()
  const { t, i18n } = useAppTranslation()
  const { transactions, loading, refreshing, error } = useTransactions({ currentMonthOnly: true })
  const { budget } = useBudget(month)
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'

  if (loading) {
    return <LoadingState label={t('common.loading')} />
  }

  if (error) {
    return <ErrorState title={t('dashboard.title')} description={error} />
  }

  const income = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0)
  const expenses = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0)
  const budgetAmount = budget ? Number(budget.amount) : 0
  const remaining = budgetAmount - expenses
  const grouped = Object.values(
    transactions
      .filter((item) => item.type === 'expense')
      .reduce<Record<string, { name: string; value: number }>>((acc, item) => {
        const key = item.category_name || t('common.noCategory')
        acc[key] = { name: key, value: (acc[key]?.value ?? 0) + Number(item.amount) }
        return acc
      }, {}),
  )
  const recent = transactions.slice(0, 5)

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title={t('dashboard.expenses')} value={formatCurrency(expenses, 'CAD', locale)} description={t('dashboard.subtitle')} icon={TrendingDown} tone="warning" />
        <SummaryCard title={t('dashboard.income')} value={formatCurrency(income, 'CAD', locale)} description={t('dashboard.subtitle')} icon={TrendingUp} tone="success" />
        <SummaryCard title={t('dashboard.remaining')} value={formatCurrency(remaining, 'CAD', locale)} description={budget ? t('dashboard.ofBudget') : t('dashboard.budgetMissing')} icon={PiggyBank} />
        <SummaryCard title={t('dashboard.count')} value={String(transactions.length)} description={refreshing ? t('common.loading') : t('dashboard.subtitle')} icon={Receipt} />
      </section>
      {transactions.length === 0 ? (
        <EmptyState title={t('dashboard.empty')} description={t('dashboard.emptyHint')} />
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.chartTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={grouped} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
                    {grouped.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value, 'CAD', locale)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap gap-2">
                {grouped.map((entry, index) => (
                  <Badge key={entry.name} style={{ backgroundColor: `${COLORS[index % COLORS.length]}20`, color: COLORS[index % COLORS.length] }}>
                    {entry.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
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
