import { useEffect, useState } from 'react'
import { Device } from '@bbbook/kindle-ui'
import { clearSessionToken, isAuthenticated } from './api/auth.js'
import { AppRouter } from './app/AppRouter.js'
import { LoginFlow } from './features/auth/LoginFlow.js'

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    const check = () => setAuthed(isAuthenticated())
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  const handleAuthed = () => {
    setAuthed(true)
    setShowLogin(false)
  }

  const handleLogout = () => {
    clearSessionToken()
    setAuthed(false)
    setShowLogin(false)
  }

  let screenContent: React.ReactNode = null
  if (authed) {
    screenContent = <AppRouter onLogout={handleLogout} />
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
