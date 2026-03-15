import type { Database } from '@/types/database'

type Budget = Database['public']['Tables']['budgets']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

export type BudgetBucketKey = 'bills' | 'groceries' | 'leisure' | 'other' | 'subscriptions' | 'travel'

type BudgetBucketDefinition = {
  color: string
  key: BudgetBucketKey
  label: string
  showInDashboard: boolean
  storageCategoryName: string
}

export const budgetBucketDefinitions: BudgetBucketDefinition[] = [
  { color: '#ef4444', key: 'bills', label: 'Bills', showInDashboard: true, storageCategoryName: 'Bills' },
  { color: '#f59e0b', key: 'leisure', label: 'Leisure', showInDashboard: true, storageCategoryName: 'Entertainment' },
  { color: '#8b5cf6', key: 'subscriptions', label: 'Subscriptions', showInDashboard: true, storageCategoryName: 'Health' },
  { color: '#22c55e', key: 'groceries', label: 'Groceries', showInDashboard: true, storageCategoryName: 'Groceries' },
  { color: '#3b82f6', key: 'travel', label: 'Travel', showInDashboard: true, storageCategoryName: 'Transport' },
  { color: '#6b7280', key: 'other', label: 'Other', showInDashboard: false, storageCategoryName: 'Other' },
]

function normalizeCategoryName(name?: string | null) {
  return (name ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function getBudgetBucketKeyForExpense(name?: string | null): BudgetBucketKey {
  const normalizedName = normalizeCategoryName(name)

  if (normalizedName === 'bills') {
    return 'bills'
  }

  if (normalizedName === 'groceries') {
    return 'groceries'
  }

  if (normalizedName === 'transport' || normalizedName === 'travel') {
    return 'travel'
  }

  if (normalizedName === 'subscriptions' || normalizedName === 'subscription') {
    return 'subscriptions'
  }

  if (normalizedName === 'dining' || normalizedName === 'entertainment' || normalizedName === 'shopping' || normalizedName === 'leisure') {
    return 'leisure'
  }

  if (
    normalizedName === 'health' ||
    normalizedName === 'pet care' ||
    normalizedName === 'petcare' ||
    normalizedName === 'pets' ||
    normalizedName === 'pet' ||
    normalizedName === 'gym' ||
    normalizedName === 'other'
  ) {
    return 'other'
  }

  return 'other'
}

export function getBudgetBuckets(categories: Category[]) {
  const expenseCategories = categories.filter((category) => category.kind === 'expense')

  return budgetBucketDefinitions.map((definition) => {
    const storageCategory = expenseCategories.find(
      (category) => normalizeCategoryName(category.name) === normalizeCategoryName(definition.storageCategoryName),
    )

    return {
      ...definition,
      categoryId: storageCategory?.id ?? '',
    }
  })
}

export function getBudgetBucketAllocations({
  categories,
  categoryBudgets,
}: {
  categories: Category[]
  categoryBudgets: Budget[]
}) {
  const budgetsByCategoryId = new Map(
    categoryBudgets.flatMap((budget) => (budget.category_id ? [[budget.category_id, Number(budget.amount)]] : [])),
  )

  return getBudgetBuckets(categories).map((bucket) => ({
    ...bucket,
    amount: bucket.categoryId ? budgetsByCategoryId.get(bucket.categoryId) ?? 0 : 0,
  }))
}

export function getBudgetBucketTracking({
  categories,
  categoryBudgets,
  transactions,
}: {
  categories: Category[]
  categoryBudgets: Budget[]
  transactions: Transaction[]
}) {
  const budgetBuckets = getBudgetBucketAllocations({ categories, categoryBudgets })
  const spendingByBucket = transactions.reduce(
    (accumulator, transaction) => {
      if (transaction.type !== 'expense') {
        return accumulator
      }

      const bucketKey = getBudgetBucketKeyForExpense(transaction.category_name)
      accumulator[bucketKey] = (accumulator[bucketKey] ?? 0) + Number(transaction.amount)
      return accumulator
    },
    {} as Record<BudgetBucketKey, number>,
  )

  return budgetBuckets.map((bucket) => ({
    ...bucket,
    budgetAmount: bucket.amount,
    spentAmount: spendingByBucket[bucket.key] ?? 0,
  }))
}
