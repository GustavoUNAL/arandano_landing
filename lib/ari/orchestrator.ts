import type { Part } from '@google/generative-ai'
import type { AuthUser } from '@/lib/auth-server'
import {
  CHAT_MAX_OUTPUT,
  CHAT_TEMPERATURE,
  generateContentWithFallback,
  type Content,
} from '@/lib/ari/gemini-client'
import { sanitizeAriResponse } from '@/lib/ari/guardrails'
import * as ariDb from '@/lib/ari/repository'
import { ARI_SYSTEM_PROMPT } from '@/lib/ari/system-prompt'
import { executeAriTool } from '@/lib/ari/tools'

const MAX_ITERATIONS = 3
const HISTORY_TURNS = 4
const RATE_LIMIT = Number(process.env.ARI_RATE_LIMIT_PER_HOUR ?? 30)

function historyToContents(history: { role: string; content: string }[]): Content[] {
  return history.slice(-HISTORY_TURNS * 2).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content.slice(0, 400) }],
  }))
}

export async function checkRateLimit(userId: string): Promise<boolean> {
  const count = await ariDb.countUsageLastHour(userId)
  return count < RATE_LIMIT
}

export async function runAriChat(input: {
  authUser: AuthUser
  message: string
  threadId?: string
  matchId?: number
}) {
  const start = Date.now()

  let threadId = input.threadId
  if (threadId) {
    const existing = await ariDb.getThreadForUser(threadId, input.authUser.id)
    if (!existing) threadId = undefined
  }
  if (!threadId) {
    const created = await ariDb.createThread(
      input.authUser.id,
      input.message.slice(0, 80),
      input.matchId ? { matchId: input.matchId } : {}
    )
    threadId = created.id
  }

  const history = await ariDb.listThreadMessages(threadId, HISTORY_TURNS * 2)
  await ariDb.insertMessage({ threadId, role: 'user', content: input.message })

  const matchHint = input.matchId ? ` Partido id ${input.matchId}.` : ''
  const systemInstruction = ARI_SYSTEM_PROMPT + matchHint

  const contents: Content[] = [
    ...historyToContents(history),
    { role: 'user', parts: [{ text: input.message.slice(0, 500) }] },
  ]

  let toolCalls = 0
  let promptTokens = 0
  let outputTokens = 0
  let finalContent = ''
  let modelUsed = ''

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const { result, modelName } = await generateContentWithFallback({
      systemInstruction,
      request: { contents },
      generationConfig: { temperature: CHAT_TEMPERATURE, maxOutputTokens: CHAT_MAX_OUTPUT },
    })
    modelUsed = modelName
    const response = result.response

    promptTokens += response.usageMetadata?.promptTokenCount ?? 0
    outputTokens += response.usageMetadata?.candidatesTokenCount ?? 0

    const calls = response.functionCalls()
    if (calls?.length) {
      const modelContent = response.candidates?.[0]?.content
      if (modelContent) contents.push(modelContent)

      const functionResponseParts: Part[] = []
      for (const call of calls) {
        toolCalls++
        let args = call.args as Record<string, unknown>
        if (input.matchId && call.name === 'analyze_match' && !args.matchId) {
          args = { ...args, matchId: input.matchId }
        }
        const toolResult = await executeAriTool(call.name, args, input.authUser)
        let parsed: object
        try {
          parsed = JSON.parse(toolResult)
        } catch {
          parsed = { r: toolResult }
        }
        functionResponseParts.push({
          functionResponse: { name: call.name, response: parsed },
        })
      }
      contents.push({ role: 'user', parts: functionResponseParts })
      continue
    }

    finalContent = response.text()
    break
  }

  if (!finalContent) {
    finalContent = 'No pude responder ahora. ¿Lo intentas otra vez?'
  }

  finalContent = sanitizeAriResponse(finalContent)

  await ariDb.insertMessage({
    threadId,
    role: 'assistant',
    content: finalContent,
    metadata: { toolCalls, model: modelUsed },
  })
  await ariDb.touchThread(threadId)
  await ariDb.insertUsageLog({
    userId: input.authUser.id,
    threadId,
    model: modelUsed,
    promptTokens,
    outputTokens,
    toolCalls,
    latencyMs: Date.now() - start,
  })

  return { threadId, content: finalContent }
}

function firstName(name?: string | null) {
  if (!name?.trim()) return ''
  return name.trim().split(/\s+/)[0]
}

function buildContextualSuggestions(
  ctx: Awaited<ReturnType<typeof import('@/lib/ari/tools/user-context').getUserPollContext>>,
  schedule: Awaited<ReturnType<typeof import('@/lib/ari/tools/today-schedule').getTodaySchedule>>
) {
  const suggestions: string[] = ['¿Cómo funciona la polla?', `¿Cómo voy? (#${ctx.rank})`]

  const next = schedule.matches.find((m) => !m.isLive) ?? schedule.matches[0]
  if (next) {
    suggestions.push(`Analiza ${next.home} vs ${next.away}`)
  } else {
    suggestions.push('¿Cómo se ganan puntos?')
  }

  if (ctx.credits < 500) {
    suggestions.push('¿Estrategia con pocos créditos?')
  }

  return [...new Set(suggestions)].slice(0, 4)
}

export async function generateAriWelcome(authUser: AuthUser) {
  const dateKey = `${new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })}-v4`

  const cached = await ariDb.getWelcomeSnapshot(authUser.id, dateKey)
  if (cached) {
    let suggestions: string[] = []
    try {
      const payload = JSON.parse(cached.payload || '{}') as { suggestions?: string[] }
      suggestions = payload.suggestions ?? []
    } catch {
      /* ignore */
    }
    return { content: cached.content, suggestions, cached: true }
  }

  const { getUserPollContext } = await import('@/lib/ari/tools/user-context')
  const { getTodaySchedule } = await import('@/lib/ari/tools/today-schedule')
  const ctx = await getUserPollContext(authUser)
  const schedule = await getTodaySchedule()

  const name = firstName(authUser.name)
  const greeting = name ? `¡Hola, ${name}!` : '¡Hola!'
  const mundial =
    schedule.total > 0
      ? `Hoy hay **${schedule.total}** partido${schedule.total === 1 ? '' : 's'}.`
      : 'Hoy no hay partidos, pero el Mundial sigue picante.'

  const content = `${greeting} 👋 ¿Cómo estás?

${mundial} Vas **#${ctx.rank}** de **${ctx.totalParticipants}** · **${ctx.credits.toLocaleString('es-CO')}** créditos · **${ctx.totalPoints}** pts.

Puedo explicarte **cómo funciona la polla**, cómo vas en el ranking, analizar partidos y darte estrategia.`

  const suggestions = buildContextualSuggestions(ctx, schedule)

  await ariDb.saveWelcomeSnapshot(authUser.id, dateKey, content, { suggestions })

  return { content, suggestions, cached: false }
}
