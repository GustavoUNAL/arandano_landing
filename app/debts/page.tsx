 'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Sale {
  id: string
  date: string
  hour: number
  items: SaleItem[]
  total: number
  comment?: string
  paymentMethod?: 'efectivo' | 'nequi' | 'efectivo-aporte'
  ticketNumber?: string
  mesa?: string
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function parseDebtInfo(comment?: string) {
  if (!comment) return { debtAmount: null as number | null, name: '' }
  const aporteIdx = comment.indexOf('[APORTE]')
  if (aporteIdx === -1) return { debtAmount: null as number | null, name: '' }

  let debtAmount: number | null = null
  let name = ''

  const deudaMatch = comment.match(/deuda\s*\$([\d\.\s]+)/i)
  if (deudaMatch && deudaMatch[1]) {
    const digits = deudaMatch[1].replace(/[^0-9]/g, '')
    if (digits) debtAmount = parseInt(digits, 10)
  }

  const nameMatch = comment.match(/a nombre de\s+([^)\]]+)/i)
  if (nameMatch && nameMatch[1]) {
    name = nameMatch[1].trim()
  }

  return { debtAmount, name }
}

export default function DebtsPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDebts = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/sales?t=' + Date.now(), { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) {
          setError(data?.message || 'Error al cargar deudas')
          return
        }
        const allSales: Sale[] = Array.isArray(data) ? data : []
        const debts = allSales.filter(
          (s) => s.paymentMethod === 'efectivo-aporte' || (s.comment && s.comment.includes('[APORTE]'))
        )
        // Orden: deudas más recientes primero
        debts.sort((a, b) => {
          const da = new Date(a.date || a.id).getTime()
          const db = new Date(b.date || b.id).getTime()
          return db - da
        })
        setSales(debts)
      } catch (e: any) {
        setError(e?.message || 'Error al cargar deudas')
      } finally {
        setLoading(false)
      }
    }
    loadDebts()
  }, [])

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-arandano-950">Deudas pendientes</h1>
          <Link
            href="/sales"
            className="px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700"
          >
            ← Volver a Ventas
          </Link>
        </div>
        <p className="text-sm text-stone-600 mb-4">
          Aquí se listan los pagos parciales registrados como <span className="font-semibold">aportes</span>, con su
          saldo pendiente y a nombre de quién quedó la deuda.
        </p>

        {loading && <p className="text-sm text-stone-500">Cargando deudas...</p>}
        {error && !loading && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && sales.length === 0 && (
          <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
            No hay deudas pendientes registradas como aportes.
          </div>
        )}

        {!loading && !error && sales.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-stone-100">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-stone-700">Fecha</th>
                  <th className="px-3 py-2 text-left font-semibold text-stone-700">Ticket</th>
                  <th className="px-3 py-2 text-left font-semibold text-stone-700">Mesa / Cliente</th>
                  <th className="px-3 py-2 text-right font-semibold text-stone-700">Aporte</th>
                  <th className="px-3 py-2 text-right font-semibold text-stone-700">Saldo pendiente</th>
                  <th className="px-3 py-2 text-left font-semibold text-stone-700">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const { debtAmount, name } = parseDebtInfo(sale.comment)
                  const debt = debtAmount ?? null
                  const dateObj = new Date(sale.date)
                  const dateLabel = isNaN(dateObj.getTime())
                    ? sale.date
                    : dateObj.toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })
                  const aporte = debt !== null ? Math.max(0, sale.total - debt) : sale.total

                  return (
                    <tr key={sale.id} className="border-t border-stone-100 hover:bg-stone-50">
                      <td className="px-3 py-2 align-top whitespace-nowrap text-stone-800">{dateLabel}</td>
                      <td className="px-3 py-2 align-top whitespace-nowrap text-stone-700">
                        {sale.ticketNumber || sale.id}
                      </td>
                      <td className="px-3 py-2 align-top text-stone-800">
                        {name || sale.mesa || 'N/A'}
                      </td>
                      <td className="px-3 py-2 align-top text-right text-green-700 font-semibold">
                        ${formatPrice(aporte)}
                      </td>
                      <td className="px-3 py-2 align-top text-right font-semibold text-red-700">
                        {debt !== null ? `$${formatPrice(debt)}` : '—'}
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-stone-600 max-w-xs">
                        {sale.comment || (
                          <span className="italic text-stone-400">Sin comentario</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

