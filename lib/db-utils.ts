/**
 * Utilidades compartidas para gestión de base de datos
 */

import { db } from './firebase-admin'

/**
 * Obtiene el modo de base de datos configurado
 * Por defecto retorna 'firebase' para garantizar uso de Firebase en producción
 * 
 * @returns 'firebase' | 'json'
 */
export function getDbMode(): 'firebase' | 'json' {
  const mode = process.env.DB_MODE?.toLowerCase().trim()
  
  // Solo usar JSON si está explícitamente configurado como 'json'
  if (mode === 'json') {
    return 'json'
  }
  
  // Por defecto: firebase (incluso si está vacío, undefined, o cualquier otro valor)
  return 'firebase'
}

/**
 * Verifica si db está disponible y funcional
 * Solo retorna false si DB_MODE es 'json' o si db no está disponible
 */
export function isDbAvailable(): boolean {
  const mode = getDbMode()
  
  // Si el modo es JSON, db no está disponible (porque no se usa)
  if (mode === 'json') {
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

