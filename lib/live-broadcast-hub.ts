import { FootballApiQuotaError } from '@/lib/ari/errors'
import { fetchLiveMatchesFromApi } from '@/lib/football-api'
import { getMatchById, getWorldCupFullData } from '@/lib/football-data'
import { getFeaturedMatchForHome, getKickoffCountdown } from '@/lib/home-broadcast'
import { LIVE_HUB } from '@/lib/live-broadcast-config'
import type {
  HomeBroadcastStreamPayload,
  LiveStreamPayload,
  LiveStreamSubscriber,
  MatchStreamPayload,
  ProfileStreamPayload,
} from '@/lib/live-broadcast-types'
import { getMatchPredictionStats, getOrCreateSportsUser, getPrediction } from '@/lib/sports-polla'
import { buildSportsProfilePayload } from '@/lib/sports-profile'
import type { AuthUser } from '@/lib/auth-server'
import { canViewMatchHub } from '@/lib/sports-polla-shared'
import { randomUUID } from 'crypto'

type PicksCacheKey = `${number}:${string | 'anon'}`

interface Timestamps {
  liveList: number
  matchDetail: Map<number, number>
  picks: Map<PicksCacheKey, number>
  home: Map<string, number>
  profile: Map<string, number>
}

class LiveBroadcastHub {
  private subscribers = new Map<string, LiveStreamSubscriber>()
  private tickTimer: ReturnType<typeof setInterval> | null = null
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private ticking = false
  private quotaBackoffUntil = 0
  private ts: Timestamps = {
    liveList: 0,
    matchDetail: new Map(),
    picks: new Map(),
    home: new Map(),
    profile: new Map(),
  }

  subscribe(subscriber: Omit<LiveStreamSubscriber, 'id' | 'close'> & { id?: string }): () => void {
    const id = subscriber.id ?? randomUUID()
    const entry: LiveStreamSubscriber = {
      ...subscriber,
      id,
      close: () => this.unsubscribe(id),
    }
    this.subscribers.set(id, entry)
    this.scheduleTick()
    void this.pushToSubscriber(entry)
    return () => this.unsubscribe(id)
  }

  private unsubscribe(id: string) {
    this.subscribers.delete(id)
    if (this.subscribers.size === 0) {
      this.scheduleIdleShutdown()
    }
  }

