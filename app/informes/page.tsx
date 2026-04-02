'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import { buildInforme, type SaleLike, type ExpenseLike } from '../../informes/aggregates'

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function formatDate(iso: string) {
  const s = (iso || '').slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  }
  return iso
}

const CATEGORY_LABELS: Record<string, string> = {
  rent: 'Arriendo',
  utilities: 'Servicios',
  internet: 'Internet',
  staff: 'Personal',
  software: 'Software / Hosting',
  alcohol: 'Bebidas Alcohólicas',
  coffee: 'Café',
  supplies: 'Insumos',
  delivery: 'Domicilios',
  other: 'Otros'
}

export default function InformesPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [sales, setSales] = useState<SaleLike[]>([])
  const [expenses, setExpenses] = useState<ExpenseLike[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/auth/login')
        const data = await res.json()
        setIsAuthenticated(!!data.authenticated)
        if (!data.authenticated) router.push('/admin')
      } catch {
        setIsAuthenticated(false)
        router.push('/admin')
      }
    }
    check()
  }, [router])

  useEffect(() => {
    if (!isAuthenticated) return
    const load = async () => {
      setLoading(true)
      try {
        const [sRes, eRes] = await Promise.all([
          fetch('/api/sales?t=' + Date.now(), { cache: 'no-store' }),
          fetch('/api/expenses', { cache: 'no-store' })
        ])
        const sData = sRes.ok ? await sRes.json() : []
        const eData = eRes.ok ? await eRes.json() : []
        setSales(Array.isArray(sData) ? sData : [])
        setExpenses(Array.isArray(eData) ? eData : [])
      } catch {
        setSales([])
        setExpenses([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAuthenticated])

  const informe = useMemo(() => buildInforme(sales, expenses), [sales, expenses])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-600">Verificando sesión…</p>
      </div>
    )
  }

  const historicoVentas = [...sales].sort((a, b) => {
    const da = new Date((a.date || '').slice(0, 10)).getTime()
    const db = new Date((b.date || '').slice(0, 10)).getTime()
    return db - da || (b.hour || 0) - (a.hour || 0)
  })

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Informes</h1>
              <p className="text-sm text-stone-600 mt-1">
                Histórico de ventas, ingresos, deudas registradas y gastos (compras).
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/sales"
                className="px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
              >
                Ventas
              </Link>
              <Link
                href="/expenses"
                className="px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
              >
                Gastos
              </Link>
            </div>
          </div>

          {loading ? (
            <p className="text-stone-600">Cargando datos…</p>
          ) : (
            <div className="space-y-10">
              <section className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-900 mb-4">Resumen</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-lg bg-berry-50 border border-berry-100 p-4">
                    <p className="text-xs font-medium text-berry-700 uppercase tracking-wide">Ventas (tickets)</p>
                    <p className="text-2xl font-bold text-berry-900 mt-1">{informe.ventas.totalRegistros}</p>
                    <p className="text-sm text-berry-700 mt-1">
                      Total facturado: ${formatPrice(informe.ventas.sumaTotalVentas)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                    <p className="text-xs font-medium text-emerald-800 uppercase tracking-wide">Ingresos cobrados</p>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">
                      ${formatPrice(informe.ventas.sumaIngresosCobrados)}
                    </p>
                    <p className="text-sm text-emerald-800 mt-1">
                      Incluye aportes de ventas con deuda
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-100 p-4">
                    <p className="text-xs font-medium text-amber-900 uppercase tracking-wide">Saldo deudas (registrado)</p>
                    <p className="text-2xl font-bold text-amber-950 mt-1">
                      ${formatPrice(informe.ventas.sumaSaldoDeudasRegistradas)}
                    </p>
                    <p className="text-sm text-amber-900 mt-1">Suma de pendientes en ventas tipo aporte</p>
                  </div>
                  <div className="rounded-lg bg-stone-100 border border-stone-200 p-4">
                    <p className="text-xs font-medium text-stone-700 uppercase tracking-wide">Gastos / compras</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">
                      ${formatPrice(informe.compras.totalGastos)}
                    </p>
                    <p className="text-sm text-stone-600 mt-1">{informe.compras.totalRegistros} registros</p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-900 mb-4">Ventas e ingresos por mes</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-left text-stone-600">
                        <th className="py-2 pr-4">Mes</th>
                        <th className="py-2 pr-4">Total ventas (facturado)</th>
                        <th className="py-2">Ingresos cobrados (mes)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {informe.ventas.porMes.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-stone-500">
                            Sin ventas registradas
                          </td>
                        </tr>
                      ) : (
                        informe.ventas.porMes.map((row) => (
                          <tr key={row.key} className="border-b border-stone-100">
                            <td className="py-2 pr-4 font-medium text-stone-900">{row.label}</td>
                            <td className="py-2 pr-4">${formatPrice(row.ventas)}</td>
                            <td className="py-2">${formatPrice(row.ingresos)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-900 mb-4">Deudas (ventas con aporte)</h2>
                {informe.deudas.length === 0 ? (
                  <p className="text-stone-500 text-sm">No hay ventas marcadas como aporte/deuda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-200 text-left text-stone-600">
                          <th className="py-2 pr-3">Fecha</th>
                          <th className="py-2 pr-3">A nombre de</th>
                          <th className="py-2 pr-3">Total venta</th>
                          <th className="py-2 pr-3">Aporte</th>
                          <th className="py-2">Pendiente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {informe.deudas.map((d) => (
                          <tr key={d.id} className="border-b border-stone-100">
                            <td className="py-2 pr-3 whitespace-nowrap">{formatDate(d.date)}</td>
                            <td className="py-2 pr-3">{d.nombre}</td>
                            <td className="py-2 pr-3">${formatPrice(d.totalVenta)}</td>
                            <td className="py-2 pr-3">
                              {d.aporteRecibido != null ? `$${formatPrice(d.aporteRecibido)}` : '—'}
                            </td>
                            <td className="py-2 font-medium text-amber-800">
                              {d.saldoPendiente != null ? `$${formatPrice(d.saldoPendiente)}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-900 mb-2">Gastos y compras registradas</h2>
                <p className="text-sm text-stone-600 mb-4">
                  Movimientos del módulo de gastos (fijos y variables). Úsalos como referencia de compras y egresos.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-stone-700 mb-2">Por tipo</h3>
                    <ul className="text-sm space-y-1">
                      {Object.entries(informe.compras.porTipo).map(([k, v]) => (
                        <li key={k} className="flex justify-between gap-2">
                          <span>{k === 'fixed' ? 'Fijo' : k === 'variable' ? 'Variable' : k}</span>
                          <span className="font-medium">${formatPrice(v)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-stone-700 mb-2">Por categoría</h3>
                    <ul className="text-sm space-y-1">
                      {Object.entries(informe.compras.porCategoria)
                        .sort((a, b) => b[1] - a[1])
                        .map(([k, v]) => (
                          <li key={k} className="flex justify-between gap-2">
                            <span>{CATEGORY_LABELS[k] || k}</span>
                            <span className="font-medium">${formatPrice(v)}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-stone-700 mb-2">Detalle (más recientes primero)</h3>
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto border border-stone-100 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-stone-100">
                      <tr className="text-left text-stone-600">
                        <th className="py-2 px-3">Fecha</th>
                        <th className="py-2 px-3">Descripción</th>
                        <th className="py-2 px-3">Tipo</th>
                        <th className="py-2 px-3">Categoría</th>
                        <th className="py-2 px-3">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {informe.compras.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 px-3 text-stone-500">
                            No hay gastos registrados
                          </td>
                        </tr>
                      ) : (
                        informe.compras.items.map((e) => (
                          <tr key={e.id} className="border-t border-stone-100">
                            <td className="py-2 px-3 whitespace-nowrap">{formatDate(e.date)}</td>
                            <td className="py-2 px-3">{e.description}</td>
                            <td className="py-2 px-3">
                              {e.type === 'fixed' ? 'Fijo' : e.type === 'variable' ? 'Variable' : e.type}
                            </td>
                            <td className="py-2 px-3">{CATEGORY_LABELS[e.category] || e.category}</td>
                            <td className="py-2 px-3 font-medium">${formatPrice(e.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-900 mb-4">
                  Histórico de ventas (últimos {Math.min(80, historicoVentas.length)} de {historicoVentas.length})
                </h2>
                <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-stone-100 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-stone-100">
                      <tr className="text-left text-stone-600">
                        <th className="py-2 px-3">Fecha</th>
                        <th className="py-2 px-3">Hora</th>
                        <th className="py-2 px-3">Ítems</th>
                        <th className="py-2 px-3">Total</th>
                        <th className="py-2 px-3">Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicoVentas.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 px-3 text-stone-500">
                            Sin ventas
                          </td>
                        </tr>
                      ) : (
                        historicoVentas.slice(0, 80).map((s) => (
                          <tr key={s.id} className="border-t border-stone-100">
                            <td className="py-2 px-3 whitespace-nowrap">{formatDate(s.date)}</td>
                            <td className="py-2 px-3">{s.hour != null ? `${s.hour}:00` : '—'}</td>
                            <td className="py-2 px-3 max-w-[200px] truncate">
                              {(s.items || [])
                                .map((i) => `${i.productName} ×${i.quantity}`)
                                .join(', ') || '—'}
                            </td>
                            <td className="py-2 px-3 font-medium">${formatPrice(s.total)}</td>
                            <td className="py-2 px-3 text-xs">
                              {s.paymentMethod === 'efectivo-aporte'
                                ? 'Aporte / deuda'
                                : s.paymentMethod || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
