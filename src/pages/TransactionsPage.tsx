import { Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TransactionList } from '@/features/transactions/components/TransactionList'
import { deleteTransaction } from '@/features/transactions/lib/transactionWriteClient'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { useTransactions } from '@/hooks/useTransactions'

export function TransactionsPage() {
  const { t } = useAppTranslation()
  const [typeFilter, setTypeFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState<'current' | 'all'>('all')
  const { transactions, loading, refreshing, error, reload } = useTransactions({
    type: typeFilter,
    currentMonthOnly: monthFilter === 'current',
  })

  const statusLabel = error && transactions.length > 0 ? error : refreshing ? t('common.loading') : null

  const handleDelete = async (transactionId: string) => {
    if (!window.confirm(t('transactions.deleteConfirm'))) {
      return
    }

    try {
      await deleteTransaction(transactionId)
      toast.success(t('transactions.successDelete'))
      void reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.errorGeneric'))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{t('transactions.title')}</CardTitle>
            <p className="font-body text-sm text-ink/70">{t('transactions.subtitle')}</p>
            {statusLabel ? <p className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-ink/50">{statusLabel}</p> : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/transactions/ai"><Sparkles className="size-4" />{t('transactions.ai.launch')}</Link>
            </Button>
            <Button asChild>
              <Link to="/transactions/new"><Plus className="size-4" />{t('transactions.add')}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="font-body text-sm font-medium text-foreground">{t('transactions.filters')}</p>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('transactions.allTypes')}</SelectItem>
                <SelectItem value="expense">{t('common.expense')}</SelectItem>
                <SelectItem value="income">{t('common.income')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="font-body text-sm font-medium text-foreground">&nbsp;</p>
            <Select value={monthFilter} onValueChange={(value) => setMonthFilter(value as 'current' | 'all')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('transactions.allMonths')}</SelectItem>
                <SelectItem value="current">{t('transactions.currentMonth')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {loading ? <LoadingState label={t('common.loading')} /> : null}
      {!loading && error && transactions.length === 0 ? <ErrorState title={t('transactions.title')} description={error || t('transactions.loadError')} /> : null}
      {!loading && !error && transactions.length === 0 ? <EmptyState title={t('transactions.empty')} description={t('transactions.subtitle')} /> : null}
      {!loading && transactions.length > 0 ? <TransactionList transactions={transactions} onDelete={(id) => void handleDelete(id)} /> : null}
    </div>
  )
}
