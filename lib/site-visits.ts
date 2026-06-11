import fs from 'fs'
import path from 'path'
import { usesRelationalDb } from './db-utils'
import { dbAll, dbGet, dbRun } from './db'

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

export async function getPageVisitCount(pagePath: string): Promise<number> {
  const pathNorm = normalizePath(pagePath)

  if (usesRelationalDb()) {
    const row = await dbGet<{ total: number }>(
      'SELECT COUNT(*) AS total FROM site_visits WHERE path = ?',
      [pathNorm]
    )
    return Number(row?.total) || 0
  }

  const data = readVisitsJson()
  return data.visits.filter((v) => v.path === pathNorm).length
}

export async function recordSiteVisit(pagePath: string): Promise<{ pageVisits: number }> {
  const pathNorm = normalizePath(pagePath)
  const visitedAt = new Date().toISOString()

  if (usesRelationalDb()) {
    await dbRun('INSERT INTO site_visits (path, visitedAt) VALUES (?, ?)', [pathNorm, visitedAt])
    const pageVisits = await getPageVisitCount(pathNorm)
    return { pageVisits }
  }

  const data = readVisitsJson()
  data.visits.push({ path: pathNorm, visitedAt })
  data.total = data.visits.length
  writeVisitsJson(data)
  return { pageVisits: await getPageVisitCount(pathNorm) }
}

/** @deprecated Usar getPageVisitCount */
export async function getSiteVisitTotal(): Promise<number> {
  if (usesRelationalDb()) {
    const row = await dbGet<{ total: number }>('SELECT COUNT(*) AS total FROM site_visits')
    return Number(row?.total) || 0
  }
  return readVisitsJson().total
}
