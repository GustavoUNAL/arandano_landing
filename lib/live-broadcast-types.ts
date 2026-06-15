import type { MatchDetail } from '@/lib/football-data'
import type { KickoffCountdown } from '@/lib/home-broadcast'
import type {
  MatchPrediction,
  MatchPredictionStats,
  PublicMatchPick,
} from '@/lib/sports-polla-shared'
import type { AuthUser } from '@/lib/auth-server'
import type { SportsProfilePayload } from '@/lib/sports-profile'
import type { HomeBroadcastMode } from '@/lib/home-broadcast'

export type LiveStreamChannel = 'home' | 'match' | 'profile'

export interface HomeBroadcastStreamPayload {
  type: 'home'
  featured: {
    mode: HomeBroadcastMode
    countdown: KickoffCountdown | null
    match: MatchDetail
    stats: MatchPredictionStats
    picks: PublicMatchPick[]
    totalPicks: number
  } | null
  refreshedAt: string
}

export interface MatchStreamPayload {
  type: 'match'
  matchId: number
  match: MatchDetail
  stats: MatchPredictionStats
  picks: PublicMatchPick[]
  userPrediction: MatchPrediction | null
  refreshedAt: string
}

export type LiveStreamPayload = HomeBroadcastStreamPayload | MatchStreamPayload | ProfileStreamPayload

export interface ProfileStreamPayload {
  type: 'profile'
  profile: SportsProfilePayload
  refreshedAt: string
}

export interface LiveStreamSubscriber {
  id: string
  channel: LiveStreamChannel
  matchId?: number
  userId?: string
  authUser?: AuthUser
  push: (payload: LiveStreamPayload) => void
  close: () => void
}
