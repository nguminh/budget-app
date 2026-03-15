import { Languages } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/shared/BrandMark'
import { AuthForm } from '@/features/auth/components/AuthForm'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import i18n from '@/i18n'
import { LANGUAGE_STORAGE_KEY } from '@/lib/constants'

export function LoginPage() {
  const { t, i18n: appI18n } = useAppTranslation()

  const handleLanguageChange = (value: 'en' | 'fr') => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, value)
    void i18n.changeLanguage(value)
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-6">
      <div className="mx-auto flex max-w-6xl justify-end pb-4">
        <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/85 p-1 shadow-soft">
          <span className="px-2 text-ink/60" aria-hidden="true">
            <Languages className="size-4" />
          </span>
          <Button
            className="h-8 rounded-full px-3 text-xs uppercase tracking-[0.18em]"
            type="button"
            variant={appI18n.language === 'fr' ? 'ghost' : 'default'}
            onClick={() => handleLanguageChange('en')}
          >
            EN
          </Button>
          <Button
            className="h-8 rounded-full px-3 text-xs uppercase tracking-[0.18em]"
            type="button"
            variant={appI18n.language === 'fr' ? 'default' : 'ghost'}
            onClick={() => handleLanguageChange('fr')}
          >
            FR
          </Button>
        </div>
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[36px] border border-border bg-[radial-gradient(circle_at_top,_rgba(31,111,95,0.16),_transparent_45%),linear-gradient(135deg,#fff8ec_0%,#f4efe6_100%)] p-8 shadow-soft md:p-12">
          <div className="max-w-xl">
            <BrandMark className="text-[2.4rem] md:text-[2.8rem]" />
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-foreground md:text-5xl">{t('auth.welcome')}</h1>
            <p className="mt-4 max-w-lg font-body text-lg text-ink/75">{t('app.tagline')}</p>
          </div>
        </section>
        <div className="flex justify-center lg:justify-end">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}

export default LoginPage
