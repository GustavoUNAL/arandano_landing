import { dbAll, dbGet, dbRun } from '@/lib/db'
import { randomUUID } from 'crypto'

export interface AriThreadRow {
  id: string
  userId: string
  title: string | null
  context: string
  createdAt: string
  updatedAt: string
}

export interface AriMessageRow {
  id: string
  threadId: string
  role: string
  content: string
  metadata: string
  createdAt: string
}

export async function createThread(userId: string, title: string, context: object) {
  const id = randomUUID()
  const now = new Date().toISOString()
  await dbRun(
    `INSERT INTO ari_threads (id, user_id, title, context, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, title, JSON.stringify(context), now, now]
  )
  return { id, userId, title, createdAt: now, updatedAt: now }
}

export async function getThreadForUser(threadId: string, userId: string) {
  return dbGet<AriThreadRow>(
    `SELECT id, user_id AS userId, title, CAST(context AS TEXT) AS context, created_at AS createdAt, updated_at AS updatedAt
     FROM ari_threads WHERE id = ? AND user_id = ?`,
    [threadId, userId]
  )
}

export async function touchThread(threadId: string) {
  await dbRun(`UPDATE ari_threads SET updated_at = ? WHERE id = ?`, [
    new Date().toISOString(),
    threadId,
  ])
}

export async function listThreadMessages(threadId: string, limit = 24) {
  return dbAll<AriMessageRow>(
    `SELECT id, thread_id AS threadId, role, content, CAST(metadata AS TEXT) AS metadata, created_at AS createdAt
     FROM ari_messages WHERE thread_id = ? ORDER BY created_at ASC LIMIT ?`,
    [threadId, limit]
  )
}

export async function insertMessage(input: {
  threadId: string
  role: string
  content: string
  metadata?: object
}) {
  const id = randomUUID()
  const now = new Date().toISOString()
  await dbRun(
    `INSERT INTO ari_messages (id, thread_id, role, content, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.threadId, input.role, input.content, JSON.stringify(input.metadata ?? {}), now]
  )
  return id
}

export async function countUsageLastHour(userId: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const row = await dbGet<{ c: number }>(
    `SELECT COUNT(*) AS c FROM ari_usage_logs WHERE user_id = ? AND created_at >= ?`,
    [userId, since]
  )
  return Number(row?.c ?? 0)
}

export async function insertUsageLog(input: {
  userId: string
  threadId: string
  model: string
  promptTokens: number
  outputTokens: number
  toolCalls: number
  latencyMs: number
}) {
  await dbRun(
    `INSERT INTO ari_usage_logs (id, user_id, thread_id, model, prompt_tokens, output_tokens, tool_calls, latency_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      input.userId,
      input.threadId,
      input.model,
      input.promptTokens,
      input.outputTokens,
      input.toolCalls,
      input.latencyMs,
      new Date().toISOString(),
    ]
  )
}

export async function getWelcomeSnapshot(userId: string, dateKey: string) {
  return dbGet<{ content: string; payload: string }>(
    `SELECT content, CAST(payload AS TEXT) AS payload FROM ari_welcome_snapshots WHERE user_id = ? AND date_key = ?`,
    [userId, dateKey]
  )
}

export async function saveWelcomeSnapshot(
  userId: string,
  dateKey: string,
  content: string,
  payload: object
) {
  const id = randomUUID()
  await dbRun(
    `INSERT INTO ari_welcome_snapshots (id, user_id, date_key, content, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, date_key) DO UPDATE SET content = EXCLUDED.content, payload = EXCLUDED.payload`,
    [id, userId, dateKey, content, JSON.stringify(payload), new Date().toISOString()]
  )
}

export async function getActivePromotions() {
  const now = new Date().toISOString()
  return dbAll<{
    title: string
    body: string
    ctaLabel: string | null
    ctaUrl: string | null
    tags: string
  }>(
    `SELECT title, body, cta_label AS ctaLabel, cta_url AS ctaUrl, CAST(tags AS TEXT) AS tags
     FROM ari_promotions
     WHERE active = TRUE
       AND (starts_at IS NULL OR starts_at <= ?)
       AND (ends_at IS NULL OR ends_at >= ?)
     ORDER BY priority DESC
     LIMIT 5`,
    [now, now]
  )
}
