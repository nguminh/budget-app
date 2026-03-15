import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
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

function formatTransactionDateTime(date: string, time: string | null | undefined, locale: string) {
  const formattedDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`))
  return time ? `${formattedDate} • ${time.slice(0, 5)}` : formattedDate
}

export function TransactionList({
  transactions,
  onDelete,
}: {
  transactions: Transaction[]
  onDelete: (transactionId: string) => void
}) {
  const { t, i18n } = useAppTranslation()
  const navigate = useNavigate()
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'
  const longPressTimerRef = useRef<number | null>(null)
  const [pressedId, setPressedId] = useState<string | null>(null)

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

  const sorted = [...transactions].sort((a, b) => {
    if (!sortKey) return 0
    let valA = a[sortKey]
    let valB = b[sortKey]

    if (valA == null) return 1
    if (valB == null) return -1

    if (sortKey === 'amount') {
      return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
    }

    if (sortKey === 'transaction_date') {
      const dateA = new Date(`${a.transaction_date}T${a.transaction_time ?? '00:00:00'}`).getTime()
      const dateB = new Date(`${b.transaction_date}T${b.transaction_time ?? '00:00:00'}`).getTime()
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
    }

    return sortDirection === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA))
  })

  const columns: { key: SortKey; label: string; className?: string }[] = [
    { key: 'merchant', label: t('transactions.merchant') },
    { key: 'category_name', label: t('transactions.category') },
    { key: 'type', label: t('transactions.type') },
    { key: 'transaction_date', label: t('transactions.date') },
    { key: 'amount', label: t('transactions.amount'), className: 'text-right' },
  ]

  return (
    <>
      <div className="space-y-2.5 lg:hidden">
        {sorted.map((transaction) => (
          <Card
            key={transaction.id}
            className={[
              'rounded-[16px] transition duration-200',
              pressedId === transaction.id ? 'scale-[0.99]' : 'hover:-translate-y-px',
            ].join(' ')}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            onTouchStart={() => startLongPress(transaction.id)}
          >
            <CardContent className="space-y-2.5 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold text-foreground">{transaction.merchant}</p>
                  <p className="font-body text-sm text-ink/60">{transaction.category_name}</p>
                </div>
                <Badge className={transaction.type === 'expense' ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}>
                  {transaction.type === 'expense' ? t('common.expense') : t('common.income')}
                </Badge>
              </div>
              <div className="flex items-center justify-between font-body text-sm text-ink/70">
                <span>{formatTransactionDateTime(transaction.transaction_date, transaction.transaction_time, locale)}</span>
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

      <div className="hidden overflow-hidden rounded-[20px] border border-border bg-card shadow-soft lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(({ key, label, className }) => (
                <TableHead key={key} className={className}>
                  <button className="flex items-center gap-0.5 transition-colors hover:text-foreground" onClick={() => handleSort(key)}>
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
                <TableCell>{formatTransactionDateTime(transaction.transaction_date, transaction.transaction_time, locale)}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(transaction.amount, transaction.currency, locale)}</TableCell>
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