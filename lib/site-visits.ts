import fs from 'fs'
import path from 'path'
import { getDbMode } from './db-utils'
import { getDatabase } from './db-sqlite'

const visitsJsonPath = path.join(process.cwd(), 'data', 'site-visits.json')

type VisitsFile = {
  total: number
  visits: Array<{ path: string; visitedAt: string }>
}

function readVisitsJson(): VisitsFile {
  try {
    if (fs.existsSync(visitsJsonPath)) {
      return JSON.parse(fs.readFileSync(visitsJsonPath, 'utf8')) as VisitsFile
    }
  } catch {
    /* ignore */
  }
  return { total: 0, visits: [] }
}

function writeVisitsJson(data: VisitsFile): void {
  fs.mkdirSync(path.dirname(visitsJsonPath), { recursive: true })
  fs.writeFileSync(visitsJsonPath, JSON.stringify(data, null, 2), 'utf8')
}

function normalizePath(pagePath: string): string {
  const p = (pagePath || '/').split('?')[0].split('#')[0]
  return p || '/'
}

export function getPageVisitCount(pagePath: string): number {
  const pathNorm = normalizePath(pagePath)

  if (getDbMode() === 'sqlite') {
    const db = getDatabase()
    const row = db
      .prepare('SELECT COUNT(*) AS total FROM site_visits WHERE path = ?')
      .get(pathNorm) as { total: number }
    return Number(row.total) || 0
  }

  const data = readVisitsJson()
  return data.visits.filter((v) => v.path === pathNorm).length
}

export function recordSiteVisit(pagePath: string): { pageVisits: number } {
  const pathNorm = normalizePath(pagePath)
  const visitedAt = new Date().toISOString()

  if (getDbMode() === 'sqlite') {
    const db = getDatabase()
    db.prepare('INSERT INTO site_visits (path, visitedAt) VALUES (?, ?)').run(
      pathNorm,
      visitedAt
    )
    return { pageVisits: getPageVisitCount(pathNorm) }
  }

  const data = readVisitsJson()
  data.visits.push({ path: pathNorm, visitedAt })
  data.total = data.visits.length
  writeVisitsJson(data)
  return { pageVisits: getPageVisitCount(pathNorm) }
}

/** @deprecated Usar getPageVisitCount */
export function getSiteVisitTotal(): number {
  if (getDbMode() === 'sqlite') {
    const db = getDatabase()
    const row = db.prepare('SELECT COUNT(*) AS total FROM site_visits').get() as {
      total: number
    }
    return Number(row.total) || 0
  }
  return readVisitsJson().total
}
