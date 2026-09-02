import { useEffect, useState } from 'react'
import { Device } from '@bbbook/kindle-ui'
import { clearSessionToken, fetchCurrentUser, isAuthenticated, type CurrentUser } from './api/auth.js'
import { AppRouter } from './app/AppRouter.js'
import { LoginFlow } from './features/auth/LoginFlow.js'

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [showLogin, setShowLogin] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const check = () => setAuthed(isAuthenticated())
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  useEffect(() => {
    if (authed && !currentUser) {
      fetchCurrentUser().then(setCurrentUser).catch(() => setCurrentUser(null))
    }
    if (!authed) {
      setCurrentUser(null)
    }
  }, [authed, currentUser])

  const handleAuthed = () => {
    setAuthed(true)
    setShowLogin(false)
    fetchCurrentUser().then(setCurrentUser).catch(() => setCurrentUser(null))
  }

  const handleLogout = () => {
    clearSessionToken()
    setAuthed(false)
    setShowLogin(false)
    setCurrentUser(null)
  }

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
        <div className="relative h-full w-full transition-opacity duration-[var(--ku-motion-base)]">
          {screenContent}
          {isBlankLock && (
            <button
              type="button"
              aria-label="登录"
              className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent focus-visible:ku-focus-ring"
              onClick={() => setShowLogin(true)}
            />
          )}
        </div>
      </Device>
    </div>
  )
}
