/**
 * Caché simple en memoria para inventario
 * Reduce consultas repetidas a la base de datos
 */

import { InventoryItem } from './inventory'

let inventoryCache: InventoryItem[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60000 // 60 segundos (1 minuto)

/**
 * Limpia el caché de inventario
 */
export function clearInventoryCache() {
  inventoryCache = null
  cacheTimestamp = 0
}

/**
 * Obtiene el inventario del caché o lo carga
 */
export async function getCachedInventory(loader: () => Promise<InventoryItem[]>): Promise<InventoryItem[]> {
  const now = Date.now()
  
  // Si hay caché válido, retornarlo
  if (inventoryCache && (now - cacheTimestamp) < CACHE_TTL) {
    return inventoryCache
  }
  
  // Cargar y cachear
  inventoryCache = await loader()
  cacheTimestamp = now
  
  return inventoryCache
}
