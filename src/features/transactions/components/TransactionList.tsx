import { useState } from 'react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type SortKey = 'merchant' | 'category_name' | 'type' | 'transaction_date' | 'amount'
type SortDirection = 'asc' | 'desc'

function SortIcon({ column, sortKey, sortDirection }: { column: SortKey; sortKey: SortKey | null; sortDirection: SortDirection }) {
  if (sortKey !== column) return <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 text-ink/30" />
  return sortDirection === 'asc'
    ? <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
    : <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
}

export function TransactionList({
  transactions,
  onDelete,
}: {
  transactions: Transaction[]
  onDelete: (transactionId: string) => void
}) {
  const { t, i18n } = useAppTranslation()
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'

  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sorted = [...transactions].sort((a, b) => {
    if (!sortKey) return 0
    let valA = a[sortKey]
    let valB = b[sortKey]

    // Normalize nulls to the bottom regardless of direction
    if (valA == null) return 1
    if (valB == null) return -1

    if (sortKey === 'amount') {
      return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
    }

    if (sortKey === 'transaction_date') {
      return sortDirection === 'asc'
        ? new Date(valA as string).getTime() - new Date(valB as string).getTime()
        : new Date(valB as string).getTime() - new Date(valA as string).getTime()
    }

    // String comparison for merchant, category_name, type
    return sortDirection === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA))
  })

  const columns: { key: SortKey; label: string; className?: string }[] = [
    { key: 'merchant',        label: t('transactions.merchant') },
    { key: 'category_name',   label: t('transactions.category') },
    { key: 'type',            label: t('transactions.type') },
    { key: 'transaction_date',label: t('transactions.date') },
    { key: 'amount',          label: t('transactions.amount'), className: 'text-right' },
  ]

  return (
    <>
      {/* Mobile cards — unchanged, no sorting UI */}
      <div className="space-y-3 lg:hidden">
        {sorted.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground">{transaction.merchant}</p>
                  <p className="font-body text-sm text-ink/60">{transaction.category_name}</p>
                </div>
                <Badge className={transaction.type === 'expense' ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}>
                  {transaction.type === 'expense' ? t('common.expense') : t('common.income')}
                </Badge>
              </div>
              <div className="flex items-center justify-between font-body text-sm text-ink/70">
                <span>{format(new Date(transaction.transaction_date), 'PPP')}</span>
                <span className="font-semibold text-foreground">{formatCurrency(transaction.amount, transaction.currency, locale)}</span>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline"><Link to={`/transactions/${transaction.id}/edit`}>{t('transactions.edit')}</Link></Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(transaction.id)}>{t('transactions.delete')}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table — sortable headers */}
      <div className="hidden overflow-hidden rounded-[28px] border border-border bg-card shadow-soft lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(({ key, label, className }) => (
                <TableHead key={key} className={className}>
                  <button
                    className="flex items-center gap-0.5 hover:text-foreground transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    <SortIcon column={key} sortKey={sortKey} sortDirection={sortDirection} />
                  </button>
                </TableHead>
              ))}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.merchant}</TableCell>
                <TableCell>{transaction.category_name}</TableCell>
                <TableCell>{transaction.type === 'expense' ? t('common.expense') : t('common.income')}</TableCell>
                <TableCell>{format(new Date(transaction.transaction_date), 'PPP')}</TableCell>
                <TableCell className={`text-right font-semibold ${
                  transaction.type === 'expense' ? 'text-danger' : 'text-accent'
                }`}>{formatCurrency(transaction.amount, transaction.currency, locale)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline"><Link to={`/transactions/${transaction.id}/edit`}>{t('transactions.edit')}</Link></Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(transaction.id)}>{t('transactions.delete')}</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}