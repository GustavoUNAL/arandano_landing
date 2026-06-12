import { getWorldCupFullData } from '@/lib/football-data'
import type { EnrichedMatch } from '@/lib/football-data'

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function teamMatchesQuery(teamName: string, match: EnrichedMatch): boolean {
  const q = normalizeName(teamName)
  const names = [
    match.homeTeam.name,
    match.homeTeam.shortName,
    match.awayTeam.name,
    match.awayTeam.shortName,
    match.homeTeam.tla,
    match.awayTeam.tla,
  ]
    .filter(Boolean)
    .map((n) => normalizeName(n!))
  return names.some((n) => n.includes(q) || q.includes(n))
}

function findMatch(
  allMatches: EnrichedMatch[],
  input: { matchId?: number; homeTeam?: string; awayTeam?: string }
): EnrichedMatch | null {
  if (input.matchId) {
    return allMatches.find((m) => m.id === input.matchId) ?? null
  }
  if (input.homeTeam && input.awayTeam) {
    return (
      allMatches.find(
        (m) => teamMatchesQuery(input.homeTeam!, m) && teamMatchesQuery(input.awayTeam!, m)
      ) ?? null
    )
  }
  if (input.homeTeam || input.awayTeam) {
    const q = input.homeTeam ?? input.awayTeam!
    return allMatches.find((m) => teamMatchesQuery(q, m)) ?? null
  }
  return null
}

function isTeamHome(teamName: string, match: EnrichedMatch): boolean {
  const q = normalizeName(teamName)
  return [match.homeTeam.name, match.homeTeam.shortName, match.homeTeam.tla]
    .filter(Boolean)
    .some((n) => {
      const h = normalizeName(n!)
      return h.includes(q) || q.includes(h)
    })
}

function lastNForTeam(matches: EnrichedMatch[], teamName: string, n: number) {
  return matches
    .filter((m) => m.isFinished && teamMatchesQuery(teamName, m))
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, n)
    .map((m) => {
      const isHome = isTeamHome(teamName, m)
      const home = m.displayScore.home ?? 0
      const away = m.displayScore.away ?? 0
      const gf = isHome ? home : away
      const ga = isHome ? away : home
      const result = gf > ga ? 'W' : gf < ga ? 'L' : 'D'
      return {
        date: m.formattedDate,
        opponent: isHome ? m.awayTeam.shortName || m.awayTeam.name : m.homeTeam.shortName || m.homeTeam.name,
        score: `${home}-${away}`,
        gf,
        ga,
        result,
      }
    })
}

function h2hStats(matches: EnrichedMatch[], homeName: string, awayName: string) {
  const h2h = matches.filter(
    (m) =>
      m.isFinished &&
      teamMatchesQuery(homeName, m) &&
      teamMatchesQuery(awayName, m)
  )
  let homeWins = 0
  let awayWins = 0
  let draws = 0
  for (const m of h2h) {
    const h = m.displayScore.home ?? 0
    const a = m.displayScore.away ?? 0
    const homeSideIsHomeName = isTeamHome(homeName, m)
    if (h === a) draws++
    else if (homeSideIsHomeName ? h > a : a > h) homeWins++
    else awayWins++
  }
  return {
    played: h2h.length,
    homeWins,
    draws,
    awayWins,
    lastMeetings: h2h.slice(-3).map((m) => ({
      date: m.formattedDate,
      score: `${m.displayScore.home}-${m.displayScore.away}`,
    })),
  }
}

function formScore(last5: { result: string }[]): number {
  if (last5.length === 0) return 50
  const pts = last5.reduce((s, m) => s + (m.result === 'W' ? 3 : m.result === 'D' ? 1 : 0), 0)
  return Math.round((pts / (last5.length * 3)) * 100)
}

