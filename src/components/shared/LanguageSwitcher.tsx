import { Languages } from 'lucide-react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppTranslation } from '@/hooks/useAppTranslation'

export function LanguageSwitcher({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useAppTranslation()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Languages className="size-4 text-accent" />
        <span>{t('settings.language')}</span>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('settings.selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="fr">Français</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

