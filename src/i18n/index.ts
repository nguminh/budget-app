import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { LANGUAGE_STORAGE_KEY } from '@/lib/constants'
import enCommon from '@/i18n/locales/en/common.json'
import frCommon from '@/i18n/locales/fr/common.json'

const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? 'en'

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon },
    fr: { common: frCommon },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
})

export default i18n

