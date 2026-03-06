'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'

const NOTES_STORAGE_KEY = 'arandano_admin_notes'

const NAV_ITEMS = [
  { href: '/admin', label: 'Panel', icon: '🏠', view: null },
  { href: '/waiter', label: 'Cobros', icon: '💳', view: null },
  { href: '/admin?view=products-for-sale', label: 'Productos a la venta', icon: '☕', view: 'products-for-sale' },
  { href: '/inventory', label: 'Inventario', icon: '📦', view: null },
  { href: '/tasks', label: 'Tareas', icon: '✅', view: null },
  { href: '/admin?view=recipes', label: 'Recetas', icon: '📝', view: 'recipes' },
  { href: '/expenses', label: 'Gastos', icon: '💰', view: null },
  { href: '/analytics', label: 'Analytics', icon: '📊', view: null }
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const view = searchParams.get('view')
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesSavedAt, setNotesSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY)
      if (saved != null) setAdminNotes(saved)
    }
  }, [])

  const saveNotes = (content: string) => {
    setAdminNotes(content)
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTES_STORAGE_KEY, content)
      setNotesSavedAt(new Date())
    }
  }

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.href.startsWith('/admin')) {
      if (item.view) return pathname === '/admin' && view === item.view
      return pathname === '/admin' && !view
    }
    return pathname === item.href
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin')
  }

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-berry-100 text-berry-800 border border-berry-200'
        : 'text-berry-700 hover:bg-berry-50 hover:text-berry-800 border border-transparent'
    }`

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between p-3 border-b border-stone-200">
        <span className="font-bold text-berry-950 text-sm">Admin</span>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 text-stone-500 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          aria-label="Cerrar menú"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={linkClass(active)}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto p-3 border-t border-stone-200 space-y-1">
        <Link
          href="/"
          onClick={() => setSidebarOpen(false)}
          className={linkClass(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Ver sitio</span>
        </Link>
        <button
          type="button"
          onClick={() => { setSidebarOpen(false); handleLogout() }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 border border-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Salir
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Botón hamburguesa - solo móvil */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-stone-200 rounded-lg shadow-md flex items-center justify-center text-berry-700 hover:bg-berry-50 transition-colors"
        aria-label="Abrir menú"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: drawer en móvil, fijo en desktop */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-stone-200 shadow-xl
          flex flex-col
          transform transition-transform duration-300 ease-out
          lg:translate-x-0 lg:shadow-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Espacio para que el contenido no quede debajo del sidebar en desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0" aria-hidden="true" />

      {/* Botones flotantes en columna (vertical): notas siempre abajo */}
      <div className="fixed bottom-6 right-6 flex flex-col-reverse gap-3 z-40">
        <button
          type="button"
          onClick={() => setNotesOpen(true)}
          className="w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
          title="Abrir notas"
          aria-label="Abrir notas"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Panel de notas (markdown) */}
      {notesOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setNotesOpen(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <h3 className="text-lg font-bold text-berry-950">Notas (Markdown)</h3>
              <div className="flex items-center gap-2">
                {notesSavedAt && (
                  <span className="text-xs text-stone-500">
                    Guardado {notesSavedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setNotesOpen(false)}
                  className="p-2 text-stone-500 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                  aria-label="Cerrar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <textarea
              value={adminNotes}
              onChange={(e) => saveNotes(e.target.value)}
              placeholder="Escribe aquí tus notas en Markdown (ventas, recordatorios, etc.). Se guardan automáticamente."
              className="flex-1 min-h-[280px] p-4 text-stone-800 font-mono text-sm border-0 focus:ring-0 focus:outline-none resize-none rounded-b-xl"
              spellCheck="false"
            />
            <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 rounded-b-xl text-xs text-stone-500">
              Soporta Markdown: **negrita**, *cursiva*, listas con -, encabezados con #, etc.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
