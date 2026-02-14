/**
 * Servicio de ventas usando SQLite
 */

import { getDatabase } from './db-sqlite'
import { Sale } from './sales'

function normalizeSaleRow(row: any): Sale | null {
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
          totalPrice: (item.price || 0) * (item.quantity || 1)
        }
      }
      if (item.unitPrice !== undefined && item.totalPrice === undefined) {
        return {
          ...item,
          totalPrice: (item.unitPrice || 0) * (item.quantity || 1)
        }
      }
      return item
    })
    return {
      id: row.id,
      date: row.date,
      hour: row.hour,
      items: normalizedItems,
      total: row.total,
      paymentMethod: row.paymentMethod || undefined,
      channel: row.channel || 'presencial',
      comment: row.notes || undefined,
      mesa: row.mesa || undefined
    }
  } catch {
    return null
  }
}

export async function getSales(): Promise<Sale[]> {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM sales ORDER BY date DESC, hour DESC').all() as any[]
  const result: Sale[] = []
  for (const row of rows) {
    const sale = normalizeSaleRow(row)
    if (sale) result.push(sale)
  }
  return result
}

export async function getSaleById(id: string): Promise<Sale | undefined> {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM sales WHERE id = ?').get(id) as any
  if (!row) return undefined
  return normalizeSaleRow(row) ?? undefined
}

export async function createSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
  const db = getDatabase()
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const tableInfo = db.prepare('PRAGMA table_info(sales)').all() as { name: string }[]
  const hasMesa = tableInfo.some(col => col.name === 'mesa')
  if (hasMesa) {
    db.prepare(`
      INSERT INTO sales (
        id, date, hour, items, total, paymentMethod, notes, mesa, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      sale.date,
      sale.hour,
      JSON.stringify(sale.items),
      sale.total,
      sale.paymentMethod || null,
      sale.comment || null,
      sale.mesa || null,
      now,
      now
    )
  } else {
    db.prepare(`
      INSERT INTO sales (
        id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      sale.date,
      sale.hour,
      JSON.stringify(sale.items),
      sale.total,
      sale.paymentMethod || null,
      sale.comment || null,
      now,
      now
    )
  }
  
  const created = await getSaleById(id)
  if (!created) throw new Error('Error creando venta')
  return created
}

export async function updateSale(id: string, updates: Partial<Sale>): Promise<Sale | null> {
  const db = getDatabase()
  const now = new Date().toISOString()
  
  // Obtener las columnas existentes en la tabla
  const tableInfo = db.prepare('PRAGMA table_info(sales)').all()
  const existingColumns = new Set(tableInfo.map((col: any) => col.name))
  
  const fields: string[] = []
  const values: any[] = []
  
  Object.entries(updates).forEach(([key, value]) => {
    // Mapear 'comment' a 'notes' para la base de datos
    const dbKey = key === 'comment' ? 'notes' : key
    
    // Solo incluir campos que existen en la tabla y no son 'id'
    if (key !== 'id' && value !== undefined && existingColumns.has(dbKey)) {
      if (key === 'items') {
        fields.push('items = ?')
        values.push(JSON.stringify(value))
      } else {
        fields.push(`${dbKey} = ?`)
        values.push(value)
      }
    } else if (value !== undefined && !existingColumns.has(dbKey) && key !== 'channel') {
      // Ignorar 'channel' silenciosamente ya que no existe en la tabla
      if (key !== 'channel') {
        console.warn(`[updateSaleSQLite] Columna '${dbKey}' no existe en la tabla, omitiendo`)
      }
    }
  })
  
  if (fields.length === 0) {
    console.log('[updateSaleSQLite] No hay campos válidos para actualizar')
    return await getSaleById(id) || null
  }
  
  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)
  
  try {
    const sql = `UPDATE sales SET ${fields.join(', ')} WHERE id = ?`
    console.log('[updateSaleSQLite] SQL:', sql)
    console.log('[updateSaleSQLite] Values:', values)
    
    const result = db.prepare(sql).run(...values)
    console.log('[updateSaleSQLite] Resultado:', result)
    
    const updated = await getSaleById(id)
    console.log('[updateSaleSQLite] Venta actualizada:', updated ? 'Sí' : 'No')
    
    return updated || null
  } catch (error: any) {
    console.error('[updateSaleSQLite] Error:', error)
    console.error('[updateSaleSQLite] Stack:', error.stack)
    throw error
  }
}

export async function deleteSale(id: string): Promise<boolean> {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM sales WHERE id = ?').run(id)
  return result.changes > 0
}

export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  const db = getDatabase()
  const start = startDate.split('T')[0]
  const end = endDate.split('T')[0]
  const rows = db.prepare(`
    SELECT * FROM sales 
    WHERE date >= ? AND date <= ?
    ORDER BY date DESC, hour DESC
  `).all(start, end) as any[]
  const result: Sale[] = []
  for (const row of rows) {
    const sale = normalizeSaleRow(row)
    if (sale) result.push(sale)
  }
  return result
}

// Función optimizada para obtener ventas por año
export async function getSalesByYear(year: number): Promise<Sale[]> {
  const db = getDatabase()
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`
  return getSalesByDateRange(startDate, endDate)
}
