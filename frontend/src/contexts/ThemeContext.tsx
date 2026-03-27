'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createAppTheme } from '@/lib/theme'

type ThemeMode = 'light' | 'dark'

interface ThemeModeContextType {
  mode: ThemeMode
  toggleTheme: () => void
  isDark: boolean
}

const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined)

const STORAGE_KEY = 'theme_mode'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  // Default to light mode
  return 'light'
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMode(getInitialMode())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, mode)
    }
  }, [mode, mounted])

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const isDark = mode === 'dark'

  const theme = useMemo(() => createAppTheme(mode), [mode])

  const contextValue = useMemo(
    () => ({ mode, toggleTheme, isDark }),
    [mode, isDark]
  )

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  )
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext)
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider')
  }
  return context
}
