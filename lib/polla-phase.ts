import {
  GROUP_STAGE_WINNERS_COUNT,
  KNOCKOUT_SCORING_STAGES,
  KNOCKOUT_TRAINING_STAGES,
} from '@/lib/polla-rules'
import type { EnrichedMatch } from '@/lib/football-data'
import type { LeaderboardEntry } from '@/lib/sports-polla-shared'
import { isMatchFinished, isMatchLive } from '@/lib/sports-polla-shared'

export function isGroupStageComplete(matches: EnrichedMatch[]): boolean {
  const group = matches.filter((m) => m.stage === 'GROUP_STAGE')
  return group.length > 0 && group.every((m) => m.isFinished)
}

export function isKnockoutTrainingStage(stage: string): boolean {
  return (KNOCKOUT_TRAINING_STAGES as readonly string[]).includes(stage)
}

export function isKnockoutScoringStage(stage: string): boolean {
  return (KNOCKOUT_SCORING_STAGES as readonly string[]).includes(stage)
}

/** Top 4 ganadores de grupos (o líderes provisionales si aún no cierra la fase). */
export function getGroupStagePodiumEntries(
  leaderboard: LeaderboardEntry[],
  groupComplete: boolean
): LeaderboardEntry[] {
  const qualified = leaderboard.filter((e) => e.qualifiesForPodium)
  const pool = groupComplete && qualified.length > 0 ? qualified : leaderboard
  return pool.slice(0, GROUP_STAGE_WINNERS_COUNT)
}

export function sortUpcomingMatches<T extends { status: string; utcDate: string }>(
  matches: T[]
): T[] {
  return matches
    .filter((m) => !isMatchFinished(m.status) && !isMatchLive(m.status))
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
}
