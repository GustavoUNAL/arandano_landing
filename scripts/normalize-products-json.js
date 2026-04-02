/**
 * Normaliza data/products.json:
 * - Elimina duplicados por (nombre + tamaño)
 * - Garantiza nombre, descripción y precio en cada producto
 * - Escribe el archivo de vuelta
 *
 * Uso: node scripts/normalize-products-json.js
 */

const fs = require('fs')
const path = require('path')

const productsPath = path.join(__dirname, '..', 'data', 'products.json')

function normalize() {
  if (!fs.existsSync(productsPath)) {
    console.log('No existe data/products.json')
    return
  }
  const raw = JSON.parse(fs.readFileSync(productsPath, 'utf8'))
  const key = (p) =>
    `${(p.name || '').toString().trim().toLowerCase()}\n${(p.size ?? '').toString().trim().toLowerCase()}`
  const seen = new Set()
  const normalized = []
  for (const p of raw) {
    const name = (p.name || '').toString().trim()
    if (!name) continue
    const k = key(p)
    if (seen.has(k)) continue
    seen.add(k)
    const size = p.size != null ? String(p.size).trim() : ''
    const desc =
      p.description != null && String(p.description).trim() !== ''
        ? String(p.description).trim()
        : `Producto: ${name}`
    normalized.push({
      ...p,
      name,
      price: Number(p.price) || 0,
      description: desc,
      size: size,
      category: (p.category || 'otros').toString().trim(),
      type: (p.type || 'bebida').toString().trim(),
      stock: Number(p.stock) ?? 0
    })
  }
  fs.writeFileSync(productsPath, JSON.stringify(normalized, null, 2), 'utf8')
  console.log(
    `OK: ${normalized.length} productos (sin duplicados), todos con nombre, descripción y precio.`
  )
}

normalize()
