/**
 * Genera el informe completo en Markdown (misma lógica que la página /informes).
 */

import {
  buildInforme,
  type SaleLike,
  type ExpenseLike
} from './aggregates'

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

function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function formatDate(iso: string): string {
  const s = (iso || '').slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  }
  return iso
}

export function generateInformeMarkdown(
  sales: SaleLike[],
  expenses: ExpenseLike[]
): string {
  const informe = buildInforme(sales, expenses)
  const L: string[] = []

  L.push('# Informe consolidado — Arándano Café Bar')
  L.push('')
  L.push(
    `_Generado: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })} (Colombia)_`
  )
  L.push('')

  L.push('## 1. Resumen ejecutivo')
  L.push('')
  L.push('| Indicador | Valor |')
  L.push('|-----------|-------|')
  L.push(`| Tickets de venta (registros) | ${informe.ventas.totalRegistros} |`)
  L.push(
    `| Total facturado (ventas) | $${formatPrice(informe.ventas.sumaTotalVentas)} |`
  )
  L.push(
    `| Ingresos cobrados (incluye aportes en ventas con deuda) | $${formatPrice(informe.ventas.sumaIngresosCobrados)} |`
  )
  L.push(
    `| Suma de saldos pendientes registrados (deudas en ventas tipo aporte) | $${formatPrice(informe.ventas.sumaSaldoDeudasRegistradas)} |`
  )
  L.push(
    `| Total gastos / compras registradas | $${formatPrice(informe.compras.totalGastos)} (${informe.compras.totalRegistros} movimientos) |`
  )
  L.push('')

  L.push('## 2. Ventas e ingresos por mes')
  L.push('')
  if (informe.ventas.porMes.length === 0) {
    L.push('_Sin ventas registradas._')
  } else {
    L.push('| Mes | Total ventas (facturado) | Ingresos cobrados |')
    L.push('|-----|--------------------------|-------------------|')
    for (const row of informe.ventas.porMes) {
      L.push(
        `| ${row.label} | $${formatPrice(row.ventas)} | $${formatPrice(row.ingresos)} |`
      )
    }
  }
  L.push('')

  L.push('## 3. Deudas (ventas con aporte / [APORTE])')
  L.push('')
  if (informe.deudas.length === 0) {
    L.push('_No hay ventas marcadas como aporte o deuda._')
  } else {
    L.push(
      '| Fecha | A nombre de | Mesa | Total venta | Aporte recibido | Saldo pendiente | ID |'
    )
    L.push('|-------|---------------|------|-------------|-----------------|-----------------|----|')
    for (const d of informe.deudas) {
      L.push(
        `| ${formatDate(d.date)} | ${d.nombre} | ${d.mesa || '—'} | $${formatPrice(d.totalVenta)} | ${d.aporteRecibido != null ? `$${formatPrice(d.aporteRecibido)}` : '—'} | ${d.saldoPendiente != null ? `$${formatPrice(d.saldoPendiente)}` : '—'} | \`${d.id}\` |`
      )
    }
  }
  L.push('')

  L.push('## 4. Gastos y compras (módulo de gastos)')
  L.push('')
  L.push('### 4.1 Por tipo')
  L.push('')
  L.push('| Tipo | Total |')
  L.push('|------|-------|')
  for (const [k, v] of Object.entries(informe.compras.porTipo)) {
    const label = k === 'fixed' ? 'Fijo' : k === 'variable' ? 'Variable' : k
    L.push(`| ${label} | $${formatPrice(v)} |`)
  }
  if (Object.keys(informe.compras.porTipo).length === 0) {
    L.push('| — | — |')
  }
  L.push('')

  L.push('### 4.2 Por categoría')
  L.push('')
  L.push('| Categoría | Total |')
  L.push('|-----------|-------|')
  const cats = Object.entries(informe.compras.porCategoria).sort((a, b) => b[1] - a[1])
  if (cats.length === 0) {
    L.push('| — | — |')
  } else {
    for (const [k, v] of cats) {
      L.push(`| ${CATEGORY_LABELS[k] || k} | $${formatPrice(v)} |`)
    }
  }
  L.push('')

  L.push('### 4.3 Detalle de cada movimiento')
  L.push('')
  L.push(
    '| Fecha | Descripción | Tipo | Categoría | Monto | Notas | ID |'
  )
  L.push('|-------|-------------|------|-----------|-------|-------|----|')
  if (informe.compras.items.length === 0) {
    L.push('| — | Sin registros | — | — | — | — | — |')
  } else {
    for (const e of informe.compras.items) {
      const tipo = e.type === 'fixed' ? 'Fijo' : e.type === 'variable' ? 'Variable' : e.type
      const cat = CATEGORY_LABELS[e.category] || e.category
      const notes = (e.notes || '').replace(/\|/g, '\\|').replace(/\n/g, ' ') || '—'
      const desc = (e.description || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
      L.push(
        `| ${formatDate(e.date)} | ${desc} | ${tipo} | ${cat} | $${formatPrice(e.amount)} | ${notes} | \`${e.id}\` |`
      )
    }
  }
  L.push('')

  L.push('## 5. Histórico detallado de ventas')
  L.push('')
  L.push(
    '_Lista completa ordenada de la más reciente a la más antigua. Cada venta incluye ítems y totales por línea._'
  )
  L.push('')

  const historico = [...sales].sort((a, b) => {
    const da = new Date((a.date || '').slice(0, 10)).getTime()
    const db = new Date((b.date || '').slice(0, 10)).getTime()
    return db - da || (b.hour || 0) - (a.hour || 0)
  })

  if (historico.length === 0) {
    L.push('_Sin ventas._')
  } else {
    let n = 1
    for (const s of historico) {
      const pay =
        s.paymentMethod === 'efectivo-aporte'
          ? 'Aporte / deuda'
          : s.paymentMethod || '—'
      const mesa = (s as any).mesa ? ` · Mesa: ${(s as any).mesa}` : ''
      L.push(`### 5.${n} · ${formatDate(s.date)} — ${s.hour != null ? `${s.hour}:00` : '—'} · $${formatPrice(s.total)}${mesa}`)
      L.push('')
      L.push(`- **ID:** \`${s.id}\``)
      L.push(`- **Método de pago:** ${pay}`)
      L.push(`- **Canal:** ${s.channel || '—'}`)
      if (s.comment) {
        const c = s.comment.replace(/\r?\n/g, ' ').slice(0, 500)
        L.push(`- **Comentario:** ${c}${s.comment.length > 500 ? '…' : ''}`)
      }
      L.push('')
      L.push('| Producto | Cant. | P. unitario | Subtotal |')
      L.push('|----------|------:|------------:|---------:|')
      const items = s.items || []
      if (items.length === 0) {
        L.push('| — | — | — | — |')
      } else {
        for (const i of items) {
          const sub = i.totalPrice ?? (i.unitPrice || 0) * (i.quantity || 0)
          L.push(
            `| ${(i.productName || '').replace(/\|/g, '\\|')} | ${i.quantity} | $${formatPrice(i.unitPrice)} | $${formatPrice(sub)} |`
          )
        }
      }
      L.push('')
      n++
    }
  }

  L.push('---')
  L.push('')
  L.push(
    '*Este documento se puede regenerar con `npm run export:informe` (requiere datos en la base SQLite / APIs del proyecto).*'
  )

  return L.join('\n')
}
