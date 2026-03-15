import { Crown, LogOut } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { exportUserDataAsCSV } from "../utils/exportCsv";
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import i18n from '@/i18n'
import { LANGUAGE_STORAGE_KEY } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

export function SettingsPage() {
  const { t } = useAppTranslation()
  const { user, profile, refreshProfile } = useAuth()
  const [language, setLanguage] = useState(i18n.language)
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = async (value: string) => {
    setLanguage(value)
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, value)
    await i18n.changeLanguage(value)

    if (user) {
      await supabase.from('profiles').upsert({ id: user.id, locale: value as 'en' | 'fr' })
      await refreshProfile()
    }

    toast.success(t('settings.languageSaved'))
  }

  async function handleClick() {
    setLoading(true);
    try {
      await exportUserDataAsCSV(supabase, user?user.id:null);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success(t('settings.signOutSuccess'))
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="rounded-[28px] bg-muted p-5">
            <p className="font-body text-sm text-ink/60">{t('settings.email')}</p>
            <p className="mt-1 text-lg font-semibold">{user?.email ?? '-'}</p>
          </div>
          <LanguageSwitcher value={language} onChange={(value) => void handleLanguageChange(value)} />
          <Button variant="default" onClick={() => handleClick()}>Export your data as CSV</Button>
          <Button variant="danger" onClick={() => void handleSignOut()}><LogOut className="size-4" />{t('settings.signOut')}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.plan')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[28px] border border-border bg-[linear-gradient(135deg,#1f6f5f_0%,#264653_100%)] p-6 text-accentForeground shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Crown className="size-5" />
              </div>
              <div>
                <p className="font-body text-xs uppercase tracking-[0.25em] text-white/70">{t('settings.plan')}</p>
                <h3 className="text-2xl font-semibold">{profile?.plan ?? 'free'}</h3>
              </div>
            </div>
            <p className="mt-4 max-w-md font-body text-sm text-white/80">{t('settings.premiumTeaser')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPage

