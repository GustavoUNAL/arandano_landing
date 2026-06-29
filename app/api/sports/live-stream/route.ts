import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Pulso SSE para refrescar cliente sin WebSocket (cada ~25s). */
export async function GET(request: Request) {
  const encoder = new TextEncoder()
  let interval: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const push = () => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`)
          )
        } catch {
          if (interval) clearInterval(interval)
        }
      }
      push()
      interval = setInterval(push, 25_000)
    },
    cancel() {
      if (interval) clearInterval(interval)
    },
  })

  request.signal.addEventListener('abort', () => {
    if (interval) clearInterval(interval)
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
