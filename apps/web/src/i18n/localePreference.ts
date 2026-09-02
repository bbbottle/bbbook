import { type LocalePreference } from '@bbbook/shared-types'
import i18n from './index'
import { resolveEffectiveLocale } from './systemLocale'

const LOCALE_KEY = 'bbbook.locale'

export function getLocalePreference(): LocalePreference {
  try {
    const value = localStorage.getItem(LOCALE_KEY)
    if (value === 'system' || value === 'zh-CN' || value === 'zh-TW' || value === 'en') {
      return value
    }
  } catch {
    // ignore storage failures
  }
  return 'system'
}

export function setLocalePreference(preference: LocalePreference) {
  try {
    if (preference === 'system') {
      localStorage.removeItem(LOCALE_KEY)
    } else {
      localStorage.setItem(LOCALE_KEY, preference)
    }
  } catch {
    // ignore storage failures
  }
  applyLocalePreference(preference)
}

export function applyLocalePreference(preference: LocalePreference) {
  const effective = resolveEffectiveLocale(preference)
  if (i18n.language !== effective) {
    i18n.changeLanguage(effective)
  }
}

export function initializeLocale() {
  const preference = getLocalePreference()
  applyLocalePreference(preference)
  return preference
}
