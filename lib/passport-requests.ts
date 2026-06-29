import { randomUUID } from 'crypto'
import { dbAll, dbGet, dbRun } from '@/lib/db'
import { savePassportReceipt } from '@/lib/passport-receipt-storage'
import {
  KNOCKOUT_PASSPORT_PRICE_COP,
  type PassportRequestStatus,
} from '@/lib/polla-rules'
import { setUserKnockoutPassport } from '@/lib/sports-polla'

export interface PassportRequestRow {
  id: string
  userId: string
  status: PassportRequestStatus
  priceCop: number
  userNote: string | null
  receiptPath: string | null
  adminNote: string | null
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
  reviewedAt: string | null
}

export interface PassportRequestWithUser extends PassportRequestRow {
  displayAlias: string | null
  email: string
  name: string | null
  image: string | null
  hasKnockoutPassport: boolean
}

function mapRow(row: Record<string, unknown>): PassportRequestRow {
  return {
    id: String(row.id),
    userId: String(row.userId),
    status: row.status as PassportRequestStatus,
    priceCop: Number(row.priceCop),
    userNote: row.userNote != null ? String(row.userNote) : null,
    receiptPath: row.receiptPath != null ? String(row.receiptPath) : null,
    adminNote: row.adminNote != null ? String(row.adminNote) : null,
    reviewedBy: row.reviewedBy != null ? String(row.reviewedBy) : null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
    reviewedAt: row.reviewedAt != null ? String(row.reviewedAt) : null,
  }
}

export async function getLatestPassportRequestForUser(
  userId: string
): Promise<PassportRequestRow | null> {
  const row = await dbGet<Record<string, unknown>>(
    `SELECT * FROM knockout_passport_requests
     WHERE userId = ?
     ORDER BY createdAt DESC
     LIMIT 1`,
    [userId]
  )
  return row ? mapRow(row) : null
}

export async function getPendingPassportRequestForUser(
  userId: string
): Promise<PassportRequestRow | null> {
  const row = await dbGet<Record<string, unknown>>(
    `SELECT * FROM knockout_passport_requests
     WHERE userId = ? AND status = 'pending'
     ORDER BY createdAt DESC
     LIMIT 1`,
    [userId]
  )
  return row ? mapRow(row) : null
}

export async function createPassportRequest(
  userId: string,
  input: { userNote?: string; receiptFile: File }
): Promise<PassportRequestRow> {
  const existing = await getPendingPassportRequestForUser(userId)
  if (existing) {
    throw new Error('Ya tienes una solicitud pendiente. Espera la respuesta del equipo.')
  }

  const user = await dbGet<{ hasKnockoutPassport: number | boolean }>(
    'SELECT hasKnockoutPassport FROM sports_users WHERE id = ?',
    [userId]
  )
  if (!user) throw new Error('Usuario no encontrado')
  if (user.hasKnockoutPassport) {
    throw new Error('Ya tienes el Pasaporte Polla Final activo.')
  }

  const now = new Date().toISOString()
  const note = input.userNote?.trim().slice(0, 280) || null
  const id = randomUUID()
  const receiptPath = await savePassportReceipt(id, input.receiptFile)

  await dbRun(
    `INSERT INTO knockout_passport_requests
      (id, userId, status, priceCop, userNote, receiptPath, adminNote, reviewedBy, createdAt, updatedAt, reviewedAt)
     VALUES (?, ?, 'pending', ?, ?, ?, NULL, NULL, ?, ?, NULL)`,
    [id, userId, KNOCKOUT_PASSPORT_PRICE_COP, note, receiptPath, now, now]
  )

  const created = await dbGet<Record<string, unknown>>(
    'SELECT * FROM knockout_passport_requests WHERE id = ?',
    [id]
  )
  if (!created) throw new Error('No se pudo crear la solicitud')
  return mapRow(created)
}

export async function listPassportRequestsForAdmin(
  status?: PassportRequestStatus
): Promise<PassportRequestWithUser[]> {
  const filter = status ? 'WHERE r.status = ?' : ''
  const params = status ? [status] : []

  const rows = await dbAll<Record<string, unknown>>(
    `SELECT
      r.*,
      su.displayAlias,
      su.email,
      su.name,
      su.image,
      su.hasKnockoutPassport
     FROM knockout_passport_requests r
     JOIN sports_users su ON su.id = r.userId
     ${filter}
     ORDER BY
       CASE r.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
       r.createdAt DESC`,
    params
  )

  return rows.map((row) => ({
    ...mapRow(row),
    displayAlias: row.displayAlias != null ? String(row.displayAlias) : null,
    email: String(row.email),
    name: row.name != null ? String(row.name) : null,
    image: row.image != null ? String(row.image) : null,
    hasKnockoutPassport: Boolean(row.hasKnockoutPassport),
  }))
}

export async function reviewPassportRequest(input: {
  requestId: string
  action: 'approve' | 'reject'
  adminEmail: string
  adminNote?: string
}): Promise<PassportRequestWithUser> {
  const row = await dbGet<Record<string, unknown>>(
    'SELECT * FROM knockout_passport_requests WHERE id = ?',
    [input.requestId]
  )
  if (!row) throw new Error('Solicitud no encontrada')
  const request = mapRow(row)
  if (request.status !== 'pending') {
    throw new Error('Esta solicitud ya fue revisada')
  }

  const now = new Date().toISOString()
  const status: PassportRequestStatus = input.action === 'approve' ? 'approved' : 'rejected'
  const adminNote = input.adminNote?.trim().slice(0, 280) || null

  await dbRun(
    `UPDATE knockout_passport_requests
     SET status = ?, adminNote = ?, reviewedBy = ?, reviewedAt = ?, updatedAt = ?
     WHERE id = ?`,
    [status, adminNote, input.adminEmail, now, now, input.requestId]
  )

  if (input.action === 'approve') {
    await setUserKnockoutPassport(request.userId, true)
  }

  const updated = await listPassportRequestsForAdmin()
  const found = updated.find((r) => r.id === input.requestId)
  if (!found) throw new Error('No se pudo cargar la solicitud actualizada')
  return found
}

export async function countKnockoutPassportHolders(): Promise<number> {
  const row = await dbGet<{ count: number }>(
    `SELECT COUNT(*) AS count FROM sports_users WHERE hasKnockoutPassport != 0`
  )
  return Number(row?.count ?? 0)
}

export async function countPendingPassportRequests(): Promise<number> {
  const row = await dbGet<{ count: number }>(
    `SELECT COUNT(*) AS count FROM knockout_passport_requests WHERE status = 'pending'`
  )
  return Number(row?.count ?? 0)
}
