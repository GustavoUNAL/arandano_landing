/**
 * Utilidades compartidas para gestión de base de datos
 */

export type DbMode = 'postgres' | 'sqlite' | 'json'

/**
 * Obtiene el modo de base de datos configurado.
 * Prioridad: DB_MODE explícito → postgres si hay DATABASE_URL → sqlite local.
 */
export function getDbMode(): DbMode {
  const mode = process.env.DB_MODE?.toLowerCase().trim()

  if (mode === 'json') return 'json'
  if (mode === 'sqlite') return 'sqlite'
  if (mode === 'postgres') return 'postgres'
  if (process.env.DATABASE_URL) return 'postgres'

  return 'sqlite'
}

/** true cuando los datos van a SQLite o PostgreSQL (no JSON en disco) */
export function usesRelationalDb(): boolean {
  const mode = getDbMode()
  return mode === 'postgres' || mode === 'sqlite'
}
