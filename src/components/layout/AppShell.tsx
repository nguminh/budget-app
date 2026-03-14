import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { CircleDollarSign, LayoutDashboard, ReceiptText, Settings2, WalletCards } from 'lucide-react'

import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { useAppTranslation } from '@/hooks/useAppTranslation'

const TITLES: Record<string, string> = {
  '/dashboard': 'dashboard.title',
  '/transactions': 'transactions.title',
  '/budgets': 'budgets.title',
  '/settings': 'settings.title',
}

export function AppShell() {
  const { pathname } = useLocation()
  const { t } = useAppTranslation()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 pb-24 pt-4 md:px-6 lg:px-8 lg:pb-8">
        <SidebarNav />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="rounded-[30px] border border-border bg-card/90 px-5 py-4 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-body text-xs uppercase tracking-[0.25em] text-ink/55">{t('app.name')}</p>
                <h1 className="mt-1 text-2xl font-semibold">{t(TITLES[pathname] ?? 'dashboard.title')}</h1>
              </div>
              <Link to="/dashboard" className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium">
                <CircleDollarSign className="size-4 text-accent" />
                <span className="hidden sm:inline">{t('app.tagline')}</span>
              </Link>
            </div>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  )
}

export const navIconMap = {
  LayoutDashboard,
  ReceiptText,
  WalletCards,
  Settings2,
}

