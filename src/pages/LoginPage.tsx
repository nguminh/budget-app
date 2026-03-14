import { Wallet2 } from 'lucide-react'

import { AuthForm } from '@/features/auth/components/AuthForm'
import { useAppTranslation } from '@/hooks/useAppTranslation'

export function LoginPage() {
  const { t } = useAppTranslation()

  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[36px] border border-border bg-[radial-gradient(circle_at_top,_rgba(31,111,95,0.16),_transparent_45%),linear-gradient(135deg,#fff8ec_0%,#f4efe6_100%)] p-8 shadow-soft md:p-12">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground">
              <Wallet2 className="size-4 text-accent" />
              {t('app.name')}
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-foreground md:text-5xl">{t('auth.welcome')}</h1>
            <p className="mt-4 max-w-lg font-body text-lg text-ink/75">{t('app.tagline')}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-border bg-card/80 p-4">
                <p className="font-body text-sm text-ink/65">Auth</p>
                <p className="mt-2 text-lg font-semibold">Supabase</p>
              </div>
              <div className="rounded-[24px] border border-border bg-card/80 p-4">
                <p className="font-body text-sm text-ink/65">Tracking</p>
                <p className="mt-2 text-lg font-semibold">Transactions</p>
              </div>
              <div className="rounded-[24px] border border-border bg-card/80 p-4">
                <p className="font-body text-sm text-ink/65">Planning</p>
                <p className="mt-2 text-lg font-semibold">Budgets</p>
              </div>
            </div>
          </div>
        </section>
        <div className="flex justify-center lg:justify-end">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}

