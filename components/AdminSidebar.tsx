'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'

const NOTES_STORAGE_KEY = 'arandano_admin_notes'

const iconClass = 'h-5 w-5 flex-shrink-0'

const NavIcon = ({ name }: { name: string }) => {
  const props = { className: iconClass, fill: 'none' as const, viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'panel':
      return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" /></svg>
    case 'cobros':
      return <svg {...props}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
    case 'products':
      return <svg {...props}><path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>
    case 'inventory':
      return <svg {...props}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
    case 'tareas':
      return <svg {...props}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11l-5 5" /></svg>
    case 'recetas':
      return <svg {...props}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
    case 'gastos':
      return <svg {...props}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
    case 'analytics':
      return <svg {...props}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
    case 'informes':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    default:
      return null
  }
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Panel', iconName: 'panel', view: null },
  { href: '/waiter', label: 'Cobros', iconName: 'cobros', view: null },
  { href: '/admin?view=products-for-sale', label: 'Productos a la venta', iconName: 'products', view: 'products-for-sale' },
  { href: '/inventory', label: 'Inventario', iconName: 'inventory', view: null },
  { href: '/tasks', label: 'Tareas', iconName: 'tareas', view: null },
  { href: '/admin?view=recipes', label: 'Recetas', iconName: 'recetas', view: 'recipes' },
  { href: '/expenses', label: 'Gastos', iconName: 'gastos', view: null },
  { href: '/informes', label: 'Informes', iconName: 'informes', view: null },
  { href: '/analytics', label: 'Analytics', iconName: 'analytics', view: null }
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
    `flex items-center gap-3 w-full px-3 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation ${
      active
        ? 'bg-arandano-100 text-arandano-800 border border-arandano-200'
        : 'text-arandano-700 hover:bg-arandano-50 hover:text-arandano-800 border border-transparent'
    }`

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between p-3 sm:p-3 border-b border-stone-200 min-h-[52px] sm:min-h-0">
        <span className="font-bold text-arandano-950 text-sm truncate">Admin</span>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2.5 -mr-1 text-stone-500 hover:text-stone-700 rounded-lg hover:bg-stone-100 touch-manipulation"
          aria-label="Cerrar menú"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex flex-col gap-0.5 sm:gap-1 p-2 sm:p-3 overflow-y-auto flex-1 min-h-0">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={linkClass(active)}
            >
              <span className="[&_svg]:text-current" aria-hidden><NavIcon name={item.iconName} /></span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto p-2 sm:p-3 border-t border-stone-200 space-y-0.5 sm:space-y-1">
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
          className="flex items-center gap-3 w-full px-3 py-3 sm:py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-all duration-200 border border-transparent min-h-[44px] sm:min-h-0 touch-manipulation"
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
      {/* Botón hamburguesa - solo móvil, con safe-area */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed z-50 w-11 h-11 min-w-[44px] min-h-[44px] bg-white border border-stone-200 rounded-lg shadow-md flex items-center justify-center text-arandano-700 hover:bg-arandano-50 active:bg-arandano-100 transition-colors touch-manipulation top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))]"
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

      {/* Sidebar: drawer en móvil (con safe-area), fijo en desktop */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[min(16rem,85vw)] max-w-64 bg-white border-r border-stone-200 shadow-xl
          flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]
          transform transition-transform duration-300 ease-out
          lg:translate-x-0 lg:shadow-none lg:w-64 lg:max-w-none lg:pt-0 lg:pb-0 lg:pl-0
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
          className="w-14 h-14 bg-[rgb(47,77,107)] hover:bg-arandano-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
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
              <h3 className="text-lg font-bold text-arandano-950">Notas (Markdown)</h3>
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
