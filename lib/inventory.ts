import fs from 'fs'
import path from 'path'

export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number // Cantidad actual de productos
  initialQuantity?: number // Cantidad original comprada (productos)
  unit: string // Unidad de producto (Botella, Lata, etc.)
  /** ID del producto a la venta al que pertenece este ítem (stock enlazado) */
  productId?: string | null
  capacity?: number // Capacidad por unidad individual (ej: 750ml por botella)
  capacityUnit?: string // Unidad de capacidad (ml, cm3, litro, etc.)
  currentCapacity?: number // Capacidad actual por unidad (puede ser menor a la inicial)
  currentCapacityUnit?: string // Unidad de capacidad actual
  unitsPerPackage?: number // Cantidad de unidades individuales por paquete (ej: 6 botellas por paquete)
  unitsPerPackageUnit?: string // Unidad de las unidades individuales dentro del paquete (ej: Botella, Lata)
  productType?: string // Tipo de producto según categoría específica (inventory-permanent, food-edible, disposables, etc.)
  unitPrice: number
  totalValue: number
  code?: string
  purchaseDate?: string
  supplier?: string
  lot?: string
  notes?: string
}

const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json')

export function getInventory(): InventoryItem[] {
  try {
    if (!fs.existsSync(inventoryPath)) {
      return []
    }
    const data = fs.readFileSync(inventoryPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading inventory:', error)
    return []
  }
}

export function saveInventory(items: InventoryItem[]): void {
  try {
    fs.writeFileSync(inventoryPath, JSON.stringify(items, null, 2), 'utf8')
  } catch (error) {
    console.error('Error saving inventory:', error)
    throw error
  }
}

export function createInventoryItem(item: Omit<InventoryItem, 'id'>): InventoryItem {
  const items = getInventory()
  const newItem: InventoryItem = {
    ...item,
    id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  items.push(newItem)
  saveInventory(items)
  return newItem
}

export function updateInventoryItem(id: string, updates: Partial<InventoryItem>): InventoryItem | null {
  const items = getInventory()
  const index = items.findIndex(item => item.id === id)
  if (index === -1) return null
  
  items[index] = { ...items[index], ...updates }
  saveInventory(items)
  return items[index]
}

export function deleteInventoryItem(id: string): boolean {
  const items = getInventory()
  const filtered = items.filter(item => item.id !== id)
  if (filtered.length === items.length) return false
  
  saveInventory(filtered)
  return true
}

