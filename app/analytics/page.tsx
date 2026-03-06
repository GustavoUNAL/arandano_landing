'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
  fixedExpenses: number
  variableExpenses: number
  grossMargin: number
  netMargin: number
  breakEvenPoint: number
  starProducts: number
  volumeProducts: number
  premiumProducts: number
  problemProducts: number
}

interface DailyKPIs {
  date: string
  dayName: string
  totalRevenue: number
  totalSales: number
  averageTicket: number
  nequi: number
  efectivo: number
  daySales: number
  nightSales: number
  totalExpenses: number
  topProducts: Array<{
    productId: string
    productName: string
    quantity: number
    revenue: number
  }>
}

interface WeeklyKPIs extends KPIs {
  weekNumber: number
  year: number
  startDate: string
  endDate: string
  dailyKPIs?: DailyKPIs[]
}

interface MonthlyKPIs extends KPIs {
  month: number
  year: number
  startDate: string
  endDate: string
  weeks: number[]
}

type ProductCategory = 'cafe-caliente' | 'cafe-frio' | 'pasteleria' | 'combo' | 'coctel' | 'cerveza' | 'vino' | 'vodka' | 'ginebra' | 'tequila' | 'whisky'

interface ProductAnalytics {
  product: {
    id: string
    name: string
    price: number
    stock: number
    cost?: number
    category?: ProductCategory
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

const ANALYTICS_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'cafe-caliente', label: 'Cafés Calientes' },
  { value: 'cafe-frio', label: 'Cafés Fríos' },
  { value: 'pasteleria', label: 'Pastelería' },
  { value: 'combo', label: 'Combos' },
  { value: 'cerveza', label: 'Cervezas' },
  { value: 'coctel', label: 'Cócteles' },
  { value: 'vino', label: 'Vinos' },
  { value: 'vodka', label: 'Vodka' },
  { value: 'ginebra', label: 'Ginebra' },
  { value: 'tequila', label: 'Tequila' },
  { value: 'whisky', label: 'Whisky' }
]

