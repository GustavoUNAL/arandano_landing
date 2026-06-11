'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export default function UserMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (status === 'loading') {
    return null
  }

  if (!session) {
    return (
      <button
        type="button"
        onClick={() => signIn('google')}
        className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
      >
        <GoogleIcon />
        <span className="hidden sm:inline">Iniciar sesión con Google</span>
        <span className="sm:hidden">Ingresar</span>
      </button>
    )
  }

  const { user } = session

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Menú de usuario"
      >
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name ?? 'Usuario'}
            width={32}
            height={32}
            className="rounded-full object-cover w-8 h-8"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-berry-600 text-white flex items-center justify-center text-sm font-semibold">
            {(user?.name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-stone-700 max-w-[120px] truncate">
          {user?.name?.split(' ')[0] ?? 'Mi cuenta'}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-52 bg-white border border-stone-200 rounded-xl shadow-lg py-1.5 z-50"
          role="menu"
        >
          <div className="px-4 py-2 border-b border-stone-100">
            <p className="text-sm font-semibold text-stone-800 truncate">{user?.name}</p>
            <p className="text-xs text-stone-500 truncate">{user?.email}</p>
          </div>
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
            role="menuitem"
          >
            <ProfileIcon />
            Mi perfil
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            role="menuitem"
          >
            <LogoutIcon />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}
