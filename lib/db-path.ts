import fs from 'fs'
import path from 'path'

/**
 * Raíz del proyecto en disco. En producción con PM2 + standalone, usar PROJECT_ROOT
 * para que SQLite y data/ no dependan del cwd (.next/standalone).
 */
export function getProjectRoot(): string {
  if (process.env.PROJECT_ROOT) {
    return path.resolve(process.env.PROJECT_ROOT)
  }
  return process.cwd()
}

export function getDataDir(): string {
  if (process.env.DATA_DIR) {
    return path.resolve(process.env.DATA_DIR)
  }
  return path.join(getProjectRoot(), 'data')
}

export function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return path.resolve(process.env.DATABASE_PATH)
  }
  return path.join(getDataDir(), 'arandano.db')
}

export function ensureDataDir(): string {
  const dir = getDataDir()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}
