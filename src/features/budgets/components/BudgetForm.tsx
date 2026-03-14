import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { buildBudgetSchema } from '@/lib/validations/budget'

type BudgetValues = {
  month: string
  amount: number
}

export function BudgetForm({
  initialValues,
  submitting,
  onSubmit,
}: {
  initialValues: BudgetValues
  submitting: boolean
  onSubmit: (values: BudgetValues) => Promise<void>
}) {
  const { t } = useAppTranslation()
  const schema = buildBudgetSchema(t)
  const form = useForm<BudgetValues>({
    resolver: zodResolver(schema),
    values: initialValues,
  })

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="month">{t('budgets.month')}</Label>
          <Input id="month" type="month" {...form.register('month')} />
          <p className="font-body text-xs text-danger">{form.formState.errors.month?.message}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="budgetAmount">{t('budgets.amount')}</Label>
          <Input id="budgetAmount" type="number" step="0.01" {...form.register('amount')} />
          <p className="font-body text-xs text-danger">{form.formState.errors.amount?.message}</p>
        </div>
      </div>
      <Button type="submit" disabled={submitting}>{submitting ? t('common.loading') : t('budgets.save')}</Button>
    </form>
  )
}

