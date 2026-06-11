'use client'

const STORAGE_KEY = 'mundial-theme'

export type MundialTheme = 'light' | 'dark'

export function getStoredMundialTheme(): MundialTheme {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'light' ? 'light' : 'dark'
}

export function storeMundialTheme(theme: MundialTheme) {
  localStorage.setItem(STORAGE_KEY, theme)
}

interface MundialThemeToggleProps {
  onToggle: () => void
  isDark: boolean
  className?: string
}

export default function MundialThemeToggle({
  onToggle,
  isDark,
  className = '',
}: MundialThemeToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Modo oscuro activo, cambiar a claro' : 'Modo claro activo, cambiar a oscuro'}
      onClick={onToggle}
      className={`inline-flex items-center gap-2 shrink-0 ${className}`}
    >
      <SunIcon active={!isDark} />
      <span
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
          isDark ? 'bg-berry-600' : 'bg-stone-300'
        }`}
      >
        <span
          className={`pointer-events-none absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
            isDark ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
      <MoonIcon active={isDark} />
    </button>
  )
}

function SunIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-colors ${active ? 'text-amber-400' : 'text-stone-500'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
      />
    </svg>
  )
}

function MoonIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-colors ${active ? 'text-berry-300' : 'text-stone-500'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
      />
    </svg>
  )
}
