import { zodResolver } from '@hookform/resolvers/zod'
import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  allocationsToSave,
  createBudgetAllocationMap,
  getAutoBalanceCategoryId,
  getCategoryAllocationLimit,
  setCategoryAllocationAmount,
  rebalanceAllocationsForTotal,
} from '@/features/budgets/lib/allocations'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { cn, formatCurrency } from '@/lib/utils'
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

function getSliderFill(value: number, max: number) {
  const fillPercent = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return `linear-gradient(90deg, #111111 0%, #111111 ${fillPercent}%, rgba(17, 17, 17, 0.12) ${fillPercent}%, rgba(17, 17, 17, 0.12) 100%)`
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
  const { t, i18n } = useAppTranslation()
  const schema = buildBudgetSchema(t)
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'
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
  const autoBalanceCategory = categoryOptions.find((category) => category.id === autoBalanceCategoryId) ?? null

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

      <div className="rounded-3xl border border-border/70 bg-muted/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{t('budgets.allocations')}</p>
            <p className="mt-1 font-body text-sm text-ink/65">{t('budgets.allocationsHint')}</p>
          </div>
          <div className="w-full rounded-2xl bg-background/90 px-4 py-3 text-left shadow-soft sm:w-auto sm:text-right">
            <p className="font-body text-xs uppercase tracking-[0.2em] text-ink/55">{t('budgets.autoAssigned')}</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(allocations[autoBalanceCategoryId ?? ''] ?? 0, 'CAD', locale)}</p>
            <p className="mt-1 font-body text-xs text-ink/55">{autoBalanceCategory?.name ?? t('budgets.otherFallback')}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3 md:hidden">
          {categoryOptions.length === 0 ? (
            <p className="font-body text-sm text-ink/65">{t('budgets.noExpenseCategories')}</p>
          ) : null}
          {categoryOptions.map((category) => {
            const amount = allocations[category.id] ?? 0
            const limit = getCategoryAllocationLimit({
              allocations,
              autoBalanceCategoryId,
              categoryId: category.id,
              categories: categoryOptions,
              totalAmount: safeTotalAmount,
            })
            const isAutoBalancedCategory = category.id === autoBalanceCategoryId
            const share = safeTotalAmount > 0 ? Math.round((amount / safeTotalAmount) * 100) : 0

            return (
              <div
                key={category.id}
                className={cn(
                  'space-y-2 rounded-[18px] border border-ink/15 bg-background/95 p-3.5 shadow-soft transition-colors duration-200',
                  !isAutoBalancedCategory ? 'hover:border-border/70 hover:bg-card/45' : '',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color ?? '#6b7280' }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{category.name}</p>
                      <p className="font-body text-xs text-ink/55">
                        {isAutoBalancedCategory ? t('budgets.autoAssignedHint') : t('budgets.shareOfBudget', { value: share })}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-semibold">{formatCurrency(amount, 'CAD', locale)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <input
                    aria-label={t('budgets.categorySliderLabel', { category: category.name })}
                    className={cn(
                      'budget-slider h-3 w-full cursor-pointer appearance-none rounded-full border border-black/35 bg-transparent transition-transform duration-150 hover:scale-[1.01] active:scale-[1.005]',
                      isAutoBalancedCategory ? 'cursor-not-allowed opacity-60' : '',
                    )}
                    disabled={isAutoBalancedCategory}
                    max={limit}
                    min={0}
                    onChange={(event) => handleAllocationChange(category.id, event.target.value)}
                    step="0.01"
                    style={{ background: getSliderFill(amount, limit) }}
                    type="range"
                    value={Math.min(amount, limit)}
                  />
                  <Input
                    aria-label={t('budgets.categoryInputLabel', { category: category.name })}
                    className="h-10 rounded-xl px-3"
                    disabled={isAutoBalancedCategory}
                    max={limit}
                    min={0}
                    onChange={(event) => handleAllocationChange(category.id, event.target.value)}
                    step="0.01"
                    type="number"
                    value={amount}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 hidden gap-4 md:grid lg:grid-cols-2">
          {categoryOptions.length === 0 ? (
            <p className="font-body text-sm text-ink/65">{t('budgets.noExpenseCategories')}</p>
          ) : null}
          {categoryOptions.map((category) => {
            const amount = allocations[category.id] ?? 0
            const limit = getCategoryAllocationLimit({
              allocations,
              autoBalanceCategoryId,
              categoryId: category.id,
              categories: categoryOptions,
              totalAmount: safeTotalAmount,
            })
            const isAutoBalancedCategory = category.id === autoBalanceCategoryId
            const share = safeTotalAmount > 0 ? Math.round((amount / safeTotalAmount) * 100) : 0

            return (
              <div
                key={category.id}
                className={cn(
                  'space-y-3 rounded-2xl border border-ink/15 bg-background/95 p-4 shadow-soft transition-colors duration-200',
                  !isAutoBalancedCategory ? 'hover:border-border/70 hover:bg-card/45' : '',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color ?? '#6b7280' }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{category.name}</p>
                      <p className="font-body text-xs text-ink/55">
                        {isAutoBalancedCategory ? t('budgets.autoAssignedHint') : t('budgets.shareOfBudget', { value: share })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatCurrency(amount, 'CAD', locale)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_132px] md:items-center">
                  <input
                    aria-label={t('budgets.categorySliderLabel', { category: category.name })}
                    className={cn(
                      'budget-slider h-3 w-full cursor-pointer appearance-none rounded-full border border-black/35 bg-transparent transition-transform duration-150 hover:scale-[1.01] active:scale-[1.005]',
                      isAutoBalancedCategory ? 'cursor-not-allowed opacity-60' : '',
                    )}
                    disabled={isAutoBalancedCategory}
                    max={limit}
                    min={0}
                    onChange={(event) => handleAllocationChange(category.id, event.target.value)}
                    step="0.01"
                    style={{ background: getSliderFill(amount, limit) }}
                    type="range"
                    value={Math.min(amount, limit)}
                  />
                  <Input
                    aria-label={t('budgets.categoryInputLabel', { category: category.name })}
                    className="h-10 rounded-xl px-3"
                    disabled={isAutoBalancedCategory}
                    max={limit}
                    min={0}
                    onChange={(event) => handleAllocationChange(category.id, event.target.value)}
                    step="0.01"
                    type="number"
                    value={amount}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Button className="w-full rounded-xl sm:w-auto" type="submit" disabled={submitting || categoryOptions.length === 0}>
        {submitting ? t('common.loading') : t('budgets.save')}
      </Button>
    </form>
  )
}
