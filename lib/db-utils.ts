/**
 * Utilidades compartidas para verificar disponibilidad de Firebase durante build
 */

import { db } from './firebase-admin'

/**
 * Verifica si db está disponible y funcional
 * Durante el build, siempre retorna false para usar JSON
 */
export function isDbAvailable(): boolean {
  // Durante el build, siempre usar JSON
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return false
  }
  
  // Verificar que db existe, no es null, no es undefined, y tiene el método collection
  if (!db || db === null || db === undefined) {
    return false
  }
  
  // Verificar que no es un objeto vacío (fallback del export)
  if (Object.keys(db).length === 0) {
    return false
  }
  
  // Verificar que tiene el método collection
  return typeof (db as any).collection === 'function'
}

