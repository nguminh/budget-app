import { z } from 'zod'

export function buildAuthSchema(t: (key: string) => string, isSignup: boolean) {
  return z.object({
    fullName: isSignup ? z.string().min(2, t('validation.fullNameMin')) : z.string().optional(),
    email: z.string().email(t('validation.email')),
    password: z.string().min(6, t('validation.passwordMin')),
  })
}