function computeProbabilities(homeForm: number, awayForm: number, h2h: ReturnType<typeof h2hStats>) {
  let home = 0.35 + (homeForm - awayForm) * 0.002 + (h2h.homeWins - h2h.awayWins) * 0.03
  let away = 0.3 + (awayForm - homeForm) * 0.002 + (h2h.awayWins - h2h.homeWins) * 0.03
  let draw = 0.28
  home = Math.max(0.12, Math.min(0.72, home))
  away = Math.max(0.12, Math.min(0.72, away))
  draw = Math.max(0.15, 1 - home - away)
  const total = home + draw + away
  return {
    home: Math.round((home / total) * 100),
    draw: Math.round((draw / total) * 100),
    away: Math.round((away / total) * 100),
  }
}

export async function analyzeMatch(input: {
  matchId?: number
  homeTeam?: string
  awayTeam?: string
}) {
  const worldCup = await getWorldCupFullData()
  const match = findMatch(worldCup.allMatches, input)
  if (!match) {
    return { error: 'No encontré ese partido en el calendario del Mundial 2026.' }
  }

  const homeName = match.homeTeam.shortName || match.homeTeam.name
  const awayName = match.awayTeam.shortName || match.awayTeam.name
  const finished = worldCup.allMatches.filter((m) => m.isFinished)

  const homeLast5 = lastNForTeam(finished, homeName, 5)
  const awayLast5 = lastNForTeam(finished, awayName, 5)
  const h2h = h2hStats(finished, homeName, awayName)

  const homeForm = formScore(homeLast5)
  const awayForm = formScore(awayLast5)
  const probs = computeProbabilities(homeForm, awayForm, h2h)

  const homeGoals = homeLast5.reduce((s, m) => ({ scored: s.scored + m.gf, conceded: s.conceded + m.ga }), {
    scored: 0,
    conceded: 0,
  })
  const awayGoals = awayLast5.reduce((s, m) => ({ scored: s.scored + m.gf, conceded: s.conceded + m.ga }), {
    scored: 0,
    conceded: 0,
  })

  const wcHome = finished.filter((m) => m.stage === 'GROUP_STAGE' && teamMatchesQuery(homeName, m)).length
  const wcAway = finished.filter((m) => m.stage === 'GROUP_STAGE' && teamMatchesQuery(awayName, m)).length

  const confidence =
    homeLast5.length >= 3 && awayLast5.length >= 3 ? 'media' : homeLast5.length > 0 ? 'baja' : 'baja'

  const dataGaps: string[] = []
  if (homeLast5.length < 3) dataGaps.push(`Pocos partidos recientes de ${homeName} en el torneo.`)
  if (awayLast5.length < 3) dataGaps.push(`Pocos partidos recientes de ${awayName} en el torneo.`)
  if (!process.env.FOOTBALL_DATA_API_TOKEN) dataGaps.push('Ranking FIFA no consultado (sin token API).')

  const topScore =
    probs.home >= probs.away
      ? { home: Math.min(3, Math.round(probs.home / 30)), away: Math.max(0, Math.round(probs.away / 40)) }
      : { home: Math.max(0, Math.round(probs.home / 40)), away: Math.min(3, Math.round(probs.away / 30)) }

  return {
    match: {
      id: match.id,
      date: match.formattedDate,
      stage: match.stageLabel,
      venue: match.venue,
      home: homeName,
      away: awayName,
      status: match.statusLabel,
    },
    form: { home: homeForm, away: awayForm },
    last5: { home: homeLast5, away: awayLast5 },
    goals: { home: homeGoals, away: awayGoals },
    h2h,
    worldCupMatchesPlayed: { home: wcHome, away: wcAway },
    impliedProbabilities: probs,
    suggestedScores: [
      {
        score: `${topScore.home}-${topScore.away}`,
        rationale: 'Escenario más alineado con forma reciente y probabilidades 1X2.',
      },
      { score: '1-1', rationale: 'Opción conservadora si ambas defensas están sólidas.' },
      {
        score: `${topScore.home + 1}-${topScore.away}`,
        rationale: 'Escenario de mayor riesgo si el local domina el mediocampo.',
      },
    ],
    confidence,
    dataGaps,
  }
}
