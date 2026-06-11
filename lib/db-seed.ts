import fs from 'fs'
import path from 'path'
import { dbAll, dbRun } from './db'
import { getDataDir } from './db-path'

export async function seedProductsIfEmpty(): Promise<void> {
  const rows = await dbAll<{ c: number }>('SELECT COUNT(*) AS c FROM products')
  if (Number(rows[0]?.c) > 0) return

  const productsJsonPath = path.join(getDataDir(), 'products.json')
  if (!fs.existsSync(productsJsonPath)) return

  try {
    const raw = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8')) as Record<string, unknown>[]
    const key = (p: Record<string, unknown>) =>
      `${(p.name || '').toString().trim().toLowerCase()}\n${(p.size ?? '').toString().trim().toLowerCase()}`
    const seen = new Set<string>()
    const normalized = raw
      .filter((p) => {
        const n = (p.name || '').toString().trim()
        if (!n) return false
        const k = key(p)
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      .map((p) => ({
        id: (p.id as string) || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        name: (p.name || '').toString().trim(),
        price: Number(p.price) || 0,
        description:
          p.description != null && p.description !== ''
            ? String(p.description).trim()
            : `Producto: ${(p.name || '').toString().trim()}`,
        category: (p.category || 'otros').toString().trim(),
        type: (p.type || 'bebida').toString().trim(),
        stock: Number(p.stock) ?? 0,
        imageUrl: (p.imageUrl as string) || null,
        size: (p.size != null ? String(p.size) : '').trim(),
        minStock: p.minStock != null ? Number(p.minStock) : null,
        cost: p.cost != null ? Number(p.cost) : null,
        purchaseDate: (p.purchaseDate as string) || null,
        lot: (p.lot as string) || null,
        supplier: (p.supplier as string) || null,
        lastSaleDate: (p.lastSaleDate as string) || null,
        totalSold: Number(p.totalSold) || 0,
      }))

    const now = new Date().toISOString()
    for (const p of normalized) {
      await dbRun(
        `INSERT INTO products (id, name, price, description, category, type, stock, imageUrl, size, minStock, cost, purchaseDate, lot, supplier, lastSaleDate, totalSold, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.name,
          p.price,
          p.description,
          p.category,
          p.type,
          p.stock,
          p.imageUrl,
          p.size,
          p.minStock,
          p.cost,
          p.purchaseDate,
          p.lot,
          p.supplier,
          p.lastSaleDate,
          p.totalSold,
          now,
          now,
        ]
      )
    }
  } catch (e) {
    console.warn('Seed productos en PostgreSQL:', e)
  }
}
