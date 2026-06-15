import type { IncomingMessage } from 'http'
import type { Server } from 'http'
import { parse } from 'url'
import { WebSocketServer } from 'ws'
import type { AuthUser } from '@/lib/auth-server'
import { subscribeLiveStream } from '@/lib/live-broadcast-hub'
import { getOrCreateSportsUser } from '@/lib/sports-polla'

async function authFromUpgrade(
  req: IncomingMessage
): Promise<{ userId: string; authUser: AuthUser } | null> {
  try {
    const { getToken } = await import('next-auth/jwt')
    const token = await getToken({
      req: req as Parameters<typeof getToken>[0]['req'],
      secret: process.env.NEXTAUTH_SECRET,
    })
    if (!token?.sub || !token.email) return null

    const authUser: AuthUser = {
      id: String(token.sub),
      email: String(token.email),
      name: typeof token.name === 'string' ? token.name : null,
      image: typeof token.picture === 'string' ? token.picture : null,
    }

    const user = await getOrCreateSportsUser(authUser)
    return { userId: user.id, authUser }
  } catch {
    return null
  }
}

function parseChannel(raw: unknown): 'home' | 'match' | 'profile' | null {
  if (raw === 'home' || raw === 'match' || raw === 'profile') return raw
  return null
}

/** WebSocket en `/ws/sports/live` — mismo hub que SSE, 1 poller para todos los clientes */
export function setupLiveWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url ?? '', true)
    if (pathname !== '/ws/sports/live') {
      return
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  })

  wss.on('connection', (ws, req) => {
    const { query } = parse(req.url ?? '', true)
    const channel = parseChannel(query.channel)
    const matchId = query.matchId ? Number(query.matchId) : undefined

    if (!channel) {
      ws.close(1008, 'Canal inválido')
      return
    }

    if (channel === 'match' && !Number.isFinite(matchId)) {
      ws.close(1008, 'matchId requerido')
      return
    }

    let unsub: (() => void) | null = null

    void authFromUpgrade(req).then((auth) => {
      if ((channel === 'match' || channel === 'profile') && !auth) {
        ws.close(1008, 'No autorizado')
        return
      }

      unsub = subscribeLiveStream({
        channel,
        matchId: channel === 'match' ? matchId : undefined,
        userId: auth?.userId,
        authUser: channel === 'profile' ? auth?.authUser : undefined,
        push: (payload) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(payload))
          }
        },
      })
    })

    ws.on('close', () => unsub?.())
    ws.on('error', () => unsub?.())
  })
}
