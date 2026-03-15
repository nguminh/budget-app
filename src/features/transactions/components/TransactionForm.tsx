import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { buildTransactionSchema } from '@/lib/validations/transaction'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

type TransactionValues = {
  type: 'expense' | 'income'
  amount: number
  merchant: string
  categoryId: string
  note?: string
  transactionDate: string
  transactionTime: string
}

function getCurrentTimeInputValue() {
  return new Date().toTimeString().slice(0, 5)
}

export function TransactionForm({
  categories,
  initialValues,
  submitting,
  submitLabel,
  onSubmit,
  onDelete,
}: {
  categories: Category[]
  initialValues?: Partial<TransactionValues>
  submitting: boolean
  submitLabel: string
  onSubmit: (values: TransactionValues) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const { t } = useAppTranslation()
  const schema = buildTransactionSchema(t)
  const form = useForm<TransactionValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: initialValues?.type ?? 'expense',
      amount: initialValues?.amount ?? 0,
      merchant: initialValues?.merchant ?? '',
      categoryId: initialValues?.categoryId ?? '',
      note: initialValues?.note ?? '',
      transactionDate: initialValues?.transactionDate ?? new Date().toISOString().slice(0, 10),
      transactionTime: initialValues?.transactionTime ?? getCurrentTimeInputValue(),
    },
  })

  const currentType = form.watch('type')
  const filteredCategories = useMemo(
    () => categories.filter((category) => category.kind === currentType),
    [categories, currentType],
  )

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('transactions.type')}</Label>
          <Select value={form.watch('type')} onValueChange={(value) => form.setValue('type', value as 'expense' | 'income')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">{t('common.expense')}</SelectItem>
              <SelectItem value="income">{t('common.income')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">{t('transactions.amount')}</Label>
          <Input id="amount" type="number" step="0.01" {...form.register('amount')} />
          <p className="font-body text-xs text-danger">{form.formState.errors.amount?.message}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="merchant">{t('transactions.merchant')}</Label>
          <Input id="merchant" {...form.register('merchant')} />
          <p className="font-body text-xs text-danger">{form.formState.errors.merchant?.message}</p>
        </div>
        <div className="space-y-2">
          <Label>{t('transactions.category')}</Label>
          <Select value={form.watch('categoryId')} onValueChange={(value) => form.setValue('categoryId', value)}>
            <SelectTrigger>
              <SelectValue placeholder={t('transactions.category')} />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="font-body text-xs text-danger">{form.formState.errors.categoryId?.message}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="transactionDate">{t('transactions.date')}</Label>
          <Input id="transactionDate" type="date" {...form.register('transactionDate')} />
          <p className="font-body text-xs text-danger">{form.formState.errors.transactionDate?.message}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transactionTime">{t('transactions.time')}</Label>
          <Input id="transactionTime" type="time" {...form.register('transactionTime')} />
          <p className="font-body text-xs text-danger">{form.formState.errors.transactionTime?.message}</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">{t('transactions.note')}</Label>
        <Textarea id="note" {...form.register('note')} />
        <p className="font-body text-xs text-danger">{form.formState.errors.note?.message}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>{submitting ? t('common.loading') : submitLabel}</Button>
        {onDelete ? <Button type="button" variant="danger" onClick={() => void onDelete()}>{t('transactions.delete')}</Button> : null}
      </div>
    </form>
  )
}