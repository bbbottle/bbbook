import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LocalePreference } from '@bbbook/shared-types'
import { Button } from '@bbbook/kindle-ui/components/Button'
import { Section } from '@bbbook/kindle-ui/components/Section'
import { updateUserPreference } from '../../auth/api/auth.js'
import {
  getLocalePreference,
  setLocalePreference,
} from '../../../i18n/localePreference.js'
import { LocaleOptions } from '../../../i18n/systemLocale.js'

export function LanguagePage() {
  const { t } = useTranslation()
  const [preference, setPreference] =
    useState<LocalePreference>(getLocalePreference)
  const latestPreferenceRef = useRef(preference)
  const savingRef = useRef(false)

  const syncBackend = async () => {
    if (savingRef.current) return
    savingRef.current = true
    try {
      while (true) {
        const value = latestPreferenceRef.current
        try {
          await updateUserPreference({ locale: value })
        } catch {
          // The local preference remains usable while the backend is unavailable.
        }
        if (latestPreferenceRef.current === value) break
      }
    } finally {
      savingRef.current = false
    }
  }

  const handleChange = (value: LocalePreference) => {
    setLocalePreference(value)
    setPreference(value)
    latestPreferenceRef.current = value
    void syncBackend()
  }

  return (
    <Section className="flex flex-col gap-4 py-4">
      <div className="flex flex-col gap-2 px-4">
        {LocaleOptions.map((option) => (
          <Button
            key={option.value}
            variant={preference === option.value ? 'default' : 'outline'}
            onClick={() => handleChange(option.value)}
          >
            {t(option.labelKey)}
          </Button>
        ))}
      </div>
    </Section>
  )
}
