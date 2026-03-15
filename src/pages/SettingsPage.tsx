import { Crown, LogOut, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { LoadingState } from '@/components/shared/LoadingState'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ExportButton } from '@/features/settings/exportCsv'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import i18n from '@/i18n'
import { LANGUAGE_STORAGE_KEY } from '@/lib/constants'
import { getDefaultProfileName } from '@/lib/profileDefaults'
import { supabase } from '@/lib/supabase'

export function SettingsPage() {
  const { t } = useAppTranslation()
  const { user, profile, profileLoading, refreshProfile } = useAuth()
  const [language, setLanguage] = useState(i18n.language)
  const [fullName, setFullName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const defaultName = useMemo(() => getDefaultProfileName(user, profile?.full_name), [profile?.full_name, user])

  useEffect(() => {
    if (profileLoading) {
      return
    }

    setLanguage(profile?.locale ?? i18n.language)
    setFullName(defaultName)
  }, [defaultName, profile?.locale, profileLoading])

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

  const handleProfileSave = async () => {
    if (!user) {
      return
    }

    setSavingProfile(true)

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName.trim() || defaultName,
      })

      if (error) {
        throw error
      }

      await refreshProfile()
      toast.success(t('settings.profileSaved'))
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : t('settings.profileSaveError'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success(t('settings.signOutSuccess'))
  }

  if (profileLoading) {
    return <LoadingState label={t('common.loading')} />
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col gap-6 pt-5">
            <div className="rounded-[28px] bg-muted p-5">
              <p className="font-body text-sm text-ink/60">{t('settings.email')}</p>
              <p className="mt-1 text-lg font-semibold">{user?.email ?? '-'}</p>
            </div>
            <LanguageSwitcher value={language} onChange={(value) => void handleLanguageChange(value)} />
            <ExportButton userId={user?.id} />
            <Button variant="danger" onClick={() => void handleSignOut()}>
              <LogOut className="size-4" />
              {t('settings.signOut')}
            </Button>
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

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-[radial-gradient(circle_at_top_right,_rgba(31,111,95,0.12),_transparent_42%)]">
          <CardTitle>{t('settings.profileSetupTitle')}</CardTitle>
          <p className="max-w-2xl font-body text-sm text-ink/65">{t('settings.profileSetupHint')}</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <label className="font-body text-sm font-medium text-foreground" htmlFor="settings-full-name">
              {t('auth.fullName')}
            </label>
            <Input
              autoComplete="name"
              className="h-12 rounded-2xl px-4 text-base"
              id="settings-full-name"
              onChange={(event) => setFullName(event.target.value)}
              value={fullName}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="h-12 rounded-2xl px-6 text-base" onClick={() => void handleProfileSave()} disabled={savingProfile}>
              <Sparkles className="size-4" />
              {savingProfile ? t('common.loading') : t('settings.saveProfile')}
            </Button>
            <Button className="h-12 rounded-2xl px-6 text-base" type="button" variant="outline" onClick={() => setFullName(defaultName)}>
              {t('settings.resetProfile')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPage
