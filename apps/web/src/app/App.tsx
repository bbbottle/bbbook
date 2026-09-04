import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'
import useSWR from 'swr'
import { Device } from '@bbbook/kindle-ui/components/Device'
import '@bbbook/kindle-ui/styles'
import {
  fetchCurrentUser,
  fetchUserPreference,
} from '../features/auth/api/auth.js'
import {
  fetchDeviceInfo,
  type DeviceInfo,
} from '../features/device/api/device.js'
import { DEVICE_INFO_CACHE_KEY } from '../features/device/model/device.js'
import { useApiLoading } from '../shared/api/loading.js'
import { clearSessionToken, useSessionToken } from '../shared/auth/session.js'
import { createStoredBoolean } from '../shared/lib/storedBoolean.js'
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
  const apiLoading = useApiLoading()

  const { data: currentUserData } = useSWR(
    accountKey ? `current-user:${accountKey}` : null,
    fetchCurrentUser
  )
  const { data: prefData } = useSWR(
    accountKey ? `user-preference:${accountKey}` : null,
    fetchUserPreference
  )
  const { data: deviceInfo } = useSWR<DeviceInfo>(
    sessionToken ? DEVICE_INFO_CACHE_KEY : null,
    fetchDeviceInfo,
    {
      dedupingInterval: 60_000,
      refreshInterval: 60_000,
    }
  )

  const indicatorStatus = apiLoading
    ? 'blink'
    : sessionToken && deviceInfo?.isCharging
      ? 'on'
      : 'off'

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
        deviceInfo={deviceInfo}
      />
    )
  } else if (showLogin && !locked) {
    screenContent = <LoginFlow onAuthed={handleAuthed} />
  }

  const isBlankLock = !sessionToken && !showLogin && !locked

  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-center p-4">
      <Device
        status={indicatorStatus}
        wallpaper={locked ? '/assets/wallpaper.png' : false}
      >
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
          <Toaster
            position="bottom-center"
            className="!absolute !z-40"
            style={{ ['--width' as string]: 'calc(100% - 2rem)' }}
            toastOptions={{ className: '!rounded-none !border-ink' }}
          />
        </div>
      </Device>
    </div>
  )
}
