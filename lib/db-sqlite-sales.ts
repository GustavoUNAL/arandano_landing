/**
 * Servicio de ventas usando SQLite
 */

import { getDatabase } from './db-sqlite'
import { Sale } from './sales'

export async function getSales(): Promise<Sale[]> {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM sales ORDER BY date DESC, hour DESC').all() as any[]
  
  return rows.map(row => {
    const items = JSON.parse(row.items)
    
    // Normalizar items para compatibilidad con ambos formatos (price vs unitPrice/totalPrice)
    const normalizedItems = items.map((item: any) => {
      // Si tiene 'price' (formato legacy), convertir a unitPrice y totalPrice
      if (item.price !== undefined && item.unitPrice === undefined) {
        return {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity || 1,
          unitPrice: item.price,
          totalPrice: (item.price || 0) * (item.quantity || 1)
        }
      }
      // Si ya tiene unitPrice, calcular totalPrice si falta
      if (item.unitPrice !== undefined && item.totalPrice === undefined) {
        return {
          ...item,
          totalPrice: (item.unitPrice || 0) * (item.quantity || 1)
        }
      }
      // Ya tiene la estructura correcta
      return item
    })
    
    return {
      id: row.id,
      date: row.date,
      hour: row.hour,
      items: normalizedItems,
      total: row.total,
      paymentMethod: row.paymentMethod || undefined,
      channel: row.channel || 'presencial'
    }
  })
}

export async function getSaleById(id: string): Promise<Sale | undefined> {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM sales WHERE id = ?').get(id) as any
  
  if (!row) return undefined
  
  return {
    id: row.id,
    date: row.date,
    hour: row.hour,
    items: JSON.parse(row.items),
    total: row.total,
    paymentMethod: row.paymentMethod || undefined,
    channel: row.channel || 'presencial'
  }
}

export async function createSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
  const db = getDatabase()
  const id = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  db.prepare(`
    INSERT INTO sales (
      id, date, hour, items, total, paymentMethod, channel, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    sale.date,
    sale.hour,
    JSON.stringify(sale.items),
    sale.total,
    sale.paymentMethod || null,
    sale.channel || 'presencial',
    now,
    now
  )
  
  const created = await getSaleById(id)
  if (!created) throw new Error('Error creando venta')
  return created
}

export async function updateSale(id: string, updates: Partial<Sale>): Promise<Sale | null> {
  const db = getDatabase()
  const now = new Date().toISOString()
  
  const fields: string[] = []
  const values: any[] = []
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      if (key === 'items') {
        fields.push('items = ?')
        values.push(JSON.stringify(value))
      } else {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }
  })
  
  if (fields.length === 0) {
    return await getSaleById(id) || null
  }
  
  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)
  
  db.prepare(`UPDATE sales SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  
  return await getSaleById(id) || null
}

export async function deleteSale(id: string): Promise<boolean> {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM sales WHERE id = ?').run(id)
  return result.changes > 0
}

// Función optimizada para obtener ventas por rango de fechas
export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT * FROM sales 
    WHERE date >= ? AND date <= ?
    ORDER BY date DESC, hour DESC
  `).all(startDate, endDate) as any[]
  
  return rows.map(row => {
    const items = JSON.parse(row.items)
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
      channel: row.channel || 'presencial'
    }
  })
}

// Función optimizada para obtener ventas por año
export async function getSalesByYear(year: number): Promise<Sale[]> {
  const db = getDatabase()
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`
  return getSalesByDateRange(startDate, endDate)
}
