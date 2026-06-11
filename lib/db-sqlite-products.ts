/**
 * Servicio de productos (SQLite / PostgreSQL)
 */

import { dbAll, dbGet, dbRun } from './db'
import { Product } from './products'

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    price: row.price as number,
    description: (row.description as string) || undefined,
    category: row.category as Product['category'],
    type: row.type as Product['type'],
    stock: (row.stock as number) || 0,
    imageUrl: (row.imageUrl as string) || undefined,
    size: (row.size as string) || undefined,
    minStock: (row.minStock as number) || undefined,
    cost: (row.cost as number) || undefined,
    purchaseDate: (row.purchaseDate as string) || undefined,
    lot: (row.lot as string) || undefined,
    supplier: (row.supplier as string) || undefined,
    lastSaleDate: (row.lastSaleDate as string) || undefined,
    totalSold: (row.totalSold as number) || 0,
  }
}

export async function getProducts(): Promise<Product[]> {
  const rows = await dbAll<Record<string, unknown>>('SELECT * FROM products ORDER BY name')
  return rows.map(mapProduct)
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM products WHERE id = ?', [id])
  if (!row) return null
  return mapProduct(row)
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const name = (product.name || '').toString().trim()
  const size = (product.size != null ? String(product.size) : '').trim()
  const description =
    product.description != null && product.description !== ''
      ? String(product.description).trim()
      : ''

  if (!name) throw new Error('El producto debe tener un nombre.')
  if (description === '') throw new Error('El producto debe tener una descripción.')

  const existing = await dbGet<{ id: string }>(
    "SELECT id FROM products WHERE name = ? AND COALESCE(size, '') = ?",
    [name, size]
  )
  if (existing) {
    const err = new Error('DUPLICATE_PRODUCT') as Error & { code?: string }
    err.code = 'DUPLICATE_PRODUCT'
    throw err
  }

  const id = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()

  await dbRun(
    `INSERT INTO products (
      id, name, price, description, category, type, stock, imageUrl, size,
      minStock, cost, purchaseDate, lot, supplier, lastSaleDate, totalSold,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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
      now,
    ]
  )

  const created = await getProductById(id)
  if (!created) throw new Error('Error creando producto')
  return created
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const current = await getProductById(id)
  if (!current) return null

  const name = updates.name != null ? String(updates.name).trim() : current.name
  const size = updates.size != null ? String(updates.size).trim() : (current.size ?? '')
  const description =
    updates.description != null ? String(updates.description).trim() : (current.description ?? '')

  if (!name) throw new Error('El producto debe tener un nombre.')
  if (!description) throw new Error('El producto debe tener una descripción.')

  if (updates.name !== undefined || updates.size !== undefined) {
    const existing = await dbGet<{ id: string }>(
      "SELECT id FROM products WHERE name = ? AND COALESCE(size, '') = ? AND id != ?",
      [name, size, id]
    )
    if (existing) {
      const err = new Error('DUPLICATE_PRODUCT') as Error & { code?: string }
      err.code = 'DUPLICATE_PRODUCT'
      throw err
    }
  }

  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []

  const applied: Record<string, unknown> = { ...updates, updatedAt: now }
  if (updates.name !== undefined) applied.name = name
  if (updates.description !== undefined) applied.description = description
  if (updates.size !== undefined) applied.size = size

  Object.entries(applied).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  })

  if (fields.length === 0) return getProductById(id)

  values.push(id)
  await dbRun(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values)
  return getProductById(id)
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await dbRun('DELETE FROM products WHERE id = ?', [id])
  return result.changes > 0
}
