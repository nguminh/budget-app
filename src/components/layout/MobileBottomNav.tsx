import { useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

import { navIconMap } from '@/components/layout/AppShell'
import { NAV_ITEMS } from '@/lib/constants'
import { useAppTranslation } from '@/hooks/useAppTranslation'

export function MobileBottomNav() {
  const { t } = useAppTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const longPressTimerRef = useRef<number | null>(null)
  const longPressTriggeredRef = useRef(false)
  const activeIndex = Math.max(0, NAV_ITEMS.findIndex((item) => pathname.startsWith(item.to)))

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
    <nav className="fixed bottom-3 left-1/2 z-40 w-[92%] max-w-lg -translate-x-1/2 rounded-[20px] border border-border/80 bg-card/95 p-1.5 shadow-soft backdrop-blur lg:hidden">
      <div className="relative grid grid-cols-4 gap-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 left-0 top-1 w-[calc(25%-0.1875rem)] rounded-2xl bg-foreground shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 0.25}rem))` }}
        />
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
                  'relative z-10 flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[10px] font-bold uppercase tracking-[0.09em] transition-all duration-300 ease-out active:scale-[0.98]',
                  isActive ? 'text-accentForeground' : 'text-ink/65',
                ].join(' ')
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
