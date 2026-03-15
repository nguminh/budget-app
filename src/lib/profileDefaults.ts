import type { User } from '@supabase/supabase-js'

import { allocationsToSave, createBudgetAllocationMap, getAutoBalanceCategoryId, type BudgetAllocation } from '@/features/budgets/lib/allocations'
import { budgetBucketDefinitions, getBudgetBuckets, type BudgetBucketKey } from '@/features/budgets/lib/budgetBuckets'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

export type BudgetPreferenceMap = Record<BudgetBucketKey, number>

export const DEFAULT_MONTHLY_BUDGET = 3000

export const DEFAULT_BUDGET_PREFERENCES: BudgetPreferenceMap = {
  bills: 1200,
  groceries: 600,
  leisure: 350,
  other: 300,
  subscriptions: 200,
  travel: 350,
}

function formatEmailName(email?: string | null) {
  const stem = (email ?? '').split('@')[0]?.trim()

  if (!stem) {
    return ''
  }

  return stem
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizeAmount(value: unknown, fallback: number) {
  const amount = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : fallback
}

export function getDefaultProfileName(user: User | null, fullName?: string | null) {
  const trimmedName = fullName?.trim()

  if (trimmedName) {
    return trimmedName
  }

  const derivedName = formatEmailName(user?.email)
  return derivedName || 'RWY Pilot'
}

export function normalizeProfileBudgetPreferences(value: unknown): BudgetPreferenceMap {
  const rawPreferences = value && typeof value === 'object' ? (value as Partial<Record<BudgetBucketKey, unknown>>) : {}

  return budgetBucketDefinitions.reduce(
    (preferences, bucket) => {
      preferences[bucket.key] = normalizeAmount(rawPreferences[bucket.key], DEFAULT_BUDGET_PREFERENCES[bucket.key])
      return preferences
    },
    {} as BudgetPreferenceMap,
  )
}

export function getBudgetAllocationsFromPreferences({
  categories,
  preferences,
  totalAmount,
}: {
  categories: Category[]
  preferences: BudgetPreferenceMap
  totalAmount: number
}) {
  const availableCategories = getBudgetBuckets(categories)
    .filter((bucket) => Boolean(bucket.categoryId))
    .map((bucket) => ({ color: bucket.color, id: bucket.categoryId, name: bucket.label }))

  if (availableCategories.length === 0) {
    return [] as BudgetAllocation[]
  }

  const initialAllocations = getBudgetBuckets(categories)
    .filter((bucket) => Boolean(bucket.categoryId))
    .map((bucket) => ({
      amount: preferences[bucket.key] ?? 0,
      categoryId: bucket.categoryId,
    }))

  return allocationsToSave(
    createBudgetAllocationMap({
      allocations: initialAllocations,
      autoBalanceCategoryId: getAutoBalanceCategoryId(availableCategories),
      categories: availableCategories,
      totalAmount,
    }),
  )
}

export function getPreferencesFromBudgetAllocations({
  allocations,
  categories,
  existingPreferences,
}: {
  allocations: BudgetAllocation[]
  categories: Category[]
  existingPreferences?: BudgetPreferenceMap
}) {
  const basePreferences = normalizeProfileBudgetPreferences(existingPreferences)
  const bucketKeyByCategoryId = new Map(
    getBudgetBuckets(categories)
      .filter((bucket) => Boolean(bucket.categoryId))
      .map((bucket) => [bucket.categoryId, bucket.key] as const),
  )

  const nextPreferences = { ...basePreferences }

  for (const key of Object.keys(nextPreferences) as BudgetBucketKey[]) {
    nextPreferences[key] = 0
  }

  for (const allocation of allocations) {
    const bucketKey = bucketKeyByCategoryId.get(allocation.categoryId)

    if (!bucketKey) {
      continue
    }

    nextPreferences[bucketKey] = allocation.amount
  }

  return nextPreferences
}
