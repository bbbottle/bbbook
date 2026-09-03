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

const LOCKED_KEY = 'bbbook.locked'

function getLocked(): boolean {
  try {
    return localStorage.getItem(LOCKED_KEY) === 'true'
  } catch {
    return false
  }
}

function saveLocked(locked: boolean) {
  try {
    if (locked) {
      localStorage.setItem(LOCKED_KEY, 'true')
    } else {
      localStorage.removeItem(LOCKED_KEY)
    }
  } catch {
    // ignore storage failures
  }
}

export default function App() {
  const { t } = useTranslation()
  const [authed, setAuthed] = useState(() => isAuthenticated())
  const [showLogin, setShowLogin] = useState(false)
  const [locked, setLocked] = useState(() => getLocked())
  const canFetchAccount = authed && !locked
  const sessionToken = useMemo(() => (canFetchAccount ? getSessionToken() : null), [canFetchAccount])

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
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCKED_KEY) {
        setLocked(getLocked())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
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

  const handleLock = useCallback(() => {
    setLocked(true)
    saveLocked(true)
  }, [])

  const handleUnlock = useCallback(() => {
    setLocked(false)
    saveLocked(false)
    if (!authed) {
      setShowLogin(true)
    }
  }, [authed])

  let screenContent: React.ReactNode = null
  if (authed && !locked) {
    screenContent = <AppRouter onLogout={handleLogout} onLock={handleLock} currentUser={currentUser} />
  } else if (showLogin && !locked) {
    screenContent = <LoginFlow onAuthed={handleAuthed} />
  }

  const isBlankLock = !authed && !showLogin && !locked

  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-center p-4">
      <Device wallpaper={locked ? '/assets/wallpaper.png' : false}>
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
          {locked && (
            <button
              type="button"
              aria-label={t('auth.unlock')}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent focus-visible:ku-focus-ring"
              onClick={handleUnlock}
            />
          )}
        </div>
      </Device>
    </div>
  )
}