  private scheduleIdleShutdown() {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => {
      if (this.subscribers.size === 0) this.stopTick()
    }, LIVE_HUB.IDLE_SHUTDOWN_MS)
  }

  private scheduleTick() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }
    if (this.tickTimer) return
    this.tickTimer = setInterval(() => void this.tick(), LIVE_HUB.TICK_MS)
    void this.tick()
  }

  private stopTick() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer)
      this.tickTimer = null
    }
  }

  private now() {
    return Date.now()
  }

  private quotaBlocked() {
    return this.now() < this.quotaBackoffUntil
  }

  private noteQuotaError(error: unknown) {
    if (error instanceof FootballApiQuotaError) {
      this.quotaBackoffUntil = this.now() + LIVE_HUB.QUOTA_BACKOFF_MS
      console.warn('[live-hub] Cuota football-data.org — pausa', LIVE_HUB.QUOTA_BACKOFF_MS / 1000, 's')
    }
  }

  private shouldRefresh(last: number, interval: number) {
    return this.now() - last >= interval
  }

  private async maybeRefreshLiveList() {
    if (this.quotaBlocked()) return
    if (!this.shouldRefresh(this.ts.liveList, LIVE_HUB.LIVE_LIST_MS)) return
    try {
      await fetchLiveMatchesFromApi()
      this.ts.liveList = this.now()
    } catch (error) {
      this.noteQuotaError(error)
    }
  }

  private async buildMatchPayload(
    matchId: number,
    userId?: string,
    forceDetail = false
  ): Promise<MatchStreamPayload | null> {
    try {
      const detailStale = forceDetail || this.shouldRefresh(this.ts.matchDetail.get(matchId) ?? 0, LIVE_HUB.MATCH_DETAIL_MS)
      const picksKey: PicksCacheKey = `${matchId}:${userId ?? 'anon'}`
      const picksStale = forceDetail || this.shouldRefresh(this.ts.picks.get(picksKey) ?? 0, LIVE_HUB.PICKS_MS)

      let match: Awaited<ReturnType<typeof getMatchById>>
      if (detailStale && !this.quotaBlocked()) {
        match = await getMatchById(matchId, true)
        this.ts.matchDetail.set(matchId, this.now())
      } else {
        match = await getMatchById(matchId, false)
      }

      let stats: Awaited<ReturnType<typeof getMatchPredictionStats>>['stats']
      let picks: Awaited<ReturnType<typeof getMatchPredictionStats>>['picks']
      let userPrediction = null

      if (picksStale) {
        const bundle = await getMatchPredictionStats(matchId, userId)
        stats = bundle.stats
        picks = bundle.picks
        this.ts.picks.set(picksKey, this.now())
        if (userId) {
          userPrediction = await getPrediction(userId, matchId)
        }
      } else {
        const bundle = await getMatchPredictionStats(matchId, userId)
        stats = bundle.stats
        picks = bundle.picks
        if (userId) {
          userPrediction = await getPrediction(userId, matchId)
        }
      }

      return {
        type: 'match',
        matchId,
        match,
        stats,
        picks: [...picks].reverse().slice(0, 12),
        userPrediction,
        refreshedAt: new Date().toISOString(),
      }
    } catch (error) {
      this.noteQuotaError(error)
      return null
    }
  }

  private async buildHomePayload(userId?: string, force = false): Promise<HomeBroadcastStreamPayload> {
    const cacheKey = userId ?? 'anon'
    if (!force && !this.shouldRefresh(this.ts.home.get(cacheKey) ?? 0, LIVE_HUB.LIVE_LIST_MS)) {
      // still rebuild from DB cache (cheap) on tick
    }

    try {
      const worldCup = await getWorldCupFullData()
      const featured = getFeaturedMatchForHome(worldCup.allMatches)

      if (!featured) {
        this.ts.home.set(cacheKey, this.now())
        return { type: 'home', featured: null, refreshedAt: new Date().toISOString() }
      }

      const { match, mode } = featured
      let matchDetail = match

      if (mode === 'live' && canViewMatchHub(match.status, match.utcDate)) {
        const detailStale = force || this.shouldRefresh(this.ts.matchDetail.get(match.id) ?? 0, LIVE_HUB.MATCH_DETAIL_MS)
        if (detailStale && !this.quotaBlocked()) {
          matchDetail = await getMatchById(match.id, true)
          this.ts.matchDetail.set(match.id, this.now())
        } else {
          matchDetail = await getMatchById(match.id, false)
        }
      }

      const picksKey: PicksCacheKey = `${match.id}:${userId ?? 'anon'}`
      const picksStale = force || this.shouldRefresh(this.ts.picks.get(picksKey) ?? 0, LIVE_HUB.PICKS_MS)
      if (picksStale) {
        this.ts.picks.set(picksKey, this.now())
      }

      const { stats, picks } = await getMatchPredictionStats(match.id, userId)
      const countdown = mode === 'upcoming' ? getKickoffCountdown(match.utcDate) : null
      this.ts.home.set(cacheKey, this.now())

      return {
        type: 'home',
        featured: {
          mode,
          countdown,
          match: matchDetail,
          stats,
          picks: [...picks].reverse().slice(0, 12),
          totalPicks: stats.totalPicks,
        },
        refreshedAt: new Date().toISOString(),
      }
    } catch (error) {
      this.noteQuotaError(error)
      return { type: 'home', featured: null, refreshedAt: new Date().toISOString() }
    }
  }

  private async buildProfilePayload(authUser: AuthUser): Promise<ProfileStreamPayload | null> {
    try {
      const profile = await buildSportsProfilePayload(authUser)
      this.ts.profile.set(authUser.id, this.now())
      return {
        type: 'profile',
        profile,
        refreshedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.warn('[live-hub] Error al actualizar perfil', error)
      return null
    }
  }

  private async pushToSubscriber(subscriber: LiveStreamSubscriber, force = false) {
    if (subscriber.channel === 'home') {
      const payload = await this.buildHomePayload(subscriber.userId, force)
      subscriber.push(payload)
      return
    }

    if (subscriber.channel === 'profile' && subscriber.authUser) {
      const cacheKey = subscriber.authUser.id
      const stale = force || this.shouldRefresh(this.ts.profile.get(cacheKey) ?? 0, LIVE_HUB.PROFILE_MS)
      if (!stale) return
      const payload = await this.buildProfilePayload(subscriber.authUser)
      if (payload) subscriber.push(payload)
      return
    }

    if (subscriber.channel === 'match' && subscriber.matchId) {
      const payload = await this.buildMatchPayload(subscriber.matchId, subscriber.userId, force)
      if (payload) subscriber.push(payload)
    }
  }

  private async tick() {
    if (this.ticking || this.subscribers.size === 0) return
    this.ticking = true
    try {
      const needsLiveList = [...this.subscribers.values()].some(
        (s) => s.channel === 'home' || s.channel === 'match'
      )
      if (needsLiveList) {
        await this.maybeRefreshLiveList()
      }

      await Promise.all([...this.subscribers.values()].map((s) => this.pushToSubscriber(s)))
    } finally {
      this.ticking = false
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __liveBroadcastHub: LiveBroadcastHub | undefined
}

export const liveBroadcastHub = globalThis.__liveBroadcastHub ?? new LiveBroadcastHub()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__liveBroadcastHub = liveBroadcastHub
}

export function subscribeLiveStream(input: {
  channel: 'home' | 'match' | 'profile'
  matchId?: number
  userId?: string
  authUser?: AuthUser
  push: (payload: LiveStreamPayload) => void
}): () => void {
  return liveBroadcastHub.subscribe({
    channel: input.channel,
    matchId: input.matchId,
    userId: input.userId,
    authUser: input.authUser,
    push: input.push,
  })
}
