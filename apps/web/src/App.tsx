import { useEffect, useState } from 'react'
import { Device } from '@bbbook/kindle-ui'
import { isAuthenticated } from './api/auth.js'
import { AppRouter } from './app/AppRouter.js'
import { LoginFlow } from './features/auth/LoginFlow.js'

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())

  useEffect(() => {
    const check = () => setAuthed(isAuthenticated())
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  return (
    <div className="flex min-h-full w-full items-center justify-center p-4">
      <Device wallpaper={authed ? false : undefined}>
        <div className="h-full w-full transition-opacity duration-[var(--ku-motion-base)]">
          {authed ? <AppRouter /> : <LoginFlow onAuthed={() => setAuthed(true)} />}
        </div>
      </Device>
    </div>
  )
}
