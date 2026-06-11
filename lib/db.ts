/**
 * Capa unificada de acceso a datos: PostgreSQL (Neon) o SQLite local.
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { getDbMode } from './db-utils'
import { ensurePostgresSchema } from './db-schema-postgres'
import { seedProductsIfEmpty } from './db-seed'

const PG_COLUMN_MAP: Record<string, string> = {
  imageurl: 'imageUrl',
  minstock: 'minStock',
  purchasedate: 'purchaseDate',
  lastsaledate: 'lastSaleDate',
  totalsold: 'totalSold',
  createdat: 'createdAt',
  updatedat: 'updatedAt',
  initialquantity: 'initialQuantity',
  capacityunit: 'capacityUnit',
  currentcapacity: 'currentCapacity',
  currentcapacityunit: 'currentCapacityUnit',
  unitsperpackage: 'unitsPerPackage',
  unitsperpackageunit: 'unitsPerPackageUnit',
  producttype: 'productType',
  unitprice: 'unitPrice',
  totalvalue: 'totalValue',
  productid: 'productId',
  paymentmethod: 'paymentMethod',
  productname: 'productName',
  inventoryitemid: 'inventoryItemId',
  completedat: 'completedAt',
  duedate: 'dueDate',
  assignedto: 'assignedTo',
  visitedat: 'visitedAt',
  clickedat: 'clickedAt',
  durationseconds: 'durationSeconds',
  recordedat: 'recordedAt',
  displayalias: 'displayAlias',
  totalpoints: 'totalPoints',
  userid: 'userId',
  matchid: 'matchId',
  hometeamname: 'homeTeamName',
  awayteamname: 'awayTeamName',
  hometeamcrest: 'homeTeamCrest',
  awayteamcrest: 'awayTeamCrest',
  matchdate: 'matchDate',
  matchgroup: 'matchGroup',
  homescore: 'homeScore',
  awayscore: 'awayScore',
  creditswagered: 'creditsWagered',
  actualhomescore: 'actualHomeScore',
  actualawayscore: 'actualAwayScore',
  pointsearned: 'pointsEarned',
  settledat: 'settledAt',
  avgtimeseconds: 'avgTimeSeconds',
  totaltimeseconds: 'totalTimeSeconds',
}

let sql: NeonQueryFunction<false, false> | null = null
let appSchemaReady = false
let schemaInitPromise: Promise<void> | null = null

function isPostgresMode(): boolean {
  return getDbMode() === 'postgres'
}

function getSql(): NeonQueryFunction<false, false> {
  if (!sql) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL no configurado')
    sql = neon(url)
  }
  return sql
}

export function toPgParams(query: string): string {
  let i = 0
  return query.replace(/\?/g, () => `$${++i}`)
}

export function normalizePgRow<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    out[PG_COLUMN_MAP[key.toLowerCase()] ?? key] = value
  }
  return out as T
}

async function ensureSchema(): Promise<void> {
  if (!isPostgresMode() || appSchemaReady) return
  if (schemaInitPromise) return schemaInitPromise

  schemaInitPromise = (async () => {
    await ensurePostgresSchema(getSql())
    await seedProductsIfEmpty()
    appSchemaReady = true
  })()

  return schemaInitPromise
}

async function getSqliteDatabase() {
  const { getDatabase } = await import('./db-sqlite')
  return getDatabase()
}

export interface DbExecutor {
  all<T>(query: string, params?: unknown[]): Promise<T[]>
  get<T>(query: string, params?: unknown[]): Promise<T | undefined>
  run(query: string, params?: unknown[]): Promise<{ changes: number }>
}

export async function dbAll<T>(query: string, params: unknown[] = []): Promise<T[]> {
  if (isPostgresMode()) {
    await ensureSchema()
    const rows = (await getSql().query(toPgParams(query), params)) as Record<string, unknown>[]
    if (!Array.isArray(rows)) return []
    return rows.map((row) => normalizePgRow(row)) as T[]
  }
  const db = await getSqliteDatabase()
  return db.prepare(query).all(...params) as T[]
}

export async function dbGet<T>(query: string, params: unknown[] = []): Promise<T | undefined> {
  if (isPostgresMode()) {
    const rows = await dbAll<T>(query, params)
    return rows[0]
  }
  const db = await getSqliteDatabase()
  return db.prepare(query).get(...params) as T | undefined
}

export async function dbRun(query: string, params: unknown[] = []): Promise<{ changes: number }> {
  if (isPostgresMode()) {
    await ensureSchema()
    await getSql().query(toPgParams(query), params)
    return { changes: 1 }
  }
  const db = await getSqliteDatabase()
  const result = db.prepare(query).run(...params)
  return { changes: result.changes }
}

export async function dbTransaction(fn: (tx: DbExecutor) => Promise<void>): Promise<void> {
  await ensureSchema()
  await fn({ all: dbAll, get: dbGet, run: dbRun })
}
