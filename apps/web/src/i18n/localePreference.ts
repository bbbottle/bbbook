import { Locales, type LocalePreference } from '@bbbook/shared-types'
import i18n from './index'
import { resolveEffectiveLocale } from './systemLocale'

const LOCALE_KEY = 'bbbook.locale'
const LOCALE_SCHEMA_VERSION = 1

const isValidLocale = (value: unknown): value is LocalePreference =>
  typeof value === 'string' && (Locales as readonly string[]).includes(value)

function parseLocalePreference(value: string): LocalePreference | null {
  if (value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value) as { version?: unknown; locale?: unknown }
      if (parsed.version === LOCALE_SCHEMA_VERSION && isValidLocale(parsed.locale)) {
        return parsed.locale
      }
      return null
    } catch {
      return isValidLocale(value) ? value : null
    }
  }
  return isValidLocale(value) ? value : null
}

export function getLocalePreference(): LocalePreference {
  try {
    const stored = localStorage.getItem(LOCALE_KEY)
    if (stored) {
      const parsed = parseLocalePreference(stored)
      if (parsed) return parsed
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
      localStorage.setItem(
        LOCALE_KEY,
        JSON.stringify({ version: LOCALE_SCHEMA_VERSION, locale: preference })
      )
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
