export type PredictorUnavailableKind = 'gemini' | 'football' | 'rate_limit'

const USER_MESSAGES: Record<PredictorUnavailableKind, string> = {
  gemini:
    'Uy, ahora no puedo responder en el chat — llegamos al límite de consultas de IA. Intenta en un ratito. ⚽',
  football:
    'Ahora no puedo consultar datos de partidos — el servicio de estadísticas está temporalmente agotado. Pregúntame sobre el **reglamento** o **cómo vas en la polla**. ⚽',
  rate_limit:
    'Has hecho muchas preguntas esta hora. Descansa un poco y vuelve pronto. ⚽',
}

export class AriPredictorUnavailableError extends Error {
  readonly kind: PredictorUnavailableKind
  readonly userMessage: string

  constructor(kind: PredictorUnavailableKind, cause?: unknown) {
    const userMessage = USER_MESSAGES[kind]
    super(userMessage)
    this.name = 'AriPredictorUnavailableError'
    this.kind = kind
    this.userMessage = userMessage
    console.error(`[predictor] servicio no disponible (${kind}):`, formatCause(cause))
  }
}

/** @deprecated Usar AriPredictorUnavailableError */
export class AriQuotaError extends AriPredictorUnavailableError {
  constructor(cause?: unknown) {
    super('gemini', cause)
    this.name = 'AriQuotaError'
  }
}

export class FootballApiQuotaError extends Error {
  constructor(status: number, detail?: string) {
    super(`football-data.org quota (${status})`)
    this.name = 'FootballApiQuotaError'
    console.error('[football-data.org] cuota API agotada:', { status, detail })
  }
}

function formatCause(cause: unknown): string {
  if (cause instanceof Error) return cause.message
  if (cause) return String(cause)
  return 'sin detalle'
}

export function isGeminiQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return (
    msg.includes('429') ||
    msg.includes('Too Many Requests') ||
    msg.includes('quota') ||
    msg.includes('Quota exceeded')
  )
}

export function unavailableResponse(error: AriPredictorUnavailableError) {
  return {
    unavailable: true,
    content: error.userMessage,
    error: error.userMessage,
  }
}
