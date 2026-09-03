import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Device } from '@bbbook/kindle-ui/components/Device'
import '@bbbook/kindle-ui/styles'
import {
  clearSessionToken,
  fetchCurrentUser,
  fetchUserPreference,
  getSessionToken,
  isAuthenticated,
} from './api/auth.js'
import { AppRouter } from './app/AppRouter.js'
import { LoginFlow } from './features/auth/LoginFlow.js'
import { initializeLocale, setLocalePreference } from './i18n/localePreference'
import { useCached } from './lib/useCached.js'

export default function App() {
  const { t } = useTranslation()
  const [authed, setAuthed] = useState(() => isAuthenticated())
  const [showLogin, setShowLogin] = useState(false)
  const sessionToken = useMemo(() => (authed ? getSessionToken() : null), [authed])

  const { data: currentUserData } = useCached({
    key: sessionToken ? `current-user:${sessionToken}` : null,
    fn: fetchCurrentUser,
  })
  const { data: prefData } = useCached({
    key: sessionToken ? `user-preference:${sessionToken}` : null,
    fn: fetchUserPreference,
  })

  useEffect(() => {
    initializeLocale()
  }, [])

  useEffect(() => {
    const check = () => setAuthed(isAuthenticated())
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  useEffect(() => {
    if (prefData) {
      setLocalePreference(prefData.locale)
    }
  }, [prefData])

  const currentUser = currentUserData ?? null

  const handleAuthed = useCallback(() => {
    setAuthed(true)
    setShowLogin(false)
  }, [])

  const handleLogout = useCallback(() => {
    clearSessionToken()
    setAuthed(false)
    setShowLogin(false)
  }, [])

  let screenContent: React.ReactNode = null
  if (authed) {
    screenContent = <AppRouter onLogout={handleLogout} currentUser={currentUser} />
  } else if (showLogin) {
    screenContent = <LoginFlow onAuthed={handleAuthed} />
  }

  const isBlankLock = !authed && !showLogin

  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-center p-4">
      <Device wallpaper={false}>
        <div className="relative h-full w-full">
          {screenContent}
          {isBlankLock && (
            <button
              type="button"
              aria-label={t('auth.login')}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent focus-visible:ku-focus-ring"
              onClick={() => setShowLogin(true)}
            />
          )}
        </div>
      </Device>
    </div>
  )
}
