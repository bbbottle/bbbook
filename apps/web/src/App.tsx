import { useEffect, useState } from 'react'
import { Button, Device } from '@bbbook/kindle-ui'
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

  const handleToggleLogin = () => {
    if (authed) {
      handleLogout()
    } else {
      setShowLogin((v) => !v)
    }
  }

  const controlLabel = authed ? '登出' : showLogin ? '取消登录' : '登录'

  let screenContent: React.ReactNode = null
  if (authed) {
    screenContent = <AppRouter />
  } else if (showLogin) {
    screenContent = <LoginFlow onAuthed={handleAuthed} />
  }

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center gap-6 p-4 md:flex-row md:gap-8">
      <Device wallpaper={false}>
        <div className="h-full w-full transition-opacity duration-[var(--ku-motion-base)]">
          {screenContent}
        </div>
      </Device>
      <Button variant="outline" onClick={handleToggleLogin}>
        {controlLabel}
      </Button>
    </div>
  )
}
