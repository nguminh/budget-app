import { NavLink } from 'react-router-dom'

import { navIconMap } from '@/components/layout/AppShell'
import { NAV_ITEMS } from '@/lib/constants'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { useBudget } from '@/hooks/useBudget'
import { useTransactions } from '@/hooks/useTransactions'
import { useDashboardSummary } from '@/features/dashboard/hooks/useDashboardSummary'
import { formatMonthInput } from '@/lib/utils'

export function SidebarNav() {
  const { t } = useAppTranslation()
  const currentMonth = formatMonthInput()
  const { budget } = useBudget(currentMonth)
  const { transactions } = useTransactions({ currentMonthOnly: true })

  const { budgetAmount, expenses } = useDashboardSummary({
    budget,
    noCategoryLabel: t('transactions.noCategory') || 'Uncategorized',
    transactions,
  })
  
  const fractionUsed = budgetAmount > 0 ? Math.min(1, expenses / budgetAmount) : 0
  const treeStep = Math.max(0, Math.min(9, Math.ceil((1 - fractionUsed) * 9)))
  const treeImage = `/sprites/${treeStep}.png`
  const treeProgress = Math.round(fractionUsed * 100)

  return (
    <aside className="sticky top-3 hidden h-[calc(100vh-1.5rem)] w-64 shrink-0 flex-col rounded-[20px] border border-border bg-card px-4 py-5 shadow-soft lg:flex">
      <div className="mb-4">
        <p className="font-display text-xl font-bold uppercase tracking-[0.08em] leading-tight text-foreground">
          {t('sidebar.hitline') || 'Stay calm and budget'}
        </p>
      </div>
      <nav className="mt-6 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = navIconMap[item.icon]
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-body text-xs font-bold uppercase tracking-[0.16em] transition-transform duration-200 hover:-translate-y-0.5',
                  isActive ? 'bg-foreground text-accentForeground' : 'text-ink/75 hover:bg-muted',
                ].join(' ')
              }
            >
              <Icon className="size-4" />
              {t(item.labelKey)}
            </NavLink>
          )
        })}
      </nav>
      <div className="mt-3 w-full rounded-lg border border-muted p-2 text-center">
          <p className="text-xs uppercase tracking-[0.08em] text-ink/70">{t('sidebar.budgetProgress') || 'Month progress'}</p>
          <p className="text-sm font-bold">{treeProgress}% {t('sidebar.used') || 'used'}</p>
          <img src={treeImage} alt={`Tree stage ${treeStep}`} className="mx-auto mt-2 h-50 w-50 py-3 object-contain" />
          <p className="text-xs text-ink/75">{t('sidebar.summary')}</p>
        </div>
    </aside>
  )
}
