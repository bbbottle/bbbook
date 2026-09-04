import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Device } from '@bbbook/kindle-ui/components/Device'
import '@bbbook/kindle-ui/styles'
import {
  fetchCurrentUser,
  fetchUserPreference,
} from '../features/auth/api/auth.js'
import { clearSessionToken, useSessionToken } from '../shared/auth/session.js'
import { createStoredBoolean } from '../shared/lib/storedBoolean.js'
import { useCached } from '../shared/lib/useCached.js'
import { setLocalePreference } from '../i18n/localePreference.js'

const AppRouter = lazy(() =>
  import('./AppRouter.js').then((module) => ({ default: module.AppRouter }))
)
const LoginFlow = lazy(() =>
  import('../features/auth/ui/LoginFlow.js').then((module) => ({
    default: module.LoginFlow,
  }))
)
const lockedStore = createStoredBoolean('bbbook.locked')

export default function App() {
  const { t } = useTranslation()
  const sessionToken = useSessionToken()
  const [showLogin, setShowLogin] = useState(false)
  const locked = lockedStore.useValue()
  const accountKey = sessionToken && !locked ? sessionToken : null

  const { data: currentUserData } = useCached({
    key: accountKey ? `current-user:${accountKey}` : null,
    fn: fetchCurrentUser,
  })
  const { data: prefData } = useCached({
    key: accountKey ? `user-preference:${accountKey}` : null,
    fn: fetchUserPreference,
  })

  useEffect(() => {
    if (prefData) {
      setLocalePreference(prefData.locale)
    }
  }, [prefData])

  const currentUser = currentUserData ?? null

  const handleAuthed = useCallback(() => {
    setShowLogin(false)
  }, [])

  const handleLogout = useCallback(() => {
    clearSessionToken()
    setShowLogin(false)
  }, [])

  const handleLock = useCallback(() => {
    lockedStore.set(true)
  }, [])

  const handleUnlock = useCallback(() => {
    lockedStore.set(false)
    if (!sessionToken) {
      setShowLogin(true)
    }
  }, [sessionToken])

  let screenContent: React.ReactNode = null
  if (sessionToken && !locked) {
    screenContent = (
      <AppRouter
        onLogout={handleLogout}
        onLock={handleLock}
        currentUser={currentUser}
      />
    )
  } else if (showLogin && !locked) {
    screenContent = <LoginFlow onAuthed={handleAuthed} />
  }

  const isBlankLock = !sessionToken && !showLogin && !locked

  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-center p-4">
      <Device wallpaper={locked ? '/assets/wallpaper.png' : false}>
        <div className="relative h-full w-full">
          <Suspense fallback={null}>{screenContent}</Suspense>
          {isBlankLock ? (
            <button
              type="button"
              aria-label={t('auth.login')}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent focus-visible:ku-focus-ring"
              onClick={() => setShowLogin(true)}
            />
          ) : null}
          {locked ? (
            <button
              type="button"
              aria-label={t('auth.unlock')}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent focus-visible:ku-focus-ring"
              onClick={handleUnlock}
            />
          ) : null}
        </div>
      </Device>
    </div>
  )
}