// Componente de gráfica de barras
const BarChart = ({ data, labels, colors, height = 200 }: { data: number[], labels: string[], colors: string[], height?: number }) => {
  const maxValue = Math.max(...data, 1)
  const barWidth = 100 / data.length
  const spacing = 5

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg viewBox={`0 0 100 ${height}`} className="w-full h-full">
        {data.map((value, index) => {
          const barHeight = (value / maxValue) * (height - 40)
          const x = (index * barWidth) + (barWidth * 0.1)
          const width = barWidth * 0.8
          const y = height - barHeight - 20
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={width}
                height={barHeight}
                fill={colors[index % colors.length]}
                rx="2"
              />
              <text
                x={x + width / 2}
                y={height - 5}
                textAnchor="middle"
                fontSize="8"
                fill="#6B7280"
              >
                {labels[index]}
              </text>
              <text
                x={x + width / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="7"
                fill="#374151"
                fontWeight="bold"
              >
                {value > 0 ? `$${(value / 1000).toFixed(0)}k` : ''}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// Componente de gráfica de barras agrupadas por día usando Recharts
const GroupedBarChart = ({ days, height = 400 }: { days: DailyKPIs[], height?: number }) => {
  const data = days.map(day => {
    const date = new Date(day.date)
    return {
      name: `${day.dayName.substring(0, 3)} ${date.getDate()}`,
      Ventas: day.totalRevenue || 0,
      Compras: day.totalExpenses || 0
    }
  })
  
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            stroke="#9ca3af"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
            formatter={(value: number | undefined) => value ? `$${value.toLocaleString('es-CO')}` : '$0'}
            labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="square"
          />
          <Bar dataKey="Ventas" fill="#9333EA" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Compras" fill="#EF4444" radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Componente de gráfica de líneas
const LineChart = ({ data, labels, color = '#9333EA', height = 200 }: { data: number[], labels: string[], color?: string, height?: number }) => {
  const maxValue = Math.max(...data, 1)
  const minValue = Math.min(...data, 0)
  const range = maxValue - minValue || 1
  const width = 100
  const pointSpacing = width / (data.length - 1 || 1)

  const points = data.map((value, index) => {
    const x = index * pointSpacing
    const y = height - 30 - ((value - minValue) / range) * (height - 50)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg viewBox={`0 0 100 ${height}`} className="w-full h-full">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((value, index) => {
          const x = index * pointSpacing
          const y = height - 30 - ((value - minValue) / range) * (height - 50)
          
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="2"
                fill={color}
              />
              <text
                x={x}
                y={height - 5}
                textAnchor="middle"
                fontSize="7"
                fill="#6B7280"
              >
                {labels[index]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [weeklyKPIs, setWeeklyKPIs] = useState<WeeklyKPIs[]>([])
  const [monthlyKPIs, setMonthlyKPIs] = useState<MonthlyKPIs[]>([])
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([])
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<'range' | 'week' | 'month'>('week')
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
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
  }, [isAuthenticated, dateRange, groupBy, year])

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
      let url = `/api/analytics?groupBy=${groupBy}&year=${year}`
      if (groupBy === 'range') {
        url += `&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      setKpis(data.kpis)
      const weeks = data.weeklyKPIs || []
      setWeeklyKPIs(weeks)
      setMonthlyKPIs(data.monthlyKPIs || [])
      setProductAnalytics(data.productAnalytics)
      
      // Seleccionar automáticamente la semana actual o la última disponible
      if (weeks.length > 0 && selectedWeek === null) {
        const today = new Date()
        const currentWeek = weeks.find((w: WeeklyKPIs) => {
          const start = new Date(w.startDate)
          const end = new Date(w.endDate)
          return today >= start && today <= end
        })
        if (currentWeek) {
          setSelectedWeek(currentWeek.weekNumber)
        } else {
          setSelectedWeek(weeks[weeks.length - 1].weekNumber)
        }
      }
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
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 py-6 px-4">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-berry-950 text-center mb-6">
            Dashboard de Análisis
          </h1>

          {/* Filtros mejorados */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-stone-200">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-semibold text-berry-700 mb-2">
                  Agrupar por
                </label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as 'range' | 'week' | 'month')}
                  className="w-full px-4 py-2.5 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-sm"
                >
                  <option value="week">Semana</option>
                  <option value="month">Mes (4 semanas)</option>
                  <option value="range">Rango de fechas</option>
                </select>
              </div>
              {groupBy !== 'range' && (
                <>
                  <div className="min-w-[120px]">
                    <label className="block text-sm font-semibold text-berry-700 mb-2">
                      Año
                    </label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => {
                        setYear(parseInt(e.target.value))
                        setSelectedWeek(null) // Reset al cambiar año
                      }}
                      className="w-full px-4 py-2.5 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                    />
                  </div>
                  {groupBy === 'week' && weeklyKPIs.length > 0 && (
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-semibold text-berry-700 mb-2">
                        Seleccionar Semana
                      </label>
                      <select
                        value={selectedWeek || ''}
                        onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {weeklyKPIs.map((week) => (
                          <option key={week.weekNumber} value={week.weekNumber}>
                            Semana {week.weekNumber} - {new Date(week.startDate).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })} - {new Date(week.endDate).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
              {groupBy === 'range' && (
                <>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-semibold text-berry-700 mb-2">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-semibold text-berry-700 mb-2">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <div className="text-berry-600 text-lg">Cargando análisis...</div>
          </div>
        ) : groupBy === 'week' ? (
          weeklyKPIs.length > 0 && selectedWeek ? (() => {
            const week = weeklyKPIs.find(w => w.weekNumber === selectedWeek)
            if (!week) return (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg border-2 border-stone-200">
                <div className="text-berry-600">Selecciona una semana</div>
              </div>
            )
            
            const totalExpenses = week.fixedExpenses + week.variableExpenses
            
            return (
              <div className="space-y-6">
                {/* Header de la semana */}
                <div className="bg-gradient-to-r from-berry-600 to-berry-700 rounded-xl shadow-xl p-6 text-white">
                  <h2 className="text-2xl font-bold text-center">
                    Semana {week.weekNumber} - {week.year}
                  </h2>
                  <p className="text-center text-berry-100 text-sm mt-2">
                    {new Date(week.startDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })} 
                    {' - '}
                    {new Date(week.endDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Gráfica principal: Compras vs Ventas por día */}
                <div className="bg-white rounded-xl shadow-xl p-6 border-2 border-stone-200">
                  <h3 className="text-xl font-bold text-berry-950 mb-6 text-center">
                    Ventas vs Compras por Día
                  </h3>
                  {week.dailyKPIs && week.dailyKPIs.length > 0 ? (() => {
                    // Asegurar que tenemos exactamente 7 días (llenar si falta alguno)
                    const dailyKPIs = week.dailyKPIs || []
                    const allDays = Array.from({ length: 7 }, (_, i) => {
                      const weekStart = new Date(week.startDate)
                      const dayDate = new Date(weekStart)
                      dayDate.setDate(weekStart.getDate() + i)
                      const dayStr = dayDate.toISOString().split('T')[0]
                      
                      // Buscar si existe en dailyKPIs
                      const existing = dailyKPIs.find(d => d.date === dayStr)
                      if (existing) return existing
                      
                      // Si no existe, crear día vacío
                      const dayName = dayDate.toLocaleDateString('es-CO', { weekday: 'long' })
                      return {
                        date: dayStr,
                        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                        totalRevenue: 0,
                        totalSales: 0,
                        averageTicket: 0,
                        nequi: 0,
                        efectivo: 0,
                        daySales: 0,
                        nightSales: 0,
                        totalExpenses: 0,
                        topProducts: []
                      }
                    })
                    
                    return (
                      <>
                        <GroupedBarChart
                          days={allDays}
                          height={400}
                        />
                        <div className="mt-6 pt-6 border-t border-stone-200 flex justify-center gap-6">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-purple-600"></div>
                            <span className="text-sm font-semibold text-stone-700">Ventas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-red-600"></div>
                            <span className="text-sm font-semibold text-stone-700">Compras</span>
                          </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-stone-200 grid grid-cols-2 gap-6">
                          <div className="text-center">
                            <div className="text-sm text-stone-600 mb-2">Total Ventas Semana</div>
                            <div className="text-3xl font-bold text-purple-600">
                              ${week.totalRevenue.toLocaleString('es-CO')}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-stone-600 mb-2">Total Compras Semana</div>
                            <div className="text-3xl font-bold text-red-600">
                              ${totalExpenses.toLocaleString('es-CO')}
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-stone-200 text-center">
                          <div className="text-sm text-stone-600 mb-2">Ganancia Neta Semanal</div>
                          <div className={`text-4xl font-bold ${week.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${week.netMargin.toLocaleString('es-CO')}
                          </div>
                        </div>
                      </>
                    )
                  })() : (
                    <div className="text-center py-8 text-stone-500">
                      No hay datos diarios disponibles
                    </div>
                  )}
                </div>

                {/* Resumen de KPIs */}
                <div className="bg-white rounded-xl shadow-xl p-6 border-2 border-stone-200">
                  <h3 className="text-lg font-bold text-berry-950 mb-5 text-center">Resumen Semanal</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-gradient-to-br from-berry-50 to-berry-100 rounded-lg p-4 border border-berry-200">
                      <div className="text-xs text-berry-700 font-medium mb-1">Ingresos</div>
                      <div className="text-lg font-bold text-berry-950">
                        ${week.totalRevenue.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                      <div className="text-xs text-red-700 font-medium mb-1">Gastos Fijos</div>
                      <div className="text-lg font-bold text-red-950">
                        ${week.fixedExpenses.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="text-xs text-orange-700 font-medium mb-1">Gastos Variables</div>
                      <div className="text-lg font-bold text-orange-950">
                        ${week.variableExpenses.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div className={`bg-gradient-to-br rounded-lg p-4 border ${week.grossMargin >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
                      <div className={`text-xs font-medium mb-1 ${week.grossMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>Margen Bruto</div>
                      <div className={`text-lg font-bold ${week.grossMargin >= 0 ? 'text-green-950' : 'text-red-950'}`}>
                        ${week.grossMargin.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div className={`bg-gradient-to-br rounded-lg p-4 border ${week.netMargin >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
                      <div className={`text-xs font-medium mb-1 ${week.netMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>Margen Neto</div>
                      <div className={`text-lg font-bold ${week.netMargin >= 0 ? 'text-green-950' : 'text-red-950'}`}>
                        ${week.netMargin.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="text-xs text-blue-700 font-medium mb-1">Ticket Promedio</div>
                      <div className="text-lg font-bold text-blue-950">
                        ${week.averageTicket.toLocaleString('es-CO')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })() : (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg border-2 border-stone-200">
              <div className="text-berry-600">No hay datos de semanas para el año {year}</div>
            </div>
          )
        ) : groupBy === 'month' ? (
          monthlyKPIs.length > 0 ? (
          <>
            {/* Gráfica de tendencias mensuales */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-stone-200">
              <h2 className="text-xl font-bold text-berry-950 mb-4 text-center">Tendencias Mensuales</h2>
              <LineChart
                data={monthlyKPIs.map(m => m.totalRevenue)}
                labels={monthlyKPIs.map(m => new Date(m.year, m.month, 1).toLocaleDateString('es-CO', { month: 'short' }))}
                color="#9333EA"
                height={250}
              />
            </div>

            {/* KPIs por Mes con gráficas */}
            <div className="space-y-6 mb-6">
              {monthlyKPIs.map((month) => (
                <div key={`${month.year}-${month.month}`} className="bg-white rounded-xl shadow-lg p-6 border-2 border-stone-200">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-berry-950 text-center">
                      {new Date(month.year, month.month, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                      <span className="text-sm font-normal text-berry-600 ml-2">
                        (Semanas: {month.weeks.join(', ')})
                      </span>
                    </h3>
                  </div>
                  
                  {/* Gráfica de ingresos vs gastos */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-berry-700 mb-3 text-center">Ingresos vs Gastos</h4>
                    <BarChart
                      data={[month.totalRevenue, month.fixedExpenses, month.variableExpenses, month.grossMargin]}
                      labels={['Ingresos', 'Fijos', 'Variables', 'Margen']}
                      colors={['#9333EA', '#EF4444', '#F97316', '#10B981']}
                      height={200}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-gradient-to-br from-berry-50 to-berry-100 rounded-lg p-4 border border-berry-200">
                      <div className="text-xs text-berry-700 font-medium mb-1">Ingresos</div>
                      <div className="text-lg font-bold text-berry-950">
                        ${month.totalRevenue.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                      <div className="text-xs text-red-700 font-medium mb-1">Gastos Fijos</div>
                      <div className="text-lg font-bold text-red-950">
                        ${month.fixedExpenses.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="text-xs text-orange-700 font-medium mb-1">Gastos Variables</div>
                      <div className="text-lg font-bold text-orange-950">
                        ${month.variableExpenses.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div className={`bg-gradient-to-br rounded-lg p-4 border ${month.grossMargin >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
                      <div className={`text-xs font-medium mb-1 ${month.grossMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>Margen Bruto</div>
                      <div className={`text-lg font-bold ${month.grossMargin >= 0 ? 'text-green-950' : 'text-red-950'}`}>
                        ${month.grossMargin.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div className={`bg-gradient-to-br rounded-lg p-4 border ${month.netMargin >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
                      <div className={`text-xs font-medium mb-1 ${month.netMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>Margen Neto</div>
                      <div className={`text-lg font-bold ${month.netMargin >= 0 ? 'text-green-950' : 'text-red-950'}`}>
                        ${month.netMargin.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="text-xs text-blue-700 font-medium mb-1">Ticket Promedio</div>
                      <div className="text-lg font-bold text-blue-950">
                        ${month.averageTicket.toLocaleString('es-CO')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg border-2 border-stone-200">
              <div className="text-berry-600">No hay meses con 4 semanas completas para el año {year}</div>
            </div>
          )
        ) : kpis ? (
          <>
            {/* KPIs Principales mejorados */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-berry-50 to-berry-100 rounded-xl border-2 border-berry-200 shadow-lg p-5 sm:p-6">
                <div className="text-sm text-berry-700 font-medium mb-2">Ingresos Totales</div>
                <div className="text-2xl sm:text-3xl font-bold text-berry-950">
                  ${kpis.totalRevenue.toLocaleString('es-CO')}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 shadow-lg p-5 sm:p-6">
                <div className="text-sm text-blue-700 font-medium mb-2">Ticket Promedio</div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-950">
                  ${kpis.averageTicket.toLocaleString('es-CO')}
                </div>
              </div>
              <div className={`bg-gradient-to-br rounded-xl border-2 shadow-lg p-5 sm:p-6 ${kpis.netMargin >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
                <div className={`text-sm font-medium mb-2 ${kpis.netMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>Margen Neto</div>
                <div className={`text-2xl sm:text-3xl font-bold ${kpis.netMargin >= 0 ? 'text-green-950' : 'text-red-950'}`}>
                  ${kpis.netMargin.toLocaleString('es-CO')}
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200 shadow-lg p-5 sm:p-6">
                <div className="text-sm text-red-700 font-medium mb-2">Gastos Fijos</div>
                <div className="text-xl sm:text-2xl font-bold text-red-950">
                  ${(kpis.fixedExpenses || 0).toLocaleString('es-CO')}
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 shadow-lg p-5 sm:p-6">
                <div className="text-sm text-orange-700 font-medium mb-2">Gastos Variables</div>
                <div className="text-xl sm:text-2xl font-bold text-orange-950">
                  ${(kpis.variableExpenses || 0).toLocaleString('es-CO')}
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border-2 border-indigo-200 shadow-lg p-5 sm:p-6">
                <div className="text-sm text-indigo-700 font-medium mb-2">Punto de Equilibrio</div>
                <div className="text-2xl sm:text-3xl font-bold text-indigo-950">
                  {kpis.breakEvenPoint} pedidos/día
                </div>
              </div>
            </div>

            {/* Gráfica de Ingresos vs Gastos */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-stone-200">
              <h2 className="text-xl font-bold text-berry-950 mb-4 text-center">Ingresos vs Gastos</h2>
              <BarChart
                data={[kpis.totalRevenue, kpis.fixedExpenses || 0, kpis.variableExpenses || 0, kpis.grossMargin]}
                labels={['Ingresos', 'Fijos', 'Variables', 'Margen']}
                colors={['#9333EA', '#EF4444', '#F97316', '#10B981']}
                height={250}
              />
            </div>

            {/* Inventario mejorado */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-stone-200">
              <h2 className="text-xl font-bold text-berry-950 mb-4 text-center">Inventario</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-berry-50 to-berry-100 rounded-lg p-4 border-2 border-berry-200">
                  <div className="text-xs text-berry-700 font-medium mb-1">Valor Total Inventario</div>
                  <div className="text-lg sm:text-xl font-bold text-berry-950">
                    ${kpis.totalInventoryValue.toLocaleString('es-CO')}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-200">
                  <div className="text-xs text-red-700 font-medium mb-1">Stock Bajo</div>
                  <div className="text-lg sm:text-xl font-bold text-red-950">{kpis.lowStockProducts}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border-2 border-yellow-200">
                  <div className="text-xs text-yellow-700 font-medium mb-1">Dormidos 30+ días</div>
                  <div className="text-lg sm:text-xl font-bold text-yellow-950">{kpis.dormantProducts30}</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-200">
                  <div className="text-xs text-orange-700 font-medium mb-1">Dormidos 60+ días</div>
                  <div className="text-lg sm:text-xl font-bold text-orange-950">{kpis.dormantProducts60}</div>
                </div>
              </div>
            </div>

            {/* Ventas por Horario mejorado */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-stone-200">
              <h2 className="text-xl font-bold text-berry-950 mb-4 text-center">Ventas por Horario</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border-2 border-amber-200">
                  <div className="text-sm text-amber-700 font-medium mb-1">Ventas Día (6am-6pm)</div>
                  <div className="text-xl sm:text-2xl font-bold text-amber-950">
                    ${kpis.daySales.toLocaleString('es-CO')}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border-2 border-indigo-200">
                  <div className="text-sm text-indigo-700 font-medium mb-1">Ventas Noche (6pm-6am)</div>
                  <div className="text-xl sm:text-2xl font-bold text-indigo-950">
                    ${kpis.nightSales.toLocaleString('es-CO')}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-berry-700 font-semibold mb-3 text-center">Ingreso por Hora</div>
                <div className="bg-stone-50 rounded-lg p-4 border-2 border-stone-200">
                  <div className="grid grid-cols-12 gap-1 sm:gap-2">
                    {kpis.revenuePerHour.map((revenue, hour) => {
                      const maxRevenue = Math.max(...kpis.revenuePerHour, 1)
                      const heightPercent = (revenue / maxRevenue) * 100
                      
                      return (
                        <div key={hour} className="flex flex-col items-center">
                          <div className="w-full bg-stone-200 rounded-t" style={{ height: '120px', position: 'relative' }}>
                            <div
                              className="bg-berry-600 rounded-t transition-all hover:bg-berry-700"
                              style={{
                                height: `${Math.max(5, heightPercent)}%`,
                                position: 'absolute',
                                bottom: 0,
                                width: '100%',
                                minHeight: revenue > 0 ? '5px' : '0'
                              }}
                              title={`${hour}h: $${revenue.toLocaleString('es-CO')}`}
                            />
                          </div>
                          <div className="text-xs text-stone-600 mt-1 font-medium">{hour}h</div>
                          {revenue > 0 && (
                            <div className="text-[10px] text-berry-600 font-semibold mt-0.5">
                              ${(revenue / 1000).toFixed(0)}k
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Clasificación de Productos mejorado */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-stone-200">
              <h2 className="text-xl font-bold text-berry-950 mb-4 text-center">Clasificación de Productos</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300">
                  <div className="text-sm text-green-700 font-medium mb-1">Estrella</div>
                  <div className="text-2xl font-bold text-green-950">{kpis.starProducts}</div>
                  <div className="text-xs text-green-600 mt-1">Alta rotación + Alto margen</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border-2 border-yellow-300">
                  <div className="text-sm text-yellow-700 font-medium mb-1">Volumen</div>
                  <div className="text-2xl font-bold text-yellow-950">{kpis.volumeProducts}</div>
                  <div className="text-xs text-yellow-600 mt-1">Alta rotación + Bajo margen</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
                  <div className="text-sm text-blue-700 font-medium mb-1">Premium</div>
                  <div className="text-2xl font-bold text-blue-950">{kpis.premiumProducts}</div>
                  <div className="text-xs text-blue-600 mt-1">Baja rotación + Alto margen</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-300">
                  <div className="text-sm text-red-700 font-medium mb-1">Problema</div>
                  <div className="text-2xl font-bold text-red-950">{kpis.problemProducts}</div>
                  <div className="text-xs text-red-600 mt-1">Baja rotación + Bajo margen</div>
                </div>
              </div>

              {/* Gráfica de clasificación */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-berry-700 mb-3 text-center">Distribución de Productos</h4>
                <BarChart
                  data={[kpis.starProducts, kpis.volumeProducts, kpis.premiumProducts, kpis.problemProducts]}
                  labels={['Estrella', 'Volumen', 'Premium', 'Problema']}
                  colors={['#10B981', '#EAB308', '#3B82F6', '#EF4444']}
                  height={200}
                />
              </div>

              {/* Tabla de Productos mejorada */}
              <div className="mt-6">
                <h3 className="text-lg font-bold text-berry-950 mb-4 text-center">Productos a la venta</h3>
                {/* Filtro por categoría */}
                <div className="mb-4 p-4 bg-white rounded-lg border-2 border-stone-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="text-sm font-semibold text-berry-950 whitespace-nowrap">
                      Filtrar por categoría:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setProductCategoryFilter('all')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          productCategoryFilter === 'all'
                            ? 'bg-berry-600 text-white shadow-md'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        Todas
                      </button>
                      {ANALYTICS_CATEGORIES.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setProductCategoryFilter(value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            productCategoryFilter === value
                              ? 'bg-berry-600 text-white shadow-md'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border-2 border-stone-200 shadow-sm">
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="bg-gradient-to-r from-berry-600 to-berry-700">
                        <th className="px-6 py-4 text-left text-sm font-bold text-white sticky left-0 bg-gradient-to-r from-berry-600 to-berry-700 z-10">Producto</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white">Clasificación</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white">Vendidos</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-white">Ingresos</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-white">Costos</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-white">Ganancia</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white">Margen %</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white">Rotación</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white">Última Venta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = productCategoryFilter === 'all'
                          ? productAnalytics
                          : productAnalytics.filter(a => (a.product as { category?: string }).category === productCategoryFilter)
                        const byCategory = new Map<string, ProductAnalytics[]>()
                        for (const a of filtered) {
                          const cat = (a.product as { category?: string }).category ?? 'otros'
                          if (!byCategory.has(cat)) byCategory.set(cat, [])
                          byCategory.get(cat)!.push(a)
                        }
                        const categoryOrder = ['cafe-caliente', 'cafe-frio', 'pasteleria', 'combo', 'cerveza', 'coctel', 'vino', 'vodka', 'ginebra', 'tequila', 'whisky', 'aguardiente', 'brandy', 'ron', 'otros']
                        const sortedCats = categoryOrder.filter(c => byCategory.has(c))
                        const restCats = Array.from(byCategory.keys()).filter(c => !categoryOrder.includes(c))
                        const allCats = [...sortedCats, ...restCats]
                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={9} className="px-6 py-8 text-center text-stone-500">
                                No hay productos con datos de ventas
                              </td>
                            </tr>
                          )
                        }
                        const getCatLabel = (value: string) => value === 'otros' ? 'Otros' : (ANALYTICS_CATEGORIES.find(c => c.value === value)?.label ?? value)
                        return allCats.flatMap(cat => [
                          <tr key={`cat-${cat}`} className="bg-berry-100 border-b-2 border-berry-200">
                            <td colSpan={9} className="px-6 py-2 font-bold text-berry-950 text-sm">
                              {getCatLabel(cat)}
                            </td>
                          </tr>,
                          ...byCategory.get(cat)!.map((analytics, index) => (
                            <tr
                              key={analytics.product.id}
                              className={`border-b border-stone-200 transition-all ${
                                index % 2 === 0 ? 'bg-white' : 'bg-stone-50'
                              } hover:bg-berry-50 hover:shadow-sm`}
                            >
                              <td className="px-6 py-4 text-sm font-semibold text-stone-900 sticky left-0 z-10 bg-inherit">
                                {analytics.product.name}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getClassificationColor(analytics.classification)}`}>
                                  {getClassificationIcon(analytics.classification)} {analytics.classification}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center text-sm font-semibold text-stone-700">
                                {analytics.totalSold.toLocaleString('es-CO')}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-berry-600">
                                ${analytics.totalRevenue.toLocaleString('es-CO')}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-semibold text-red-600">
                                ${analytics.totalCost.toLocaleString('es-CO')}
                              </td>
                              <td className={`px-6 py-4 text-right text-sm font-bold ${
                                analytics.grossMargin >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ${analytics.grossMargin.toLocaleString('es-CO')}
                              </td>
                              <td className={`px-6 py-4 text-center text-sm font-bold ${
                                analytics.grossMarginPercent >= 30 ? 'text-green-600' : 
                                analytics.grossMarginPercent >= 15 ? 'text-yellow-600' : 
                                analytics.grossMarginPercent >= 0 ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {analytics.grossMarginPercent.toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 text-center text-sm text-stone-600">
                                {analytics.rotation.toFixed(2)}x
                              </td>
                              <td className="px-6 py-4 text-center text-sm text-stone-600">
                                {analytics.lastSaleDaysAgo === 999 ? (
                                  <span className="text-red-500 font-semibold">Nunca</span>
                                ) : analytics.lastSaleDaysAgo === 0 ? (
                                  <span className="text-green-600 font-semibold">Hoy</span>
                                ) : (
                                  `${analytics.lastSaleDaysAgo} días`
                                )}
                              </td>
                            </tr>
                          ))
                        ])
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg border-2 border-stone-200">
            <div className="text-berry-600">No hay datos disponibles</div>
          </div>
        )}

        </div>
      </main>
    </div>
  )
}
