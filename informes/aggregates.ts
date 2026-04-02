/**
 * Agregaciones para el informe de ventas, ingresos, deudas y compras (gastos).
 */

export type SaleLike = {
  id: string
  date: string
  hour?: number
  total: number
  items?: Array<{
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  paymentMethod?: string
  comment?: string
  channel?: string
}

export type ExpenseLike = {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: string
  notes?: string
}

export function parseDebtFromSale(comment?: string): { debtAmount: number | null; name: string } {
  if (!comment) return { debtAmount: null, name: '' }
  if (comment.indexOf('[APORTE]') === -1) return { debtAmount: null, name: '' }
  let debtAmount: number | null = null
  let name = ''
  const deudaMatch = comment.match(/deuda\s*\$([\d\.\s]+)/i)
  if (deudaMatch?.[1]) {
    const digits = deudaMatch[1].replace(/[^0-9]/g, '')
    if (digits) debtAmount = parseInt(digits, 10)
  }
  const nameMatch = comment.match(/a nombre de\s+([^)\]]+)/i)
  if (nameMatch?.[1]) name = nameMatch[1].trim()
  return { debtAmount, name }
}

export function isDebtSale(s: SaleLike): boolean {
  return (
    s.paymentMethod === 'efectivo-aporte' ||
    (typeof s.comment === 'string' && s.comment.includes('[APORTE]'))
  )
}

export function monthKey(dateStr: string): string {
  const d = (dateStr || '').slice(0, 10)
  if (d.length < 7) return 'sin-fecha'
  return d.slice(0, 7)
}

export function formatMonthLabel(key: string): string {
  if (key === 'sin-fecha') return 'Sin fecha'
  const [y, m] = key.split('-')
  const months = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic'
  ]
  const mi = parseInt(m, 10) - 1
  return `${months[mi] || m} ${y}`
}

export interface InformeAggregates {
  ventas: {
    totalRegistros: number
    sumaTotalVentas: number
    sumaIngresosCobrados: number
    sumaSaldoDeudasRegistradas: number
    porMes: Array<{ key: string; label: string; ventas: number; ingresos: number }>
  }
  deudas: Array<{
    id: string
    date: string
    totalVenta: number
    saldoPendiente: number | null
    aporteRecibido: number | null
    nombre: string
    mesa?: string
  }>
  compras: {
    totalGastos: number
    totalRegistros: number
    porCategoria: Record<string, number>
    porTipo: Record<string, number>
    items: ExpenseLike[]
  }
}

export function buildInforme(sales: SaleLike[], expenses: ExpenseLike[]): InformeAggregates {
  let sumaTotalVentas = 0
  let sumaIngresosCobrados = 0
  let sumaSaldoDeudas = 0
  const porMesMap = new Map<string, { ventas: number; ingresos: number }>()

  const deudas: InformeAggregates['deudas'] = []

  for (const s of sales) {
    const total = Number(s.total) || 0
    sumaTotalVentas += total
    const mk = monthKey(s.date || '')
    if (!porMesMap.has(mk)) porMesMap.set(mk, { ventas: 0, ingresos: 0 })
    const bucket = porMesMap.get(mk)!
    bucket.ventas += total

    if (isDebtSale(s)) {
      const { debtAmount, name } = parseDebtFromSale(s.comment)
      const debt = debtAmount ?? null
      const aporte = debt !== null ? Math.max(0, total - debt) : total
      sumaIngresosCobrados += aporte
      bucket.ingresos += aporte
      if (debt !== null) sumaSaldoDeudas += debt
      deudas.push({
        id: s.id,
        date: s.date,
        totalVenta: total,
        saldoPendiente: debt,
        aporteRecibido: debt !== null ? aporte : null,
        nombre: name || '—',
        mesa: (s as any).mesa
      })
    } else {
      sumaIngresosCobrados += total
      bucket.ingresos += total
    }
  }

  const porMes = Array.from(porMesMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, v]) => ({
      key,
      label: formatMonthLabel(key),
      ventas: v.ventas,
      ingresos: v.ingresos
    }))

  let totalGastos = 0
  const porCategoria: Record<string, number> = {}
  const porTipo: Record<string, number> = {}
  for (const e of expenses) {
    const amt = Number(e.amount) || 0
    totalGastos += amt
    porCategoria[e.category] = (porCategoria[e.category] || 0) + amt
    porTipo[e.type] = (porTipo[e.type] || 0) + amt
  }

  return {
    ventas: {
      totalRegistros: sales.length,
      sumaTotalVentas,
      sumaIngresosCobrados,
      sumaSaldoDeudasRegistradas: sumaSaldoDeudas,
      porMes
    },
    deudas: deudas.sort((a, b) => {
      const da = new Date(a.date).getTime()
      const db = new Date(b.date).getTime()
      return db - da
    }),
    compras: {
      totalGastos,
      totalRegistros: expenses.length,
      porCategoria,
      porTipo,
      items: [...expenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    }
  }
}
