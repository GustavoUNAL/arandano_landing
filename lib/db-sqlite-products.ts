/**
 * Servicio de productos usando SQLite
 */

import { getDatabase } from './db-sqlite'
import { Product } from './products'

export async function getProducts(): Promise<Product[]> {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM products ORDER BY name').all() as any[]
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description || undefined,
    category: row.category as Product['category'],
    type: row.type as Product['type'],
    stock: row.stock || 0,
    imageUrl: row.imageUrl || undefined,
    size: row.size || undefined,
    minStock: row.minStock || undefined,
    cost: row.cost || undefined,
    purchaseDate: row.purchaseDate || undefined,
    lot: row.lot || undefined,
    supplier: row.supplier || undefined,
    lastSaleDate: row.lastSaleDate || undefined,
    totalSold: row.totalSold || 0
  }))
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any
  
  if (!row) return null
  
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description || undefined,
    category: row.category as Product['category'],
    type: row.type as Product['type'],
    stock: row.stock || 0,
    imageUrl: row.imageUrl || undefined,
    size: row.size || undefined,
    minStock: row.minStock || undefined,
    cost: row.cost || undefined,
    purchaseDate: row.purchaseDate || undefined,
    lot: row.lot || undefined,
    supplier: row.supplier || undefined,
    lastSaleDate: row.lastSaleDate || undefined,
    totalSold: row.totalSold || 0
  }
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const db = getDatabase()
  const id = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  db.prepare(`
    INSERT INTO products (
      id, name, price, description, category, type, stock, imageUrl, size,
      minStock, cost, purchaseDate, lot, supplier, lastSaleDate, totalSold,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    product.name,
    product.price,
    product.description || null,
    product.category,
    product.type,
    product.stock || 0,
    product.imageUrl || null,
    product.size || null,
    product.minStock || null,
    product.cost || null,
    product.purchaseDate || null,
    product.lot || null,
    product.supplier || null,
    product.lastSaleDate || null,
    product.totalSold || 0,
    now,
    now
  )
  
  const created = await getProductById(id)
  if (!created) throw new Error('Error creando producto')
  return created
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const db = getDatabase()
  const now = new Date().toISOString()
  
  const fields: string[] = []
  const values: any[] = []
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  })
  
  if (fields.length === 0) {
    return await getProductById(id)
  }
  
  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)
  
  db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  
  return await getProductById(id)
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id)
  return result.changes > 0
}
