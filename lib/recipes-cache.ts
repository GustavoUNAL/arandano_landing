/**
 * Caché simple en memoria para recetas
 * Reduce consultas repetidas a la base de datos
 */

import { Recipe } from './recipes'

let recipesCache: Recipe[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60000 // 60 segundos (1 minuto)

/**
 * Limpia el caché de recetas
 */
export function clearRecipesCache() {
  recipesCache = null
  cacheTimestamp = 0
}

/**
 * Obtiene las recetas del caché o las carga
 */
export async function getCachedRecipes(loader: () => Promise<Recipe[]>): Promise<Recipe[]> {
  const now = Date.now()
  
  // Si hay caché válido, retornarlo
  if (recipesCache && (now - cacheTimestamp) < CACHE_TTL) {
    return recipesCache
  }
  
  // Cargar y cachear
  recipesCache = await loader()
  cacheTimestamp = now
  
  return recipesCache
}
