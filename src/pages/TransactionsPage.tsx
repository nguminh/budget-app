import { Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TransactionList } from '@/features/transactions/components/TransactionList'
import { useDeleteTransaction } from '@/features/transactions/hooks/useTransactionMutations'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { useTransactions } from '@/hooks/useTransactions'

export function TransactionsPage() {
  const { t } = useAppTranslation()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState<'current' | 'all'>('all')
  const { transactions, error, isError, isFetching, isLoading } = useTransactions({
    type: typeFilter,
    currentMonthOnly: monthFilter === 'current',
  })
  const deleteTransaction = useDeleteTransaction()

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase()
    return (
      t.merchant?.toLowerCase().includes(q) ||
      t.category_name?.toLowerCase().includes(q) ||
      t.type?.toLowerCase().includes(q)
    )
  })

  const statusLabel = error && transactions.length > 0 ? error : isFetching ? t('common.loading') : null
  const showInitialLoading = isLoading && transactions.length === 0
  const showEmpty = !showInitialLoading && !isError && filtered.length === 0

  const handleDelete = async (transactionId: string) => {
    if (!window.confirm(t('transactions.deleteConfirm'))) return
    try {
      await deleteTransaction.mutateAsync(transactionId)
      toast.success(t('transactions.successDelete'))
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : t('transactions.loadError'))
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
          <Button asChild>
            <Link to="/transactions/new"><Plus className="size-4" />{t('transactions.add')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('transactions.searchPlaceholder')}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </CardContent>
      </Card>

      {showInitialLoading ? <LoadingState label={t('common.loading')} /> : null}
      {!showInitialLoading && isError && transactions.length === 0 ? <ErrorState title={t('transactions.title')} description={error || t('transactions.loadError')} /> : null}
      {showEmpty ? <EmptyState title={t('transactions.empty')} description={t('transactions.subtitle')} /> : null}
      {!showInitialLoading && filtered.length > 0 ? <TransactionList transactions={filtered} onDelete={(id) => void handleDelete(id)} /> : null}
    </div>
  )
}

export default TransactionsPage

