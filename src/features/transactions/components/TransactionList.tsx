import { format } from 'date-fns'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']

export function TransactionList({
  transactions,
  onDelete,
}: {
  transactions: Transaction[]
  onDelete: (transactionId: string) => void
}) {
  const { t, i18n } = useAppTranslation()
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {transactions.map((transaction) => (
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
      <div className="hidden overflow-hidden rounded-[28px] border border-border bg-card shadow-soft lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('transactions.merchant')}</TableHead>
              <TableHead>{t('transactions.category')}</TableHead>
              <TableHead>{t('transactions.type')}</TableHead>
              <TableHead>{t('transactions.date')}</TableHead>
              <TableHead className="text-right">{t('transactions.amount')}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.merchant}</TableCell>
                <TableCell>{transaction.category_name}</TableCell>
                <TableCell>{transaction.type === 'expense' ? t('common.expense') : t('common.income')}</TableCell>
                <TableCell>{format(new Date(transaction.transaction_date), 'PPP')}</TableCell>
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

