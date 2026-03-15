import { NavLink } from 'react-router-dom'

import { navIconMap } from '@/components/layout/AppShell'
import { NAV_ITEMS } from '@/lib/constants'
import { useAppTranslation } from '@/hooks/useAppTranslation'

export function SidebarNav() {
  const { t } = useAppTranslation()

  return (
    <aside className="sticky top-3 hidden h-[calc(100vh-1.5rem)] w-64 shrink-0 flex-col rounded-[20px] border border-border bg-card px-4 py-5 shadow-soft lg:flex">
      <p className="font-body text-sm uppercase tracking-[0.3em] text-ink/45">Maple Ledger</p>
      <p className="mt-2 font-display text-xl font-bold uppercase tracking-[0.08em] leading-tight text-foreground">
        Personal budgeting that feels calm.
      </p>
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
    </aside>
  )
}
