import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import en from './locales/en.json'
import { type LocalePreference } from '@bbbook/shared-types'
import { resolveEffectiveLocale } from './systemLocale'

export const resources = {
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  en: { translation: en },
} as const

export type I18nResources = typeof resources

function readStoredLocale(): LocalePreference {
  try {
    const value = localStorage.getItem('bbbook.locale')
    if (value === 'system' || value === 'zh-CN' || value === 'zh-TW' || value === 'en') {
      return value as LocalePreference
    }
  } catch {
    // ignore storage failures
  }
  return 'system'
}

const initialLng = resolveEffectiveLocale(readStoredLocale())

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'zh-TW', 'en'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator'],
      caches: [],
    },
  })

export default i18n
