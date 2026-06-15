import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { setupLiveWebSocket } from './lib/live-broadcast-ws'
import { startPollaPushScheduler } from './lib/polla-push-scheduler'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME ?? '0.0.0.0'
const port = parseInt(process.env.PORT ?? '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  startPollaPushScheduler()

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? '', true)
    handle(req, res, parsedUrl)
  })

  setupLiveWebSocket(server)

  server.listen(port, () => {
    console.log(`> Arándano listo en http://${hostname}:${port}`)
    console.log('> Transmisión en vivo: WebSocket /ws/sports/live + SSE /api/sports/live/stream')
    console.log('> Push polla: /sw.js + /api/sports/push/* (scheduler independiente del WS)')
  })
})
