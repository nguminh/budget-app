export const LANGUAGE_STORAGE_KEY = 'budget-app-language'

export const NAV_ITEMS = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: 'LayoutDashboard' },
  { to: '/transactions', labelKey: 'nav.transactions', icon: 'ReceiptText' },
  { to: '/budgets', labelKey: 'nav.budgets', icon: 'WalletCards' },
  { to: '/settings', labelKey: 'nav.settings', icon: 'Settings2' },
] as const

export const TRANSACTION_TYPES = ['expense', 'income'] as const

