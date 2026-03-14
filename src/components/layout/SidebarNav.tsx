import { NavLink } from 'react-router-dom'

import { navIconMap } from '@/components/layout/AppShell'
import { NAV_ITEMS } from '@/lib/constants'
import { useAppTranslation } from '@/hooks/useAppTranslation'

export function SidebarNav() {
  const { t } = useAppTranslation()

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[32px] border border-border bg-card p-6 shadow-soft lg:flex">
      <div>
        <p className="font-body text-sm uppercase tracking-[0.3em] text-ink/45">Maple Ledger</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground">Personal budgeting that feels calm.</h2>
      </div>
      <nav className="mt-8 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = navIconMap[item.icon]
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-2xl px-4 py-3 font-body text-sm transition',
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
      <div className="mt-auto rounded-[28px] bg-muted p-4">
        <p className="text-sm font-semibold text-foreground">Iteration 1</p>
        <p className="mt-2 font-body text-sm text-ink/65">Auth, budgets, transactions, charts, and bilingual UI. Premium can wait its turn.</p>
      </div>
    </aside>
  )
}

