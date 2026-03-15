import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, ReceiptText, Settings2, WalletCards } from 'lucide-react'

import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { BrandMark } from '@/components/shared/BrandMark'
import { useAppTranslation } from '@/hooks/useAppTranslation'

const TITLES = [
  { prefix: '/dashboard', key: 'dashboard.title' },
  { prefix: '/transactions', key: 'transactions.title' },
  { prefix: '/budgets', key: 'budgets.title' },
  { prefix: '/settings', key: 'settings.title' },
]

export function AppShell() {
  const { pathname } = useLocation()
  const { t } = useAppTranslation()
  const currentTitle = TITLES.find((item) => pathname.startsWith(item.prefix))?.key ?? 'dashboard.title'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 pb-24 pt-4 md:px-6 lg:px-8 lg:pb-8">
        <SidebarNav />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="border-b border-border/70 pb-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <Link className="w-fit transition-opacity duration-200 hover:opacity-75" to="/dashboard">
                <BrandMark className="text-[2.4rem] md:text-[3.1rem]" />
              </Link>
              <h1 className="text-4xl font-semibold uppercase tracking-[0.06em] text-foreground md:text-6xl md:leading-none">
                {t(currentTitle)}
              </h1>
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
