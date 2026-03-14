import { clsx, type ClassValue } from 'clsx'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'CAD', locale = 'en-CA') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function getMonthDateRange(date = new Date()) {
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
    label: format(startOfMonth(date), 'yyyy-MM'),
  }
}

export function normalizeBudgetMonth(monthValue: string) {
  if (!monthValue) {
    return format(startOfMonth(new Date()), 'yyyy-MM-01')
  }

  const [year, month] = monthValue.split('-')
  return `${year}-${month}-01`
}

export function formatMonthInput(date = new Date()) {
  return format(startOfMonth(date), 'yyyy-MM')
}

export function getLocalDateInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}
