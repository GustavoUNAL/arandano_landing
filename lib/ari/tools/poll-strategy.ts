import { PREDICTION_COST } from '@/lib/polla-rules'
import { getWorldCupFullData } from '@/lib/football-data'
import type { AuthUser } from '@/lib/auth-server'
import { getUserPollContext } from './user-context'

export async function recommendPollStrategy(authUser: AuthUser, matchId?: number) {
  const ctx = await getUserPollContext(authUser)
  const worldCup = await getWorldCupFullData()

  const pctBehindLeader =
    ctx.leaderPoints > 0 ? ((ctx.leaderPoints - ctx.totalPoints) / ctx.leaderPoints) * 100 : 0

  let situation: 'leading' | 'contending' | 'mid' | 'chasing'
  let pickStyle: 'conservative' | 'balanced' | 'aggressive'
  let recommendation: string

  if (ctx.rank <= 3 && ctx.pointsToTop5 === 0) {
    situation = 'leading'
    pickStyle = 'conservative'
    recommendation =
      'Los datos sugieren proteger la ventaja: prioriza marcadores probables (favorito o empate técnico) y evita arriesgar créditos en resultados extremos.'
  } else if (ctx.rank <= 10 && ctx.pointsToTop5 <= 5) {
    situation = 'contending'
    pickStyle = 'balanced'
    recommendation =
      'Estás cerca del podio. Combina picks seguros en partidos cerrados con uno o dos pronósticos diferenciadores donde tengas lectura clara.'
  } else if (pctBehindLeader > 25) {
    situation = 'chasing'
    pickStyle = 'aggressive'
    recommendation =
      'Existe un riesgo considerable de quedar fuera del Top 5. Considera marcadores menos probables pero con alto upside en partidos donde el favorito no sea abrumador.'
  } else {
    situation = 'mid'
    pickStyle = 'balanced'
    recommendation =
      'Mantén ritmo constante: usa tus créditos en partidos de hoy y busca diferenciarte en 1–2 encuentros por jornada.'
  }

  const today = worldCup.allMatches
    .filter((m) => !m.isFinished && new Date(m.utcDate).getTime() > Date.now() - 3600000)
    .slice(0, 6)
    .map((m) => ({
      id: m.id,
      home: m.homeTeam.shortName || m.homeTeam.name,
      away: m.awayTeam.shortName || m.awayTeam.name,
      creditsCost: PREDICTION_COST,
    }))

  const creditAdvice =
    ctx.credits < PREDICTION_COST
      ? 'Créditos insuficientes para un pick nuevo. Revisa tu saldo.'
      : ctx.credits < PREDICTION_COST * 3
        ? `Saldo ajustado (${ctx.credits} créditos). Prioriza partidos donde tengas mayor confianza.`
        : `Tienes ${ctx.credits.toLocaleString('es-CO')} créditos — suficiente para ${Math.floor(ctx.credits / PREDICTION_COST)} picks nuevos.`

  const focusMatch = matchId ? today.find((m) => m.id === matchId) : null

  return {
    situation,
    pickStyle,
    recommendation,
    creditAdvice,
    reasoning: [
      `Posición ${ctx.rank} de ${ctx.totalParticipants} participantes.`,
      `${ctx.totalPoints} puntos (${ctx.pointsToTop5} pts al Top 5).`,
      `${ctx.credits.toLocaleString('es-CO')} créditos disponibles.`,
      ctx.bestRegion
        ? `Mejor rendimiento en selecciones ${ctx.bestRegion}.`
        : 'Aún pocos picks calificados para detectar patrón regional.',
    ],
    matchesToday: today,
    focusMatch,
  }
}
