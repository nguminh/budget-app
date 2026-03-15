import { NavLink } from 'react-router-dom'

import { navIconMap } from '@/components/layout/AppShell'
import { NAV_ITEMS } from '@/lib/constants'
import { useAppTranslation } from '@/hooks/useAppTranslation'

export function MobileBottomNav() {
  const { t } = useAppTranslation()

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[18px] border border-border bg-card/95 p-1.5 shadow-soft backdrop-blur lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = navIconMap[item.icon]
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-transform duration-200 active:scale-[0.98]',
                  isActive ? 'bg-foreground text-accentForeground' : 'text-ink/65',
                ].join(' ')
              }
            >
              <Icon className="size-4" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
