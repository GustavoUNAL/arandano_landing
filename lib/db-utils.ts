/**
 * Utilidades compartidas para gestión de base de datos
 */

/**
 * Obtiene el modo de base de datos configurado
 * 
 * @returns 'sqlite' | 'json'
 */
export function getDbMode(): 'sqlite' | 'json' {
  const mode = process.env.DB_MODE?.toLowerCase().trim()
  
  // Por defecto: sqlite (más rápido y sin cuotas)
  if (mode === 'json') {
    return 'json'
  }
  
  return 'sqlite'
}

