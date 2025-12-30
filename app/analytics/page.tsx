'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface KPIs {
  totalInventoryValue: number
  lowStockProducts: number
  dormantProducts30: number
  dormantProducts60: number
  totalRevenue: number
  averageTicket: number
  daySales: number
  nightSales: number
  revenuePerHour: number[]
  totalCosts: number
  grossMargin: number
  netMargin: number
  breakEvenPoint: number
  starProducts: number
  volumeProducts: number
  premiumProducts: number
  problemProducts: number
}

interface ProductAnalytics {
  product: {
    id: string
    name: string
    price: number
    stock: number
    cost?: number
  }
  totalSold: number
  totalRevenue: number
  totalCost: number
  grossMargin: number
  grossMarginPercent: number
  rotation: number
  daysInStock: number
  lastSaleDaysAgo: number
  classification: 'estrella' | 'volumen' | 'premium' | 'problema'
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalytics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, dateRange])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/login')
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
    } catch (error) {
      setIsAuthenticated(false)
    }
  }

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      )
      const data = await response.json()
      setKpis(data.kpis)
      setProductAnalytics(data.productAnalytics)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'estrella': return 'bg-green-100 text-green-800 border-green-300'
      case 'volumen': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'premium': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'problema': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'estrella': return '⭐'
      case 'volumen': return '📊'
      case 'premium': return '💎'
      case 'problema': return '⚠️'
      default: return '•'
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-berry-600">Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/admin')
    return null
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-berry-950">📊 Dashboard de Análisis</h1>
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="px-4 py-2 text-berry-600 hover:text-berry-800 text-sm font-medium"
            >
              ← Volver a Admin
            </Link>
          </div>
        </div>

        {/* Filtros de fecha */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-berry-600">Cargando análisis...</div>
          </div>
        ) : kpis ? (
          <>
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-berry-600 mb-2">Ingresos Totales</div>
                <div className="text-3xl font-bold text-berry-950">
                  ${kpis.totalRevenue.toLocaleString('es-CO')}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-berry-600 mb-2">Ticket Promedio</div>
                <div className="text-3xl font-bold text-berry-950">
                  ${kpis.averageTicket.toLocaleString('es-CO')}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-berry-600 mb-2">Margen Neto</div>
                <div className={`text-3xl font-bold ${kpis.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${kpis.netMargin.toLocaleString('es-CO')}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-berry-600 mb-2">Punto de Equilibrio</div>
                <div className="text-3xl font-bold text-berry-950">
                  {kpis.breakEvenPoint} pedidos/día
                </div>
              </div>
            </div>

            {/* Inventario */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-berry-950 mb-4">📦 Inventario</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border border-stone-200 rounded-lg p-4">
                  <div className="text-sm text-berry-600 mb-1">Valor Total Inventario</div>
                  <div className="text-xl font-bold text-berry-950">
                    ${kpis.totalInventoryValue.toLocaleString('es-CO')}
                  </div>
                </div>
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="text-sm text-red-600 mb-1">Stock Bajo</div>
                  <div className="text-xl font-bold text-red-700">{kpis.lowStockProducts}</div>
                </div>
                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="text-sm text-yellow-600 mb-1">Dormidos 30+ días</div>
                  <div className="text-xl font-bold text-yellow-700">{kpis.dormantProducts30}</div>
                </div>
                <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="text-sm text-orange-600 mb-1">Dormidos 60+ días</div>
                  <div className="text-xl font-bold text-orange-700">{kpis.dormantProducts60}</div>
                </div>
              </div>
            </div>

            {/* Ventas por Horario */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-berry-950 mb-4">⏰ Ventas por Horario</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border border-stone-200 rounded-lg p-4">
                  <div className="text-sm text-berry-600 mb-1">☀️ Ventas Día (6am-6pm)</div>
                  <div className="text-2xl font-bold text-berry-950">
                    ${kpis.daySales.toLocaleString('es-CO')}
                  </div>
                </div>
                <div className="border border-stone-200 rounded-lg p-4">
                  <div className="text-sm text-berry-600 mb-1">🌙 Ventas Noche (6pm-6am)</div>
                  <div className="text-2xl font-bold text-berry-950">
                    ${kpis.nightSales.toLocaleString('es-CO')}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-berry-600 mb-2">Ingreso por Hora</div>
                <div className="grid grid-cols-12 gap-2">
                  {kpis.revenuePerHour.map((revenue, hour) => (
                    <div key={hour} className="text-center">
                      <div className="text-xs text-berry-600 mb-1">{hour}h</div>
                      <div 
                        className="bg-berry-200 rounded"
                        style={{ 
                          height: `${Math.max(20, (revenue / Math.max(...kpis.revenuePerHour)) * 100)}px`,
                          minHeight: '20px'
                        }}
                        title={`$${revenue.toLocaleString('es-CO')}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Clasificación de Productos */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-berry-950 mb-4">🎯 Clasificación de Productos</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                  <div className="text-sm text-green-600 mb-1">⭐ Estrella</div>
                  <div className="text-2xl font-bold text-green-700">{kpis.starProducts}</div>
                  <div className="text-xs text-green-600 mt-1">Alta rotación + Alto margen</div>
                </div>
                <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                  <div className="text-sm text-yellow-600 mb-1">📊 Volumen</div>
                  <div className="text-2xl font-bold text-yellow-700">{kpis.volumeProducts}</div>
                  <div className="text-xs text-yellow-600 mt-1">Alta rotación + Bajo margen</div>
                </div>
                <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                  <div className="text-sm text-blue-600 mb-1">💎 Premium</div>
                  <div className="text-2xl font-bold text-blue-700">{kpis.premiumProducts}</div>
                  <div className="text-xs text-blue-600 mt-1">Baja rotación + Alto margen</div>
                </div>
                <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50">
                  <div className="text-sm text-red-600 mb-1">⚠️ Problema</div>
                  <div className="text-2xl font-bold text-red-700">{kpis.problemProducts}</div>
                  <div className="text-xs text-red-600 mt-1">Baja rotación + Bajo margen</div>
                </div>
              </div>

              {/* Tabla de Productos */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-stone-100">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Producto</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Clasificación</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Vendidos</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Ingresos</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Margen %</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Rotación</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Última Venta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productAnalytics.map((analytics) => (
                      <tr key={analytics.product.id} className="border-b border-stone-200 hover:bg-stone-50">
                        <td className="px-4 py-3 text-sm">{analytics.product.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getClassificationColor(analytics.classification)}`}>
                            {getClassificationIcon(analytics.classification)} {analytics.classification}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{analytics.totalSold}</td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          ${analytics.totalRevenue.toLocaleString('es-CO')}
                        </td>
                        <td className={`px-4 py-3 text-sm font-semibold ${analytics.grossMarginPercent >= 30 ? 'text-green-600' : analytics.grossMarginPercent >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {analytics.grossMarginPercent.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm">{analytics.rotation.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">
                          {analytics.lastSaleDaysAgo === 999 ? 'Nunca' : `${analytics.lastSaleDaysAgo} días`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-berry-600">No hay datos disponibles</div>
          </div>
        )}
      </div>
    </div>
  )
}

