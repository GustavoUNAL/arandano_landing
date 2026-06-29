import type { EnrichedMatch } from '@/lib/football-data'
import { firstNameOnly } from '@/lib/polla-winners'
import type { LeaderboardEntry } from '@/lib/sports-polla-shared'

export interface MundialHighlight {
  id: string
  emoji: string
  title: string
  value: string
  subtitle?: string
  crest?: string | null
  accent?: 'gold' | 'green' | 'berry' | 'sky' | 'amber'
}

interface TeamAgg {
  id: number
  name: string
  crest: string
  goalsFor: number
  goalsAgainst: number
  wins: number
  played: number
}

function finishedMatches(matches: EnrichedMatch[]) {
  return matches.filter((m) => m.isFinished && m.displayScore.home != null && m.displayScore.away != null)
}

function updateTeamAgg(map: Map<number, TeamAgg>, team: EnrichedMatch['homeTeam'], gf: number, ga: number, win: boolean) {
  const existing = map.get(team.id) ?? {
    id: team.id,
    name: team.shortName || team.name,
    crest: team.crest,
    goalsFor: 0,
    goalsAgainst: 0,
    wins: 0,
    played: 0,
  }
  existing.goalsFor += gf
  existing.goalsAgainst += ga
  existing.wins += win ? 1 : 0
  existing.played += 1
  map.set(team.id, existing)
}

function pollaLeader(
  entries: LeaderboardEntry[],
  pick: (e: LeaderboardEntry) => number,
  label: string,
  emoji: string
): MundialHighlight | null {
  if (entries.length === 0) return null
  const sorted = [...entries].sort((a, b) => pick(b) - pick(a))
  const top = sorted.find((e) => pick(e) > 0) ?? sorted[0]
  if (!top) return null
  const stat = pick(top)
  return {
    id: label,
    emoji,
    title: label,
    value: top.displayAlias,
    subtitle:
      stat > 0
        ? `${stat.toLocaleString('es-CO')} ${label === 'Líder polla' ? 'pts' : label === 'Mejor atinador' ? 'exactos' : label === 'Más picks' ? 'pronósticos' : 'aciertos'}`
        : firstNameOnly(top.name) ?? undefined,
    accent: 'berry',
  }
}

export function buildMundialHighlights(
  matches: EnrichedMatch[],
  leaderboard: LeaderboardEntry[]
): MundialHighlight[] {
  const highlights: MundialHighlight[] = []
  const played = finishedMatches(matches)

  const scorerMap = new Map<string, { name: string; goals: number; team?: string }>()
  const assistMap = new Map<string, { name: string; assists: number }>()

  for (const m of played) {
    for (const g of m.goals ?? []) {
      if (g.scorer?.name) {
        const key = String(g.scorer.id || g.scorer.name)
        const row = scorerMap.get(key) ?? { name: g.scorer.name, goals: 0, team: g.team?.name }
        row.goals += 1
        scorerMap.set(key, row)
      }
      if (g.assist?.name) {
        const key = String(g.assist.id || g.assist.name)
        const row = assistMap.get(key) ?? { name: g.assist.name, assists: 0 }
        row.assists += 1
        assistMap.set(key, row)
      }
    }
  }

  const topScorer = [...scorerMap.values()].sort((a, b) => b.goals - a.goals)[0]
  if (topScorer) {
    highlights.push({
      id: 'goleador',
      emoji: '⚽',
      title: 'Goleador del torneo',
      value: firstNameOnly(topScorer.name) ?? topScorer.name,
      subtitle: `${topScorer.goals} gol${topScorer.goals === 1 ? '' : 'es'}${topScorer.team ? ` · ${topScorer.team}` : ''}`,
      accent: 'gold',
    })
  }

  const topAssist = [...assistMap.values()].sort((a, b) => b.assists - a.assists)[0]
  if (topAssist) {
    highlights.push({
      id: 'asistidor',
      emoji: '🎯',
      title: 'Rey de asistencias',
      value: firstNameOnly(topAssist.name) ?? topAssist.name,
      subtitle: `${topAssist.assists} asistencia${topAssist.assists === 1 ? '' : 's'}`,
      accent: 'sky',
    })
  }

  const teamMap = new Map<number, TeamAgg>()
  let totalGoals = 0
  let highestMatch: { match: EnrichedMatch; total: number } | null = null

  for (const m of played) {
    const h = m.displayScore.home!
    const a = m.displayScore.away!
    const total = h + a
    totalGoals += total
    updateTeamAgg(teamMap, m.homeTeam, h, a, h > a)
    updateTeamAgg(teamMap, m.awayTeam, a, h, a > h)
    if (!highestMatch || total > highestMatch.total) {
      highestMatch = { match: m, total }
    }
  }

  const topAttack = [...teamMap.values()].sort((a, b) => b.goalsFor - a.goalsFor)[0]
  if (topAttack && topAttack.goalsFor > 0) {
    highlights.push({
      id: 'ataque',
      emoji: '🔥',
      title: 'Mejor ataque',
      value: topAttack.name,
      subtitle: `${topAttack.goalsFor} goles a favor`,
      crest: topAttack.crest,
      accent: 'amber',
    })
  }

  const topDefense = [...teamMap.values()]
    .filter((t) => t.played >= 1)
    .sort((a, b) => a.goalsAgainst - b.goalsAgainst || b.wins - a.wins)[0]
  if (topDefense) {
    highlights.push({
      id: 'defensa',
      emoji: '🛡️',
      title: 'Mejor defensa',
      value: topDefense.name,
      subtitle: `${topDefense.goalsAgainst} goles en contra`,
      crest: topDefense.crest,
      accent: 'green',
    })
  }

  const topWins = [...teamMap.values()].sort((a, b) => b.wins - a.wins || b.goalsFor - a.goalsFor)[0]
  if (topWins && topWins.wins > 0) {
    highlights.push({
      id: 'invicto',
      emoji: '🏆',
      title: 'Más victorias',
      value: topWins.name,
      subtitle: `${topWins.wins} triunfo${topWins.wins === 1 ? '' : 's'}`,
      crest: topWins.crest,
      accent: 'gold',
    })
  }

  if (highestMatch && highestMatch.total > 0) {
    const hm = highestMatch.match
    highlights.push({
      id: 'partidon',
      emoji: '💥',
      title: 'Partidazo',
      value: `${hm.displayScore.home}-${hm.displayScore.away}`,
      subtitle: `${hm.homeTeam.shortName} vs ${hm.awayTeam.shortName}`,
      accent: 'amber',
    })
  }

  if (played.length > 0) {
    const avg = (totalGoals / played.length).toFixed(1)
    highlights.push({
      id: 'promedio',
      emoji: '📊',
      title: 'Promedio de goles',
      value: avg,
      subtitle: `${totalGoals} goles en ${played.length} partidos`,
      accent: 'sky',
    })
  }

  const pollaStats = [
    pollaLeader(leaderboard, (e) => e.totalPoints, 'Líder polla', '👑'),
    pollaLeader(leaderboard, (e) => e.exactHits, 'Mejor atinador', '🎯'),
    pollaLeader(leaderboard, (e) => e.picksCount, 'Más picks', '📋'),
    pollaLeader(leaderboard, (e) => e.goalDiffHits, 'Mejor diferencia', '📐'),
  ].filter((h): h is MundialHighlight => h != null)

  return [...pollaStats, ...highlights]
}
