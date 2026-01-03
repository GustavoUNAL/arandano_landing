import fs from 'fs'
import path from 'path'

export interface Product {
  id: string
  name: string
  price: number
  description?: string
  category: 'cafe-caliente' | 'cafe-frio' | 'pasteleria' | 'combo' | 'coctel' | 'cerveza' | 'vino' | 'vodka' | 'ginebra' | 'tequila' | 'whisky'
  type: 'cafeteria' | 'bebida'
  stock: number
  imageUrl?: string
  size?: string
  // Campos de inventario inteligente
  minStock?: number // Stock mínimo para alertas
  cost?: number // Costo unitario
  purchaseDate?: string // Fecha de compra (ISO string)
  lot?: string // Lote / número de lote
  supplier?: string // Proveedor
  lastSaleDate?: string // Última fecha de venta (ISO string)
  totalSold?: number // Cantidad total vendida
}

const dataFilePath = path.join(process.cwd(), 'data', 'products.json')

export function getProducts(): Product[] {
  try {
    const fileContents = fs.readFileSync(dataFilePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    console.error('Error reading products file:', error)
    return []
  }
}

export function saveProducts(products: Product[]): void {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing products file:', error)
    throw error
  }
}

export function getProductById(id: string): Product | undefined {
  const products = getProducts()
  return products.find(p => p.id === id)
}

export function createProduct(product: Omit<Product, 'id'>): Product {
  const products = getProducts()
  const newProduct: Product = {
    ...product,
    id: `${product.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  products.push(newProduct)
  saveProducts(products)
  return newProduct
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const products = getProducts()
  const index = products.findIndex(p => p.id === id)
  if (index === -1) return null
  
  products[index] = { ...products[index], ...updates }
  saveProducts(products)
  return products[index]
}

export function deleteProduct(id: string): boolean {
  const products = getProducts()
  const filtered = products.filter(p => p.id !== id)
  if (filtered.length === products.length) return false
  
  saveProducts(filtered)
  return true
}

