export type BudgetCategory = {
  id: string
  label?: string
  name?: string
}

export type BudgetAllocation = {
  categoryId: string
  amount: number
}

export type AllocationMap = Record<string, number>

const CURRENCY_SCALE = 100

function toCents(amount: number) {
  if (!Number.isFinite(amount)) {
    return 0
  }

  return Math.max(0, Math.round(amount * CURRENCY_SCALE))
}

function fromCents(amountInCents: number) {
  return amountInCents / CURRENCY_SCALE
}

function getSortedRemainderIndexes(remainders: number[]) {
  return remainders
    .map((remainder, index) => ({ index, remainder }))
    .sort((left, right) => right.remainder - left.remainder)
    .map((entry) => entry.index)
}

function scaleAmountsToTotal(amountsInCents: number[], totalInCents: number) {
  const currentTotal = amountsInCents.reduce((sum, value) => sum + value, 0)

  if (currentTotal <= totalInCents) {
    return amountsInCents
  }

  if (currentTotal === 0 || totalInCents <= 0) {
    return amountsInCents.map(() => 0)
  }

  const scaledValues = amountsInCents.map((value) => (value * totalInCents) / currentTotal)
  const flooredValues = scaledValues.map((value) => Math.floor(value))
  let centsToDistribute = totalInCents - flooredValues.reduce((sum, value) => sum + value, 0)

  for (const index of getSortedRemainderIndexes(scaledValues.map((value, itemIndex) => value - flooredValues[itemIndex]))) {
    if (centsToDistribute <= 0) {
      break
    }

    flooredValues[index] += 1
    centsToDistribute -= 1
  }

  return flooredValues
}

function getCategoryLabel(category: BudgetCategory) {
  return (category.name ?? category.label ?? '').trim()
}

export function getAutoBalanceCategoryId(categories: BudgetCategory[], preferredCategoryId?: string | null) {
  if (preferredCategoryId && categories.some((category) => category.id === preferredCategoryId)) {
    return preferredCategoryId
  }

  const namedOtherCategory = categories.find((category) => getCategoryLabel(category).toLowerCase() === 'other')
  return namedOtherCategory?.id ?? categories.at(-1)?.id ?? null
}

function buildNormalizedAllocationMap({
  allocations,
  autoBalanceCategoryId,
  categories,
  totalAmount,
}: {
  allocations: AllocationMap
  autoBalanceCategoryId?: string | null
  categories: BudgetCategory[]
  totalAmount: number
}) {
  const totalInCents = toCents(totalAmount)
  const resolvedAutoCategoryId = getAutoBalanceCategoryId(categories, autoBalanceCategoryId)
  const normalizedEntries = categories.map((category) => [category.id, toCents(allocations[category.id] ?? 0)] as const)
  const explicitEntries = normalizedEntries.filter(([categoryId]) => categoryId !== resolvedAutoCategoryId)
  let explicitTotal = explicitEntries.reduce((sum, [, amount]) => sum + amount, 0)

  const result = Object.fromEntries(normalizedEntries.map(([categoryId]) => [categoryId, 0])) as AllocationMap

  if (explicitTotal > totalInCents) {
    const scaledValues = scaleAmountsToTotal(explicitEntries.map(([, amount]) => amount), totalInCents)

    explicitEntries.forEach(([categoryId], index) => {
      result[categoryId] = fromCents(scaledValues[index])
    })

    explicitTotal = totalInCents
  } else {
    explicitEntries.forEach(([categoryId, amount]) => {
      result[categoryId] = fromCents(amount)
    })
  }

  if (resolvedAutoCategoryId) {
    result[resolvedAutoCategoryId] = fromCents(Math.max(0, totalInCents - explicitTotal))
  }

  return result
}

export function createBudgetAllocationMap({
  allocations,
  autoBalanceCategoryId,
  categories,
  totalAmount,
}: {
  allocations?: BudgetAllocation[]
  autoBalanceCategoryId?: string | null
  categories: BudgetCategory[]
  totalAmount: number
}) {
  const nextAllocations = Object.fromEntries(categories.map((category) => [category.id, 0])) as AllocationMap

  for (const allocation of allocations ?? []) {
    nextAllocations[allocation.categoryId] = allocation.amount
  }

  return buildNormalizedAllocationMap({
    allocations: nextAllocations,
    autoBalanceCategoryId,
    categories,
    totalAmount,
  })
}

export function getCategoryAllocationLimit({
  allocations,
  autoBalanceCategoryId,
  categoryId,
  categories,
  totalAmount,
}: {
  allocations: AllocationMap
  autoBalanceCategoryId?: string | null
  categoryId: string
  categories: BudgetCategory[]
  totalAmount: number
}) {
  const resolvedAutoCategoryId = getAutoBalanceCategoryId(categories, autoBalanceCategoryId)

  if (categoryId === resolvedAutoCategoryId) {
    return allocations[categoryId] ?? 0
  }

  const totalInCents = toCents(totalAmount)
  const remainingExplicitTotal = categories
    .filter((category) => category.id !== resolvedAutoCategoryId && category.id !== categoryId)
    .reduce((sum, category) => sum + toCents(allocations[category.id] ?? 0), 0)

  return fromCents(Math.max(0, totalInCents - remainingExplicitTotal))
}

export function rebalanceAllocationsForTotal({
  allocations,
  autoBalanceCategoryId,
  categories,
  totalAmount,
}: {
  allocations: AllocationMap
  autoBalanceCategoryId?: string | null
  categories: BudgetCategory[]
  totalAmount: number
}) {
  return buildNormalizedAllocationMap({
    allocations,
    autoBalanceCategoryId,
    categories,
    totalAmount,
  })
}

export function setCategoryAllocationAmount({
  allocations,
  autoBalanceCategoryId,
  amount,
  categoryId,
  categories,
  totalAmount,
}: {
  allocations: AllocationMap
  autoBalanceCategoryId?: string | null
  amount: number
  categoryId: string
  categories: BudgetCategory[]
  totalAmount: number
}) {
  const resolvedAutoCategoryId = getAutoBalanceCategoryId(categories, autoBalanceCategoryId)

  if (categoryId === resolvedAutoCategoryId) {
    return buildNormalizedAllocationMap({
      allocations,
      autoBalanceCategoryId: resolvedAutoCategoryId,
      categories,
      totalAmount,
    })
  }

  const nextAllocations = { ...allocations }
  const maxAmount = getCategoryAllocationLimit({
    allocations,
    autoBalanceCategoryId: resolvedAutoCategoryId,
    categoryId,
    categories,
    totalAmount,
  })

  nextAllocations[categoryId] = Math.min(Math.max(0, amount), maxAmount)

  return buildNormalizedAllocationMap({
    allocations: nextAllocations,
    autoBalanceCategoryId: resolvedAutoCategoryId,
    categories,
    totalAmount,
  })
}

export function allocationsToSave(allocations: AllocationMap) {
  return Object.entries(allocations)
    .map(([categoryId, amount]) => ({ categoryId, amount: fromCents(toCents(amount)) }))
    .filter((allocation) => allocation.amount > 0)
}
