import { SchemaType, type FunctionDeclaration } from '@google/generative-ai'
import { AriPredictorUnavailableError, FootballApiQuotaError } from '@/lib/ari/errors'
import type { AuthUser } from '@/lib/auth-server'
import { analyzeMatch } from './analyze-match'
import { searchFifaHistory } from './fifa-history'
import { getArandanoPromotions } from './promotions'
import { recommendPollStrategy } from './poll-strategy'
import { getPollaReglamento } from './polla-reglamento'
import { getTodaySchedule } from './today-schedule'
import { getUserPollContext } from './user-context'

export const ARI_TOOLS: FunctionDeclaration[] = [
  {
    name: 'get_polla_reglamento',
    description: 'Reglamento completo de la polla (créditos, puntos, premios, pasaportes).',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'get_user_poll_context',
    description: 'Ranking, créditos y puntos del usuario.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'analyze_match',
    description: 'Stats de un partido.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        matchId: { type: SchemaType.NUMBER },
        homeTeam: { type: SchemaType.STRING },
        awayTeam: { type: SchemaType.STRING },
      },
    },
  },
  {
    name: 'recommend_poll_strategy',
    description: 'Estrategia de picks según ranking/créditos.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: { matchId: { type: SchemaType.NUMBER } },
    },
  },
  {
    name: 'search_fifa_history',
    description: 'Historia Mundial.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: { query: { type: SchemaType.STRING } },
      required: ['query'],
    },
  },
  {
    name: 'get_today_schedule',
    description: 'Partidos de hoy.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'get_arandano_promotions',
    description: 'Promos Arándano.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: { tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } } },
    },
  },
]

export function compactToolResult(raw: string, maxLen = 600): string {
  if (raw.length <= maxLen) return raw
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    if (Array.isArray(obj.matches)) {
      obj.matches = (obj.matches as unknown[]).slice(0, 3)
    }
    const compact = JSON.stringify(obj)
    return compact.length <= maxLen ? compact : `${compact.slice(0, maxLen)}…`
  } catch {
    return `${raw.slice(0, maxLen)}…`
  }
}

export async function executeAriTool(
  name: string,
  args: Record<string, unknown>,
  authUser: AuthUser
): Promise<string> {
  try {
    return await runAriTool(name, args, authUser)
  } catch (err) {
    if (err instanceof FootballApiQuotaError) {
      throw new AriPredictorUnavailableError('football', err)
    }
    throw err
  }
}

async function runAriTool(
  name: string,
  args: Record<string, unknown>,
  authUser: AuthUser
): Promise<string> {
  let result: string
  switch (name) {
    case 'get_polla_reglamento':
      result = JSON.stringify(getPollaReglamento())
      break
    case 'get_user_poll_context':
      result = JSON.stringify(await getUserPollContext(authUser))
      break
    case 'analyze_match':
      result = JSON.stringify(
        await analyzeMatch({
          matchId: args.matchId as number | undefined,
          homeTeam: args.homeTeam as string | undefined,
          awayTeam: args.awayTeam as string | undefined,
        })
      )
      break
    case 'recommend_poll_strategy':
      result = JSON.stringify(
        await recommendPollStrategy(authUser, args.matchId as number | undefined)
      )
      break
    case 'search_fifa_history':
      result = JSON.stringify(searchFifaHistory(String(args.query ?? '')))
      break
    case 'get_today_schedule':
      result = JSON.stringify(await getTodaySchedule())
      break
    case 'get_arandano_promotions':
      result = JSON.stringify(await getArandanoPromotions(args.tags as string[] | undefined))
      break
    default:
      result = JSON.stringify({ error: `tool:${name}` })
  }
  return compactToolResult(result)
}
