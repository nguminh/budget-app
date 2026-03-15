import { FileUp, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
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

  const filtered = transactions.filter((transaction) => {
    const query = search.toLowerCase()
    return transaction.merchant?.toLowerCase().includes(query)
      || transaction.category_name?.toLowerCase().includes(query)
      || transaction.type?.toLowerCase().includes(query)
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>{statusLabel ? <p className="font-body text-xs uppercase tracking-[0.2em] text-ink/50">{statusLabel}</p> : null}</div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/transactions/import"><FileUp className="size-4" />{t('transactions.import.cta')}</Link>
          </Button>
          <Button asChild>
            <Link to="/transactions/new"><Plus className="size-4" />{t('transactions.add')}</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-[20px] border border-border bg-card px-4 py-4 shadow-soft md:px-5 md:py-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input
            className="pl-9 pr-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('transactions.searchPlaceholder')}
            value={search}
          />
          {search ? (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 transition-colors hover:text-ink"
              onClick={() => setSearch('')}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Select onValueChange={setTypeFilter} value={typeFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('transactions.allTypes')}</SelectItem>
              <SelectItem value="expense">{t('common.expense')}</SelectItem>
              <SelectItem value="income">{t('common.income')}</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setMonthFilter(value as 'current' | 'all')} value={monthFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('transactions.allMonths')}</SelectItem>
              <SelectItem value="current">{t('transactions.currentMonth')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showInitialLoading ? <LoadingState label={t('common.loading')} /> : null}
      {!showInitialLoading && isError && transactions.length === 0 ? <ErrorState title={t('transactions.title')} description={error || t('transactions.loadError')} /> : null}
      {showEmpty ? <EmptyState title={t('transactions.empty')} description={t('transactions.subtitle')} /> : null}
      {!showInitialLoading && filtered.length > 0 ? <TransactionList transactions={filtered} onDelete={(id) => void handleDelete(id)} /> : null}
    </div>
  )
}

export default TransactionsPage
