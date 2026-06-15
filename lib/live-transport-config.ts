/** WebSocket solo con `npm run dev` (server-live.ts). Producción usa SSE. */
export function isLiveWebSocketEnabled(): boolean {
  return process.env.NEXT_PUBLIC_LIVE_WS === 'true'
}
