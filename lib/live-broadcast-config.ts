/** Intervalos del hub — una sola fuente de verdad para no quemar créditos de football-data.org */
export const LIVE_HUB = {
  /** Revisa suscriptores y caches */
  TICK_MS: 5_000,
  /** Lista global IN_PLAY — 1 llamada API compartida */
  LIVE_LIST_MS: 60_000,
  /** Detalle por partido en vivo — 1 llamada API por partido */
  MATCH_DETAIL_MS: 45_000,
  /** Pronósticos de la polla — solo BD */
  PICKS_MS: 90_000,
  /** Perfil completo — solo BD + caché mundial (sin API extra por cliente) */
  PROFILE_MS: 90_000,
  /** Tras error 429, pausa llamadas externas */
  QUOTA_BACKOFF_MS: 5 * 60_000,
  /** Apaga el tick cuando no hay clientes */
  IDLE_SHUTDOWN_MS: 20_000,
} as const
