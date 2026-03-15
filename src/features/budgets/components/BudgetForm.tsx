import { zodResolver } from '@hookform/resolvers/zod'
import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { BudgetAllocationEditor } from '@/features/budgets/components/BudgetAllocationEditor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  allocationsToSave,
  createBudgetAllocationMap,
  getAutoBalanceCategoryId,
  rebalanceAllocationsForTotal,
  setCategoryAllocationAmount,
} from '@/features/budgets/lib/allocations'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { buildBudgetSchema } from '@/lib/validations/budget'

type BudgetCategory = {
  color: string | null
  id: string
  name: string
}

type BudgetValues = {
  amount: number
  allocations: Array<{
    amount: number
    categoryId: string
  }>
  month: string
}

type FormValues = {
  amount: number
  month: string
}

function parseAmountInput(value: string) {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0
}

export function BudgetForm({
  categories,
  initialValues,
  onMonthChange,
  onSubmit,
  submitting,
}: {
  categories: BudgetCategory[]
  initialValues: BudgetValues
  onMonthChange: (month: string) => void
  onSubmit: (values: BudgetValues) => Promise<void>
  submitting: boolean
}) {
  const { t } = useAppTranslation()
  const schema = buildBudgetSchema(t)
  const categoryOptions = useMemo(() => categories, [categories])
  const autoBalanceCategoryId = useMemo(() => getAutoBalanceCategoryId(categoryOptions), [categoryOptions])
  const form = useForm<FormValues>({
    defaultValues: {
      amount: initialValues.amount,
      month: initialValues.month,
    },
    resolver: zodResolver(schema),
  })
  const [allocations, setAllocations] = useState(() =>
    createBudgetAllocationMap({
      allocations: initialValues.allocations,
      autoBalanceCategoryId,
      categories: categoryOptions,
      totalAmount: initialValues.amount,
    }),
  )

  useEffect(() => {
    form.reset({
      amount: initialValues.amount,
      month: initialValues.month,
    })
    setAllocations(
      createBudgetAllocationMap({
        allocations: initialValues.allocations,
        autoBalanceCategoryId,
        categories: categoryOptions,
        totalAmount: initialValues.amount,
      }),
    )
  }, [autoBalanceCategoryId, categoryOptions, form, initialValues.allocations, initialValues.amount, initialValues.month])

  const totalAmount = Number(form.watch('amount') ?? 0)
  const safeTotalAmount = Number.isFinite(totalAmount) ? Math.max(0, totalAmount) : 0
  const monthField = form.register('month')
  const amountField = form.register('amount')

  const handleMonthChange = (event: ChangeEvent<HTMLInputElement>) => {
    monthField.onChange(event)
    onMonthChange(event.target.value)
  }

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    amountField.onChange(event)

    const nextTotalAmount = parseAmountInput(event.target.value)
    setAllocations((currentAllocations) =>
      rebalanceAllocationsForTotal({
        allocations: currentAllocations,
        autoBalanceCategoryId,
        categories: categoryOptions,
        totalAmount: nextTotalAmount,
      }),
    )
  }

  const handleAllocationChange = (categoryId: string, value: string) => {
    setAllocations((currentAllocations) =>
      setCategoryAllocationAmount({
        allocations: currentAllocations,
        autoBalanceCategoryId,
        amount: parseAmountInput(value),
        categoryId,
        categories: categoryOptions,
        totalAmount: safeTotalAmount,
      }),
    )
  }

  return (
    <form
      className="space-y-3"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          amount: values.amount,
          allocations: allocationsToSave(allocations),
          month: values.month,
        })
      })}
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-1">
          <Label htmlFor="month">{t('budgets.month')}</Label>
          <Input className="h-10 rounded-xl px-3" id="month" type="month" {...monthField} onChange={handleMonthChange} />
          <p className="font-body text-xs text-danger">{form.formState.errors.month?.message}</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="budgetAmount">{t('budgets.amount')}</Label>
          <Input className="h-10 rounded-xl px-3" id="budgetAmount" type="number" step="0.01" {...amountField} onChange={handleAmountChange} />
          <p className="font-body text-xs text-danger">{form.formState.errors.amount?.message}</p>
        </div>
      </div>

      <BudgetAllocationEditor
        allocations={allocations}
        autoBalanceCategoryId={autoBalanceCategoryId}
        categories={categoryOptions}
        onAllocationChange={handleAllocationChange}
        totalAmount={safeTotalAmount}
      />

      <Button className="w-full rounded-xl sm:w-auto" type="submit" disabled={submitting || categoryOptions.length === 0}>
        {submitting ? t('common.loading') : t('budgets.save')}
      </Button>
    </form>
  )
}
