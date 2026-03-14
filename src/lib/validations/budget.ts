import { z } from 'zod'

export function buildBudgetSchema(t: (key: string) => string) {
  return z.object({
    month: z.string().min(1, t('validation.monthRequired')),
    amount: z.coerce.number().positive(t('validation.amountPositive')),
  })
}

