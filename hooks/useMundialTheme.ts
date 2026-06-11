'use client'

import {
  getStoredMundialTheme,
  storeMundialTheme,
  type MundialTheme,
} from '@/components/sports/MundialThemeToggle'
import { useCallback, useEffect, useState } from 'react'

export function useMundialTheme() {
  const [theme, setTheme] = useState<MundialTheme>('dark')

  useEffect(() => {
    setTheme(getStoredMundialTheme())
  }, [])

  const isDark = theme === 'dark'

  const toggleTheme = useCallback(() => {
    const next: MundialTheme = isDark ? 'light' : 'dark'
    setTheme(next)
    storeMundialTheme(next)
  }, [isDark])

  return { theme, isDark, toggleTheme }
}
