import { useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { navIconMap } from '@/components/layout/AppShell'
import { NAV_ITEMS } from '@/lib/constants'
import { useAppTranslation } from '@/hooks/useAppTranslation'

export function MobileBottomNav() {
  const { t } = useAppTranslation()
  const navigate = useNavigate()
  const longPressTimerRef = useRef<number | null>(null)
  const longPressTriggeredRef = useRef(false)

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  function startLongPress(to: string) {
    if (to !== '/transactions') return

    longPressTriggeredRef.current = false
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true
      navigate('/transactions/new')
    }, 550)
  }

  function cancelLongPress() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  return (
    <nav className="fixed bottom-3 left-1/2 z-40 w-[70%] max-w-md -translate-x-1/2 rounded-[18px] border border-border bg-card/95 p-1.5 shadow-soft backdrop-blur lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = navIconMap[item.icon]
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(event) => {
                if (!longPressTriggeredRef.current) return

                event.preventDefault()
                longPressTriggeredRef.current = false
              }}
              onTouchCancel={cancelLongPress}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              onTouchStart={() => startLongPress(item.to)}
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
