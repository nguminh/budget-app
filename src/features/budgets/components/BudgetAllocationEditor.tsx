import { Input } from '@/components/ui/input'
import {
  getCategoryAllocationLimit,
  type AllocationMap,
  type BudgetCategory,
} from '@/features/budgets/lib/allocations'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { cn, formatCurrency } from '@/lib/utils'

function getSliderFill(value: number, max: number) {
  const fillPercent = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return `linear-gradient(90deg, #111111 0%, #111111 ${fillPercent}%, rgba(17, 17, 17, 0.12) ${fillPercent}%, rgba(17, 17, 17, 0.12) 100%)`
}

export function BudgetAllocationEditor({
  allocations,
  autoBalanceCategoryId,
  categories,
  onAllocationChange,
  totalAmount,
}: {
  allocations: AllocationMap
  autoBalanceCategoryId?: string | null
  categories: BudgetCategory[]
  onAllocationChange: (categoryId: string, value: string) => void
  totalAmount: number
}) {
  const { t, i18n } = useAppTranslation()
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'
  const autoBalanceCategory = categories.find((category) => category.id === autoBalanceCategoryId) ?? null

  return (
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
        {categories.length === 0 ? (
          <p className="font-body text-sm text-ink/65">{t('budgets.noExpenseCategories')}</p>
        ) : null}
        {categories.map((category) => {
          const amount = allocations[category.id] ?? 0
          const limit = getCategoryAllocationLimit({
            allocations,
            autoBalanceCategoryId,
            categoryId: category.id,
            categories,
            totalAmount,
          })
          const sliderMax = Math.max(totalAmount, amount, 1)
          const isAutoBalancedCategory = category.id === autoBalanceCategoryId
          const share = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0

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
                  max={sliderMax}
                  min={0}
                  onChange={(event) => onAllocationChange(category.id, event.target.value)}
                  step="0.01"
                  style={{ background: getSliderFill(amount, sliderMax) }}
                  type="range"
                  value={Math.min(amount, sliderMax)}
                />
                <Input
                  aria-label={t('budgets.categoryInputLabel', { category: category.name })}
                  className="h-10 rounded-xl px-3"
                  disabled={isAutoBalancedCategory}
                  max={limit}
                  min={0}
                  onChange={(event) => onAllocationChange(category.id, event.target.value)}
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
        {categories.length === 0 ? (
          <p className="font-body text-sm text-ink/65">{t('budgets.noExpenseCategories')}</p>
        ) : null}
        {categories.map((category) => {
          const amount = allocations[category.id] ?? 0
          const limit = getCategoryAllocationLimit({
            allocations,
            autoBalanceCategoryId,
            categoryId: category.id,
            categories,
            totalAmount,
          })
          const sliderMax = Math.max(totalAmount, amount, 1)
          const isAutoBalancedCategory = category.id === autoBalanceCategoryId
          const share = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0

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
                  max={sliderMax}
                  min={0}
                  onChange={(event) => onAllocationChange(category.id, event.target.value)}
                  step="0.01"
                  style={{ background: getSliderFill(amount, sliderMax) }}
                  type="range"
                  value={Math.min(amount, sliderMax)}
                />
                <Input
                  aria-label={t('budgets.categoryInputLabel', { category: category.name })}
                  className="h-10 rounded-xl px-3"
                  disabled={isAutoBalancedCategory}
                  max={limit}
                  min={0}
                  onChange={(event) => onAllocationChange(category.id, event.target.value)}
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
  )
}
