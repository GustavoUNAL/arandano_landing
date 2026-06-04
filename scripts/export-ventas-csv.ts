/**
 * Exporta todas las ventas registradas (SQLite) a CSV y genera análisis en Markdown.
 * Uso: DB_MODE=sqlite npx tsx scripts/export-ventas-csv.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { getSales } from '../lib/db-sales'
import { getExpenses } from '../lib/db-expenses'
import {
  buildInforme,
  parseDebtFromSale,
  isDebtSale,
  monthKey,
  formatMonthLabel,
  type SaleLike
} from '../informes/aggregates'

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function rowCsv(cells: unknown[]): string {
  return cells.map(escapeCsv).join(',')
}

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n)
}

function normalizeDate(date: string): string {
  const s = (date || '').slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(date)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return s || date
}

async function main() {
  process.env.DB_MODE = process.env.DB_MODE || 'sqlite'
  const sales = (await getSales()) as SaleLike[]
  const expenses = await getExpenses()
  const informe = buildInforme(sales, expenses as any)

  const outDir = path.join(process.cwd(), 'export')
  fs.mkdirSync(outDir, { recursive: true })

  // --- CSV: una fila por venta ---
  const ventasHeaders = [
    'id',
    'fecha',
    'hora',
    'total',
    'metodo_pago',
    'mesa',
    'notas',
    'es_deuda_aporte',
    'saldo_deuda',
    'nombre_deuda',
    'cantidad_items',
    'items_resumen',
    'creado_en',
    'actualizado_en'
  ]
  const ventasRows: string[] = [rowCsv(ventasHeaders)]

  // --- CSV: una fila por línea de venta ---
  const lineasHeaders = [
    'sale_id',
    'fecha',
    'hora',
    'sale_total',
    'metodo_pago',
    'mesa',
    'notas',
    'linea_num',
    'product_id',
    'product_name',
    'quantity',
    'unit_price',
    'line_subtotal'
  ]
  const lineasRows: string[] = [rowCsv(lineasHeaders)]

  const productTotals = new Map<string, { name: string; qty: number; revenue: number }>()
  const paymentTotals = new Map<string, { count: number; total: number }>()
  const dayTotals = new Map<string, { count: number; total: number }>()

  for (const s of sales) {
    const raw = s as any
    const fecha = normalizeDate(s.date)
    const hour = s.hour ?? ''
    const debt = isDebtSale(s) ? parseDebtFromSale(s.comment) : { debtAmount: null, name: '' }
    const items = s.items || []
    const itemsResumen = items
      .map(
        (it) =>
          `${it.productName} x${it.quantity} @${it.unitPrice}`
      )
      .join(' | ')

    ventasRows.push(
      rowCsv([
        s.id,
        fecha,
        hour,
        s.total,
        s.paymentMethod || '',
        raw.mesa || '',
        s.comment || '',
        isDebtSale(s) ? 'si' : 'no',
        debt.debtAmount ?? '',
        debt.name,
        items.length,
        itemsResumen,
        raw.createdAt || '',
        raw.updatedAt || ''
      ])
    )

    const pm = s.paymentMethod || '(sin especificar)'
    const pb = paymentTotals.get(pm) || { count: 0, total: 0 }
    pb.count++
    pb.total += Number(s.total) || 0
    paymentTotals.set(pm, pb)

    const db = dayTotals.get(fecha) || { count: 0, total: 0 }
    db.count++
    db.total += Number(s.total) || 0
    dayTotals.set(fecha, db)

    items.forEach((it, idx) => {
      const sub = (it.totalPrice ?? (it.unitPrice || 0) * (it.quantity || 0)) as number
      lineasRows.push(
        rowCsv([
          s.id,
          fecha,
          hour,
          s.total,
          s.paymentMethod || '',
          raw.mesa || '',
          s.comment || '',
          idx + 1,
          (it as any).productId || '',
          it.productName,
          it.quantity,
          it.unitPrice,
          sub
        ])
      )
      const pid = (it as any).productId || it.productName
      const pt = productTotals.get(pid) || {
        name: it.productName,
        qty: 0,
        revenue: 0
      }
      pt.qty += Number(it.quantity) || 0
      pt.revenue += sub
      productTotals.set(pid, pt)
    })
  }

  const ventasCsvPath = path.join(outDir, 'ventas-registradas.csv')
  const lineasCsvPath = path.join(outDir, 'ventas-lineas-detalle.csv')
  fs.writeFileSync(ventasCsvPath, ventasRows.join('\n'), 'utf8')
  fs.writeFileSync(lineasCsvPath, lineasRows.join('\n'), 'utf8')

  const topProducts = Array.from(productTotals.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 20)

  const topDays = Array.from(dayTotals.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15)

  const dates = sales.map((s) => normalizeDate(s.date)).filter(Boolean)
  const minDate = dates.length ? dates.sort()[0] : '—'
  const maxDate = dates.length ? dates.sort().reverse()[0] : '—'
  const avgTicket =
    sales.length > 0 ? informe.ventas.sumaTotalVentas / sales.length : 0
  const totalLineas = lineasRows.length - 1

  const L: string[] = []
  L.push('# Análisis completo de ventas — Arándano Café Bar')
  L.push('')
  L.push(
    `_Generado: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })} | Fuente: data/arandano.db (DB_MODE=${process.env.DB_MODE})_`
  )
  L.push('')
  L.push('## Archivos exportados')
  L.push('')
  L.push(`- \`export/ventas-registradas.csv\` — ${sales.length} ventas (una fila por ticket)`)
  L.push(`- \`export/ventas-lineas-detalle.csv\` — ${totalLineas} líneas de producto`)
  L.push('')
  L.push('## 1. Resumen general')
  L.push('')
  L.push('| Indicador | Valor |')
  L.push('|-----------|-------|')
  L.push(`| Total de ventas (tickets) | ${sales.length} |`)
  L.push(`| Período registrado | ${minDate} → ${maxDate} |`)
  L.push(
    `| Facturación total (suma de \`total\` por venta) | $${formatCOP(informe.ventas.sumaTotalVentas)} COP |`
  )
  L.push(`| Ticket promedio | $${formatCOP(Math.round(avgTicket))} COP |`)
  L.push(
    `| Ingresos cobrados (incl. aportes en ventas con deuda) | $${formatCOP(informe.ventas.sumaIngresosCobrados)} COP |`
  )
  L.push(
    `| Saldo pendiente en deudas registradas | $${formatCOP(informe.ventas.sumaSaldoDeudasRegistradas)} COP |`
  )
  L.push(`| Ventas marcadas como deuda/aporte | ${informe.deudas.length} |`)
  L.push('')
  L.push('## 2. Ventas por mes')
  L.push('')
  if (informe.ventas.porMes.length === 0) {
    L.push('_Sin datos._')
  } else {
    L.push('| Mes | Tickets (aprox.) | Total facturado | Ingresos cobrados |')
    L.push('|-----|------------------|-----------------|-------------------|')
    for (const row of informe.ventas.porMes) {
      const monthSales = sales.filter((s) => monthKey(s.date) === row.key)
      L.push(
        `| ${row.label} | ${monthSales.length} | $${formatCOP(row.ventas)} | $${formatCOP(row.ingresos)} |`
      )
    }
  }
  L.push('')
  L.push('## 3. Por método de pago')
  L.push('')
  L.push('| Método | Cantidad | Total |')
  L.push('|--------|----------|-------|')
  for (const [method, v] of Array.from(paymentTotals.entries()).sort(
    (a, b) => b[1].total - a[1].total
  )) {
    const label =
      method === 'efectivo'
        ? 'Efectivo'
        : method === 'nequi'
          ? 'Nequi'
          : method === 'efectivo-aporte'
            ? 'Efectivo (aporte/deuda)'
            : method === '(sin especificar)'
              ? 'Sin especificar'
              : method
    L.push(`| ${label} | ${v.count} | $${formatCOP(v.total)} |`)
  }
  L.push('')
  L.push('## 4. Top 20 productos por ingreso (líneas de venta)')
  L.push('')
  L.push('| Producto | Unidades vendidas | Ingreso (líneas) |')
  L.push('|----------|-------------------|------------------|')
  for (const [, p] of topProducts) {
    L.push(`| ${p.name} | ${p.qty} | $${formatCOP(p.revenue)} |`)
  }
  L.push('')
  L.push('## 5. Días con mayor facturación')
  L.push('')
  L.push('| Fecha | Tickets | Total del día |')
  L.push('|-------|---------|---------------|')
  for (const [day, v] of topDays) {
    L.push(`| ${day} | ${v.count} | $${formatCOP(v.total)} |`)
  }
  L.push('')
  L.push('## 6. Deudas / aportes ([APORTE])')
  L.push('')
  if (informe.deudas.length === 0) {
    L.push('_No hay ventas con deuda registrada._')
  } else {
    L.push(
      '| Fecha | Nombre | Mesa | Total venta | Aporte | Saldo | ID |'
    )
    L.push('|-------|--------|------|-------------|--------|-------|-----|')
    for (const d of informe.deudas) {
      L.push(
        `| ${normalizeDate(d.date)} | ${d.nombre} | ${d.mesa || '—'} | $${formatCOP(d.totalVenta)} | ${d.aporteRecibido != null ? `$${formatCOP(d.aporteRecibido)}` : '—'} | ${d.saldoPendiente != null ? `$${formatCOP(d.saldoPendiente)}` : '—'} | ${d.id} |`
      )
    }
  }
  L.push('')
  L.push('## 7. Notas sobre los datos')
  L.push('')
  L.push(
    '- La fuente autoritativa es **SQLite** (`data/arandano.db`). El archivo `data/sales.json` está desactualizado y no se usa en producción con `DB_MODE=sqlite`.'
  )
  L.push(
    '- Algunas fechas en la BD incluyen hora en el campo `date` (formato ISO); en los CSV se normalizó a `YYYY-MM-DD` cuando fue posible.'
  )
  L.push(
    '- El campo `channel` no se persiste en SQLite; el canal por defecto al leer es `presencial`.'
  )
  L.push(
    '- Para cruzar con gastos del negocio, ver también `informes/INFORME.md` (`npx tsx scripts/export-informe.ts`).'
  )

  const analisisPath = path.join(outDir, 'ANALISIS-VENTAS.md')
  fs.writeFileSync(analisisPath, L.join('\n'), 'utf8')

  console.log('Exportación completada:')
  console.log(' ', ventasCsvPath, `(${sales.length} ventas)`)
  console.log(' ', lineasCsvPath, `(${totalLineas} líneas)`)
  console.log(' ', analisisPath)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
