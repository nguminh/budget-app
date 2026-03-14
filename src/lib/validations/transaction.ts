import { z } from 'zod'

export function buildTransactionSchema(t: (key: string) => string) {
  return z.object({
    type: z.enum(['expense', 'income']),
    amount: z.coerce.number().positive(t('validation.amountPositive')),
    merchant: z.string().min(2, t('validation.merchantMin')),
    categoryId: z.string().min(1, t('validation.categoryRequired')),
    note: z.string().max(280, t('validation.noteMax')).optional().or(z.literal('')),
    transactionDate: z.string().min(1, t('validation.dateRequired')),
  })
}

