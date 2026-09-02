import { type LocalePreference } from '@bbbook/shared-types'

export const resolveSystemLocale = (): LocalePreference => {
  const language = typeof navigator !== 'undefined' ? navigator.language : 'zh-CN'
  return normalizeLocale(language)
}

export const normalizeLocale = (language: string): LocalePreference => {
  const lang = language.toLowerCase()

  if (
    lang === 'zh-cn' ||
    lang === 'zh-sg' ||
    lang.startsWith('zh-hans')
  ) {
    return 'zh-CN'
  }

  if (
    lang === 'zh-tw' ||
    lang === 'zh-hk' ||
    lang === 'zh-mo' ||
    lang.startsWith('zh-hant')
  ) {
    return 'zh-TW'
  }

  if (lang.startsWith('en')) {
    return 'en'
  }

  return 'zh-CN'
}

export const resolveEffectiveLocale = (preference: LocalePreference): LocalePreference => {
  if (preference === 'system') {
    return resolveSystemLocale()
  }
  return preference
}

export const LocaleOptions: { value: LocalePreference; labelKey: string }[] = [
  { value: 'system', labelKey: 'settings.languageSystem' },
  { value: 'zh-CN', labelKey: 'settings.languageZhCN' },
  { value: 'zh-TW', labelKey: 'settings.languageZhTW' },
  { value: 'en', labelKey: 'settings.languageEn' },
] as const
