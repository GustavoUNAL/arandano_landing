import { getAuthUser } from '@/lib/auth-server'
import { subscribeLiveStream } from '@/lib/live-broadcast-hub'
import type { LiveStreamPayload } from '@/lib/live-broadcast-types'
import { getOrCreateSportsUser } from '@/lib/sports-polla'
import { canViewMatchHub, isMatchHappeningNow } from '@/lib/sports-polla-shared'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function parseChannel(raw: string | null): 'home' | 'match' | 'profile' | null {
  if (raw === 'home' || raw === 'match' || raw === 'profile') return raw
  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const channel = parseChannel(searchParams.get('channel'))
  if (!channel) {
    return new Response('Canal inválido', { status: 400 })
  }

  const matchIdRaw = searchParams.get('matchId')
  const matchId = matchIdRaw ? Number(matchIdRaw) : NaN

  const authUser = await getAuthUser()
  if (channel === 'match' || channel === 'profile') {
    if (!authUser) {
      return new Response('No autorizado', { status: 401 })
    }
  }
  if (channel === 'match' && !Number.isFinite(matchId)) {
    return new Response('Partido inválido', { status: 400 })
  }

  let sportsUserId: string | undefined
  if (authUser) {
    const user = await getOrCreateSportsUser(authUser)
    sportsUserId = user.id
  }

  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const push = (payload: LiveStreamPayload) => {
        if (channel === 'match' && payload.type === 'match') {
          const m = payload.match
          if (
            !canViewMatchHub(m.status, m.utcDate) &&
            !isMatchHappeningNow(m.status, m.utcDate)
          ) {
            return
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }

      unsubscribe = subscribeLiveStream({
        channel,
        matchId: channel === 'match' ? matchId : undefined,
        userId: sportsUserId,
        authUser: channel === 'profile' ? authUser ?? undefined : undefined,
        push,
      })

      const onAbort = () => {
        unsubscribe?.()
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
      request.signal.addEventListener('abort', onAbort)
    },
    cancel() {
      unsubscribe?.()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
