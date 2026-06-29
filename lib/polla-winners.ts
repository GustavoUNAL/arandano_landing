import {
  GROUP_STAGE_PRIZES,
  POLL_DEMO_GROUP_WINNER_EMAILS,
  type PollaPrize,
} from '@/lib/polla-rules'
import type { LeaderboardEntry } from '@/lib/sports-polla-shared'

export function isDemoGroupWinner(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return POLL_DEMO_GROUP_WINNER_EMAILS.map((e) => e.toLowerCase()).includes(normalized)
}

export function findUserGroupWinnerEntry(
  email: string | null | undefined,
  winners: LeaderboardEntry[],
  leaderboard: LeaderboardEntry[],
  isCurrentUser: boolean
): LeaderboardEntry | null {
  const fromWinners = winners.find((w) => w.isCurrentUser)
  if (fromWinners) return fromWinners

  if (!isCurrentUser || !isDemoGroupWinner(email)) return null

  const top = leaderboard.find((e) => e.rank === 1) ?? leaderboard[0]
  return {
    ...(top ?? {
      rank: 1,
      name: null,
      displayAlias: 'Jugador demo',
      totalPoints: 0,
      picksCount: 0,
      settledCount: 0,
      exactHits: 0,
      goalDiffHits: 0,
      resultHits: 0,
      hasPassport: false,
      hasKnockoutPassport: false,
      phase: 'group' as const,
      qualifiesForPodium: true,
      isWinner: true,
      winnerRank: 1,
      isCurrentUser: true,
    }),
    isWinner: true,
    winnerRank: 1,
    isCurrentUser: true,
  }
}

export function groupPrizeForRank(rank: number | null | undefined): PollaPrize | null {
  if (!rank || rank < 1 || rank > GROUP_STAGE_PRIZES.length) return null
  return GROUP_STAGE_PRIZES[rank - 1] ?? null
}

export function firstNameOnly(name: string | null | undefined): string | null {
  const trimmed = name?.trim()
  if (!trimmed) return null
  return trimmed.split(/\s+/)[0] ?? trimmed
}
