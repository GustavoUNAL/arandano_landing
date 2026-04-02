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
  const name = (product.name || '').toString().trim()
  const size = (product.size != null ? String(product.size) : '').trim()
  const description = (product.description != null && product.description !== '') ? String(product.description).trim() : ''

  if (!name) {
    throw new Error('El producto debe tener un nombre.')
  }
  if (description === '') {
    throw new Error('El producto debe tener una descripción.')
  }

  const existing = db.prepare(
    'SELECT id FROM products WHERE name = ? AND COALESCE(size, \'\') = ?'
  ).get(name, size) as { id: string } | undefined
  if (existing) {
    const err = new Error('DUPLICATE_PRODUCT') as Error & { code?: string }
    err.code = 'DUPLICATE_PRODUCT'
    throw err
  }

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
    name,
    product.price,
    description,
    product.category,
    product.type,
    product.stock || 0,
    product.imageUrl || null,
    size,
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
  const current = await getProductById(id)
  if (!current) return null

  const name = updates.name != null ? String(updates.name).trim() : current.name
  const size = updates.size != null ? String(updates.size).trim() : (current.size ?? '')
  const description = updates.description != null ? String(updates.description).trim() : (current.description ?? '')

  if (!name) throw new Error('El producto debe tener un nombre.')
  if (!description) throw new Error('El producto debe tener una descripción.')

  if (updates.name !== undefined || updates.size !== undefined) {
    const existing = db.prepare(
      'SELECT id FROM products WHERE name = ? AND COALESCE(size, \'\') = ? AND id != ?'
    ).get(name, size, id) as { id: string } | undefined
    if (existing) {
      const err = new Error('DUPLICATE_PRODUCT') as Error & { code?: string }
      err.code = 'DUPLICATE_PRODUCT'
      throw err
    }
  }

  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  const applied: Record<string, any> = { ...updates, updatedAt: now }
  if (updates.name !== undefined) applied.name = name
  if (updates.description !== undefined) applied.description = description
  if (updates.size !== undefined) applied.size = size

  Object.entries(applied).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  })

  if (fields.length === 0) return await getProductById(id)

  values.push(id)
  db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return await getProductById(id)
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id)
  return result.changes > 0
}
