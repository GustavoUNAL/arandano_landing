/**
 * Servicio de ventas (SQLite / PostgreSQL)
 */

import { dbAll, dbGet, dbRun } from './db'
import { Sale } from './sales'

function normalizeSaleRow(row: Record<string, unknown>): Sale | null {
  try {
    const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items
    if (!Array.isArray(items)) return null
    const normalizedItems = items.map((item: any) => {
      if (item.price !== undefined && item.unitPrice === undefined) {
        return {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity || 1,
          unitPrice: item.price,
          totalPrice: (Number(item.price) || 0) * (Number(item.quantity) || 1),
        }
      }
      if (item.unitPrice !== undefined && item.totalPrice === undefined) {
        return {
          ...item,
          totalPrice: (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
        }
      }
      return item
    })
    const dateStr =
      typeof row.date === 'string' && row.date.length >= 10
        ? row.date.slice(0, 10)
        : String(row.date || '')
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : (row.date as string)
    return {
      id: row.id as string,
      date,
      hour: row.hour as number,
      items: normalizedItems,
      total: row.total as number,
      paymentMethod: (row.paymentMethod as Sale['paymentMethod']) || undefined,
      channel: ((row.channel as Sale['channel']) || 'presencial') as Sale['channel'],
      comment: (row.notes as string) || undefined,
      mesa: (row.mesa as string) || undefined,
    }
  } catch {
    return null
  }
}

export async function getSales(): Promise<Sale[]> {
  const rows = await dbAll<Record<string, unknown>>(
    'SELECT * FROM sales ORDER BY date DESC, hour DESC'
  )
  const result: Sale[] = []
  for (const row of rows) {
    const sale = normalizeSaleRow(row)
    if (sale) result.push(sale)
  }
  return result
}

export async function getSaleById(id: string): Promise<Sale | undefined> {
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM sales WHERE id = ?', [id])
  if (!row) return undefined
  return normalizeSaleRow(row) ?? undefined
}

export async function createSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()

  await dbRun(
    `INSERT INTO sales (
      id, date, hour, items, total, paymentMethod, notes, mesa, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      sale.date,
      sale.hour,
      JSON.stringify(sale.items),
      sale.total,
      sale.paymentMethod || null,
      sale.comment || null,
      sale.mesa || null,
      now,
      now,
    ]
  )

  const created = await getSaleById(id)
  if (!created) throw new Error('Error creando venta')
  return created
}

export async function updateSale(id: string, updates: Partial<Sale>): Promise<Sale | null> {
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []

  Object.entries(updates).forEach(([key, value]) => {
    const dbKey = key === 'comment' ? 'notes' : key
    if (key !== 'id' && value !== undefined && key !== 'channel') {
      if (key === 'items') {
        fields.push('items = ?')
        values.push(JSON.stringify(value))
      } else if (dbKey !== 'channel') {
        fields.push(`${dbKey} = ?`)
        values.push(value)
      }
    }
  })

  if (fields.length === 0) return (await getSaleById(id)) || null

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  await dbRun(`UPDATE sales SET ${fields.join(', ')} WHERE id = ?`, values)
  return (await getSaleById(id)) || null
}

export async function deleteSale(id: string): Promise<boolean> {
  const result = await dbRun('DELETE FROM sales WHERE id = ?', [id])
  return result.changes > 0
}

export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  const start = startDate.split('T')[0]
  const end = endDate.split('T')[0]
  const rows = await dbAll<Record<string, unknown>>(
    `SELECT * FROM sales 
    WHERE date >= ? AND date <= ?
    ORDER BY date DESC, hour DESC`,
    [start, end]
  )
  const result: Sale[] = []
  for (const row of rows) {
    const sale = normalizeSaleRow(row)
    if (sale) result.push(sale)
  }
  return result
}

export async function getSalesByYear(year: number): Promise<Sale[]> {
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`
  return getSalesByDateRange(startDate, endDate)
}
