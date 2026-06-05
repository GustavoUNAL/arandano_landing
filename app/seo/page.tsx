'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

type PageVisitStat = {
  path: string
  visits: number
  avgTimeSeconds: number
  totalTimeSeconds: number
}

type ClickStat = {
  label: string
  target: string
  path: string
  clicks: number
}

type SeoDashboard = {
  totalVisits: number
  uniquePages: number
  totalClicks: number
  avgTimeSeconds: number
  pageStats: PageVisitStat[]
  topClicks: ClickStat[]
  recentVisits: Array<{ path: string; visitedAt: string }>
  days: number
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  return `${hours}h ${remainMins}m`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function SeoPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [data, setData] = useState<SeoDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) loadData()
  }, [isAuthenticated, days])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/login')
      const result = await response.json()
      setIsAuthenticated(result.authenticated)
    } catch {
      setIsAuthenticated(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/seo?days=${days}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        setData(null)
        setError('No se pudieron cargar las estadísticas.')
      }
    } catch {
      setData(null)
      setError('Error de conexión al cargar SEO.')
    } finally {
      setLoading(false)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-arandano-600">Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/admin')
    return null
  }

  const maxVisits = data?.pageStats[0]?.visits || 1

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 py-6 px-4 lg:pl-0">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-arandano-950">SEO & Tráfico</h1>
              <p className="text-stone-600 text-sm mt-1">
                Visitas, clics y tiempo en página del sitio público
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="seo-days" className="text-sm text-stone-600">
                Período:
              </label>
              <select
                id="seo-days"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm text-arandano-950 focus:ring-2 focus:ring-arandano-300 focus:outline-none"
              >
                <option value={7}>7 días</option>
                <option value={30}>30 días</option>
                <option value={90}>90 días</option>
                <option value={365}>1 año</option>
              </select>
              <button
                type="button"
                onClick={loadData}
                className="px-3 py-2 text-sm font-medium text-arandano-700 hover:bg-arandano-50 rounded-lg border border-stone-200 transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-arandano-600">Cargando estadísticas...</div>
          ) : data ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <StatCard label="Visitas totales" value={data.totalVisits.toLocaleString('es-CO')} />
                <StatCard label="Páginas únicas" value={data.uniquePages.toLocaleString('es-CO')} />
                <StatCard label="Clics registrados" value={data.totalClicks.toLocaleString('es-CO')} />
                <StatCard label="Tiempo promedio" value={formatDuration(data.avgTimeSeconds)} />
              </div>

              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-5 py-4 border-b border-stone-100">
                    <h2 className="font-bold text-arandano-950">Páginas más visitadas</h2>
                    <p className="text-xs text-stone-500 mt-0.5">Visitas y tiempo promedio por ruta</p>
                  </div>
                  <div className="overflow-x-auto">
                    {data.pageStats.length === 0 ? (
                      <EmptyState message="Aún no hay visitas registradas." />
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-stone-500 border-b border-stone-100">
                            <th className="px-4 py-2 font-medium">Página</th>
                            <th className="px-4 py-2 font-medium text-right">Visitas</th>
                            <th className="px-4 py-2 font-medium text-right hidden sm:table-cell">Tiempo avg.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.pageStats.map((page) => (
                            <tr key={page.path} className="border-b border-stone-50 hover:bg-stone-50/80">
                              <td className="px-4 py-3">
                                <div className="font-medium text-arandano-950 truncate max-w-[180px] sm:max-w-none">
                                  {page.path}
                                </div>
                                <div className="mt-1.5 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-arandano-500 transition-all"
                                    style={{ width: `${Math.max(4, (page.visits / maxVisits) * 100)}%` }}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-arandano-800">
                                {page.visits.toLocaleString('es-CO')}
                              </td>
                              <td className="px-4 py-3 text-right text-stone-600 hidden sm:table-cell">
                                {page.avgTimeSeconds > 0 ? formatDuration(page.avgTimeSeconds) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>

                <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-5 py-4 border-b border-stone-100">
                    <h2 className="font-bold text-arandano-950">Elementos con más clics</h2>
                    <p className="text-xs text-stone-500 mt-0.5">Botones y enlaces más usados</p>
                  </div>
                  <div className="overflow-x-auto">
                    {data.topClicks.length === 0 ? (
                      <EmptyState message="Aún no hay clics registrados." />
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-stone-500 border-b border-stone-100">
                            <th className="px-4 py-2 font-medium">Elemento</th>
                            <th className="px-4 py-2 font-medium hidden sm:table-cell">Destino</th>
                            <th className="px-4 py-2 font-medium text-right">Clics</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.topClicks.map((click, i) => (
                            <tr key={`${click.path}-${click.label}-${i}`} className="border-b border-stone-50 hover:bg-stone-50/80">
                              <td className="px-4 py-3">
                                <div className="font-medium text-arandano-950 truncate max-w-[160px] sm:max-w-[220px]">
                                  {click.label}
                                </div>
                                <div className="text-xs text-stone-400 mt-0.5">{click.path}</div>
                              </td>
                              <td className="px-4 py-3 text-stone-600 truncate max-w-[120px] hidden sm:table-cell">
                                {click.target || '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-arandano-800">
                                {click.clicks.toLocaleString('es-CO')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
              </div>

              <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-4 border-b border-stone-100">
                  <h2 className="font-bold text-arandano-950">Visitas recientes</h2>
                </div>
                {data.recentVisits.length === 0 ? (
                  <EmptyState message="Sin visitas recientes en este período." />
                ) : (
                  <ul className="divide-y divide-stone-100">
                    {data.recentVisits.map((visit, i) => (
                      <li key={`${visit.path}-${visit.visitedAt}-${i}`} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-arandano-950 truncate">{visit.path}</span>
                        <span className="text-stone-500 shrink-0">{formatDate(visit.visitedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : (
            <div className="text-center py-16 text-stone-500">No se pudieron cargar los datos.</div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5">
      <p className="text-xs sm:text-sm text-stone-500 mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-arandano-950">{value}</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-4 py-8 text-center text-sm text-stone-500">{message}</p>
}
