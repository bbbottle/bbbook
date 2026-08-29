import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type ThemeMode = 'light' | 'dark'

interface KindleThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggle: () => void
  isDark: boolean
}

const KindleThemeContext = createContext<KindleThemeContextValue | null>(null)

export interface ThemeProviderProps {
  children: ReactNode
  defaultMode?: ThemeMode
}

export function ThemeProvider({ children, defaultMode = 'light' }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode)

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggle: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
      isDark: mode === 'dark',
    }),
    [mode]
  )

  return (
    <KindleThemeContext.Provider value={value}>
      <div className={mode === 'dark' ? 'dark' : undefined} data-theme={mode}>
        {children}
      </div>
    </KindleThemeContext.Provider>
  )
}

export function useKindleTheme() {
  const context = useContext(KindleThemeContext)
  if (!context) {
    throw new Error('useKindleTheme must be used within a ThemeProvider')
  }
  return context
}
