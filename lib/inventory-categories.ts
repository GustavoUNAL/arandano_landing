/**
 * Categorías oficiales del inventario.
 * Cada producto debe tener una de estas categorías para consultas y reportes.
 */

export const INVENTORY_CATEGORIES = [
  'activos',
  'cigarrillos',
  'aseo',
  'comestibles',
  'bebidas alcoholicas',
  'insumos para cocteles',
  'insumos para cafeteria'
] as const

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number]

export function isValidInventoryCategory(category: string): category is InventoryCategory {
  return INVENTORY_CATEGORIES.includes(category as InventoryCategory)
}

export function normalizeInventoryCategory(category: string | undefined): string {
  if (!category || !category.trim()) return 'comestibles'
  const c = category.trim().toLowerCase()
  if (INVENTORY_CATEGORIES.includes(c as InventoryCategory)) return c
  // Mapeos comunes por si llega un valor antiguo
  const map: Record<string, InventoryCategory> = {
    'productos de aseo': 'aseo',
    'cafeteria': 'insumos para cafeteria',
    'insumos para café': 'insumos para cafeteria',
    'bebidas': 'bebidas alcoholicas',
    'cocteles': 'insumos para cocteles',
    'productos regulados': 'cigarrillos'
  }
  return map[c] || 'comestibles'
}
