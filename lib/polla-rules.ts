/**
 * Reglamento y constantes oficiales — Polla Mundialista Arándano 2026
 */

export const POLL_NAME = 'Polla Mundialista Arándano 2026'

/** Créditos de bienvenida para pronosticar la fase de grupos (100 por partido). */
export const INITIAL_CREDITS = 7_200
export const GROUP_STAGE_CREDITS = INITIAL_CREDITS
/** Saldo de bienvenida antes del reglamento vigente (migración automática). */
export const LEGACY_INITIAL_CREDITS = 120
export const PREDICTION_COST = 100
/** Pronósticos completos que cubre el saldo inicial de grupos. */
export const GROUP_STAGE_PICKS_INCLUDED = Math.floor(INITIAL_CREDITS / PREDICTION_COST)
export const POINTS_EXACT_SCORE = 3
export const POINTS_GOAL_DIFFERENCE = 2
export const POINTS_CORRECT_RESULT = 1
export const TOP_WINNERS_COUNT = 3
export const GROUP_STAGE_WINNERS_COUNT = 3
export const MIN_SETTLED_PICKS_TO_WIN = 5
export const MAX_SCORE_PER_TEAM = 20

export interface PollaPrize {
  place: string
  prize: string
}

export const GROUP_STAGE_PRIZES: PollaPrize[] = [
  { place: '1er Lugar', prize: '1 Botella de Aguardiente' },
  { place: '2do Lugar', prize: '1 Cubetazo de Cerveza' },
  { place: '3er Lugar', prize: '1 Shot + Cerveza' },
]

/** Dieciseisavos y octavos: práctica — no suman en la polla final. */
export const KNOCKOUT_TRAINING_STAGES = ['LAST_32', 'LAST_16'] as const

/** Desde cuartos cuenta la polla final (con pasaporte). */
export const KNOCKOUT_SCORING_STAGES = [
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE',
  'FINAL',
] as const

export const KNOCKOUT_PHASE_LABEL = 'Polla final (Cuartos, Semis y Final)'

export const CAFE_NAME = 'Arándano Café Bar'
export const CAFE_LOCATION = 'Pasto, Colombia'

export const KNOCKOUT_PASSPORT_PRICE_COP = 20_000

export const KNOCKOUT_PASSPORT_PRICE_LABEL = `$${KNOCKOUT_PASSPORT_PRICE_COP.toLocaleString('es-CO')} COP`

/** @deprecated La fase de grupos ya no exige pasaporte; solo aplica eliminatorias. */
export const GROUP_PASSPORT_LABEL = 'Pasaporte Fase de Grupos'

export const KNOCKOUT_PASSPORT_LABEL = 'Pasaporte Polla Final'

export const GROUP_STAGE_NO_PASSPORT_NOTE = 'No necesitas pasaporte ni compra en el café.'

export const KNOCKOUT_PASSPORT_ACQUIRE_NOTE =
  `Adquiere el Pasaporte Polla Final (${KNOCKOUT_PASSPORT_PRICE_LABEL}) en Arándano Café Bar.`

export const KNOCKOUT_OCTAVOS_START_DATE = '2026-07-04'
export const KNOCKOUT_OCTAVOS_START_LABEL = '4 de julio de 2026'

export const KNOCKOUT_TRAINING_NOTE =
  `Desde el ${KNOCKOUT_OCTAVOS_START_LABEL} arrancan octavos y dieciseisavos como entrenamiento (no suman en la polla final).`

export const KNOCKOUT_PASSPORT_RULES = [
  'La polla final es independiente de la de grupos: ranking nuevo desde cuartos de final.',
  KNOCKOUT_TRAINING_NOTE,
  `Desde cuartos de final arranca la polla final premiada (${KNOCKOUT_PASSPORT_PRICE_LABEL}).`,
  'El pozo de premios crece con cada pasaporte vendido; se reparte entre los 5 ganadores de forma proporcional.',
  'Paga con el QR, adjunta el comprobante en tu solicitud y un administrador activa tu pasaporte.',
  'Sin pasaporte activo puedes seguir pronosticando eliminatorias, pero no compites por premios de la polla final.',
  'Los puntos de grupos no se arrastran: en la polla final solo cuentan cuartos, semis y final.',
] as const

/** Reparto proporcional del pozo entre los 3 ganadores de la polla final. */
export const KNOCKOUT_PRIZE_SPLITS = [
  { place: '1°', percent: 50 },
  { place: '2°', percent: 30 },
  { place: '3°', percent: 20 },
] as const

export function computeKnockoutPrizePoolCOP(passportHolders: number): number {
  return Math.max(0, passportHolders) * KNOCKOUT_PASSPORT_PRICE_COP
}

export interface KnockoutPrizeShare {
  place: string
  percent: number
  amountCop: number
}

export function getKnockoutPrizeBreakdown(passportHolders: number): KnockoutPrizeShare[] {
  const pool = computeKnockoutPrizePoolCOP(passportHolders)
  return KNOCKOUT_PRIZE_SPLITS.map((row) => ({
    place: row.place,
    percent: row.percent,
    amountCop: Math.round((pool * row.percent) / 100),
  }))
}

export function formatCop(amount: number): string {
  return `$${amount.toLocaleString('es-CO')} COP`
}

export const KNOCKOUT_PRIZES_NOTE =
  'Polla final con 3 ganadores. El pozo crece con cada pasaporte vendido; el reparto es proporcional según el lugar.'

/** Correos que ven el modal de ganador en modo prueba (fase de grupos). */
export const POLL_DEMO_GROUP_WINNER_EMAILS = ['gustavoarteaga0508@gmail.com']

/** Fecha límite absoluta para reclamar cualquier premio (fin del Mundial 2026). */
export const PRIZE_CLAIM_DEADLINE = '2026-07-19'

export const PRIZE_CLAIM_DEADLINE_LABEL = '19 de julio de 2026'

/** Días hábiles tras cerrar cada fase para reclamar en el café. */
export const PRIZE_CLAIM_DAYS_AFTER_PHASE = 7

export const PRIZE_CLAIM_RULES = [
  `Todos los premios se reclaman en persona en ${CAFE_NAME} (${CAFE_LOCATION}). No hay envíos ni transferencias.`,
  `Plazo máximo absoluto: antes del fin del Mundial (${PRIZE_CLAIM_DEADLINE_LABEL}). Pasada esa fecha no hay reclamos.`,
  `Fase de grupos: tienes ${PRIZE_CLAIM_DAYS_AFTER_PHASE} días calendario desde que cierra la fase de grupos para reclamar tu premio.`,
  `Polla final: tienes ${PRIZE_CLAIM_DAYS_AFTER_PHASE} días calendario desde la final del torneo para reclamar (siempre antes del ${PRIZE_CLAIM_DEADLINE_LABEL}).`,
  'Debes presentar tu documento de identidad y la misma cuenta de Google con la que jugaste.',
  'Solo puede reclamar el titular de la cuenta ganadora; no se admiten terceros ni cesión del premio.',
  'Premio no reclamado dentro del plazo queda sin efecto — no hay canje por dinero ni créditos.',
  'Arándano se reserva verificar el pago del pasaporte (polla final) y el cumplimiento del reglamento antes de entregar.',
] as const

export const PASSPORT_PURCHASE_STEPS = [
  'Lee el reglamento completo y conoce las reglas de la polla final.',
  `Paga ${KNOCKOUT_PASSPORT_PRICE_LABEL} escaneando el QR de pago (Nequi / transferencia).`,
  'Adjunta el comprobante de pago en la solicitud desde tu perfil.',
  'El equipo revisa tu solicitud y activa el pasaporte para que sumes puntos desde cuartos.',
] as const

export type PassportRequestStatus = 'pending' | 'approved' | 'rejected'

export type PollaPhase = 'group' | 'knockout'

export type PointsTier = 'exact' | 'goal_diff' | 'result' | 'miss'

export interface ScoringRules {
  exactScore: number
  goalDifference: number
  correctResult: number
  initialCredits: number
  groupStageCredits: number
  groupStagePicksIncluded: number
  predictionCost: number
  maxScorePerTeam: number
  topWinners: number
  minSettledPicksToWin: number
}

export function computeCreditsBalance(totalWagered: number): number {
  return Math.max(0, INITIAL_CREDITS - totalWagered)
}

export function getScoringRules(): ScoringRules {
  return {
    exactScore: POINTS_EXACT_SCORE,
    goalDifference: POINTS_GOAL_DIFFERENCE,
    correctResult: POINTS_CORRECT_RESULT,
    initialCredits: INITIAL_CREDITS,
    groupStageCredits: GROUP_STAGE_CREDITS,
    groupStagePicksIncluded: GROUP_STAGE_PICKS_INCLUDED,
    predictionCost: PREDICTION_COST,
    maxScorePerTeam: MAX_SCORE_PER_TEAM,
    topWinners: TOP_WINNERS_COUNT,
    minSettledPicksToWin: MIN_SETTLED_PICKS_TO_WIN,
  }
}

export interface ReglamentoSection {
  id: string
  title: string
  items: string[]
}

export const REGLAMENTO_SECTIONS: ReglamentoSection[] = [
  {
    id: 'objetivo',
    title: '1. Objetivo del juego',
    items: [
      `La polla es un juego de pronósticos del Mundial FIFA 2026 entre amigos y clientes de ${CAFE_NAME}.`,
      'Cualquier persona registrada puede pronosticar partidos y acumular puntos en la plataforma.',
      'Habrá dos premiaciones independientes: fase de grupos (top 4) y polla final desde cuartos.',
      'La primera polla (fase de grupos) es abierta para cualquier jugador registrado.',
      GROUP_STAGE_NO_PASSPORT_NOTE,
      `Polla final: octavos/dieciseisavos solo entrenamiento; desde cuartos con pasaporte (${KNOCKOUT_PASSPORT_PRICE_LABEL}).`,
    ],
  },
  {
    id: 'pasaportes',
    title: '2. Pasaporte Polla Final (desde cuartos)',
    items: [...KNOCKOUT_PASSPORT_RULES],
  },
  {
    id: 'inscripcion',
    title: '3. Cómo participar',
    items: [
      'Regístrate gratis con tu cuenta de Google.',
      `Recibes ${INITIAL_CREDITS.toLocaleString('es-CO')} créditos virtuales para la fase de grupos.`,
      `Cada pronóstico nuevo cuesta ${PREDICTION_COST} créditos (saldo inicial ≈ ${GROUP_STAGE_PICKS_INCLUDED} partidos).`,
      'Editar un pronóstico antes del inicio del partido no consume créditos adicionales.',
      'Los créditos no influyen en la puntuación ni en la posición del ranking.',
      'Elige tu nombre de usuario público para aparecer en las tablas.',
    ],
  },
  {
    id: 'pronosticos',
    title: '4. Pronósticos',
    items: [
      'Solo puedes pronosticar antes del pitazo inicial de cada partido.',
      'Un pronóstico por partido por persona (marcador local y visitante, 0 a 20 goles).',
      'Cuando el partido termina, el sistema compara tu pick con el resultado oficial y asigna puntos.',
      'No se aceptan pronósticos después de que el partido comience ni en partidos ya calificados.',
      'Los puntos de fase de grupos y de eliminatorias se contabilizan por separado según el partido pronosticado.',
    ],
  },
  {
    id: 'puntuacion',
    title: '5. Sistema de puntos (por partido)',
    items: [
      `Marcador exacto: +${POINTS_EXACT_SCORE} puntos (acertaste ambos goles).`,
      `Diferencia de goles correcta: +${POINTS_GOAL_DIFFERENCE} puntos (misma diferencia entre local y visitante; ej. pronosticaste 3-1 y fue 2-0).`,
      `Resultado correcto: +${POINTS_CORRECT_RESULT} punto (acertaste ganador o empate, sin diferencia exacta).`,
      'Fallo: 0 puntos.',
      'En cada partido solo cuenta el mejor nivel alcanzado (no se suman niveles).',
      'El mismo sistema de puntos aplica en grupos y en eliminatorias; lo que cambia es en qué ranking se suman.',
    ],
  },
  {
    id: 'premiaciones',
    title: '6. Premiaciones',
    items: [
      '--- Primera polla · Fase de grupos ---',
      GROUP_STAGE_NO_PASSPORT_NOTE,
      `Al cerrar la fase de grupos se premia al top ${GROUP_STAGE_WINNERS_COUNT} del ranking (mín. ${MIN_SETTLED_PICKS_TO_WIN} picks calificados):`,
      ...GROUP_STAGE_PRIZES.map((p) => `${p.place}: ${p.prize}`),
      '--- Polla final · Desde cuartos ---',
      `${KNOCKOUT_TRAINING_NOTE}`,
      `${KNOCKOUT_PHASE_LABEL}: ${KNOCKOUT_PRIZES_NOTE}`,
      `3 ganadores con reparto proporcional del pozo (50% · 30% · 20%).`,
      `Pozo = pasaportes vendidos × ${KNOCKOUT_PASSPORT_PRICE_LABEL}.`,
      `Requisito: ${KNOCKOUT_PASSPORT_ACQUIRE_NOTE}`,
      'El ranking de la polla final solo cuenta cuartos, semifinales y final.',
      '--- Cobro de premios ---',
      ...PRIZE_CLAIM_RULES,
    ],
  },
  {
    id: 'cobro-premios',
    title: '7. Cobro de premios',
    items: [...PRIZE_CLAIM_RULES],
  },
  {
    id: 'ranking',
    title: '8. Tablas y ganadores',
    items: [
      'Hay dos tablas en vivo: ranking de fase de grupos y ranking de fase eliminatoria.',
      'Ranking de grupos: todos los jugadores registrados con pronósticos en partidos de grupos; no exige pasaporte.',
      `Ranking polla final: solo jugadores con pasaporte activo; suma cuartos, semis y final (no octavos).`,
      `Para figurar como ganador necesitas al menos ${MIN_SETTLED_PICKS_TO_WIN} pronósticos calificados en esa fase. En eliminatorias, además, el pasaporte activo.`,
      'Desempate: 1) más puntos totales en la fase, 2) más marcadores exactos, 3) más diferencias acertadas, 4) más resultados acertados, 5) más picks calificados en la fase.',
    ],
  },
  {
    id: 'fairplay',
    title: '9. Juego limpio y condiciones',
    items: [
      'Una cuenta por persona. Cuentas duplicadas pueden ser descalificadas.',
      'Los resultados se toman de fuentes oficiales del torneo al finalizar cada partido.',
      'La activación del pasaporte en la plataforma se hace tras verificar la compra en el café.',
      'Arándano Café Bar puede ajustar el reglamento ante casos excepcionales (partidos suspendidos, etc.).',
      'La participación implica aceptar este reglamento y las condiciones publicadas aquí.',
    ],
  },
]

export const CONDICIONES_LEGALES: ReglamentoSection[] = [
  {
    id: 'naturaleza',
    title: 'Naturaleza del juego',
    items: [
      'Los créditos y puntos son elementos virtuales utilizados exclusivamente dentro de la plataforma para participar y clasificar en el ranking de la Polla Mundialista Arándano 2026.',
      'La participación es gratuita: solo requiere una cuenta de Google.',
    ],
  },
  {
    id: 'privacidad',
    title: 'Privacidad',
    items: [
      'En la tabla pública se muestra el nombre de usuario que elijas, no tu correo.',
      'Arándano Café Bar usa tu correo de Google únicamente para identificar tu cuenta y evitar duplicados.',
      'No vendemos ni compartimos tus datos con terceros con fines comerciales.',
    ],
  },
  {
    id: 'responsabilidad',
    title: 'Responsabilidad',
    items: [
      'El juego se ofrece “tal cual”. Haremos lo posible por mantener la plataforma disponible durante el Mundial.',
      'Ante errores técnicos en resultados, nos reservamos el derecho de recalificar pronósticos con la información oficial corregida.',
      'Arándano Café Bar puede suspender cuentas que intenten hacer trampa o alterar el juego.',
    ],
  },
]

export interface ScoringExample {
  match: string
  home: string
  away: string
  homeFlag: string
  awayFlag: string
  predictionHome: number
  predictionAway: number
  resultHome: number
  resultAway: number
  points: number
  label: string
  color: 'emerald' | 'sky' | 'amber' | 'stone'
}

export const SCORING_EXAMPLES: ScoringExample[] = [
  {
    match: 'Final · Mundial 2018',
    home: 'Francia',
    away: 'Croacia',
    homeFlag: 'fr',
    awayFlag: 'hr',
    predictionHome: 4,
    predictionAway: 2,
    resultHome: 4,
    resultAway: 2,
    points: POINTS_EXACT_SCORE,
    label: 'Marcador exacto',
    color: 'emerald',
  },
  {
    match: 'Grupos · Mundial 2014',
    home: 'Colombia',
    away: 'Grecia',
    homeFlag: 'co',
    awayFlag: 'gr',
    predictionHome: 4,
    predictionAway: 1,
    resultHome: 3,
    resultAway: 0,
    points: POINTS_GOAL_DIFFERENCE,
    label: 'Diferencia correcta',
    color: 'sky',
  },
  {
    match: 'Grupos · Mundial 2014',
    home: 'Alemania',
    away: 'Portugal',
    homeFlag: 'de',
    awayFlag: 'pt',
    predictionHome: 2,
    predictionAway: 1,
    resultHome: 4,
    resultAway: 0,
    points: POINTS_CORRECT_RESULT,
    label: 'Resultado correcto',
    color: 'amber',
  },
  {
    match: 'Semifinal · Mundial 2014',
    home: 'Brasil',
    away: 'Alemania',
    homeFlag: 'br',
    awayFlag: 'de',
    predictionHome: 2,
    predictionAway: 0,
    resultHome: 1,
    resultAway: 7,
    points: 0,
    label: 'Sin acierto',
    color: 'stone',
  },
]

export const REGLAMENTO_SHORT =
  `${INITIAL_CREDITS.toLocaleString('es-CO')} créditos fase de grupos · ` +
  `${PREDICTION_COST} por partido · ` +
  `Grupos: top ${GROUP_STAGE_WINNERS_COUNT} ganadores · ${GROUP_STAGE_NO_PASSPORT_NOTE} · ` +
  `Polla final desde cuartos: ${KNOCKOUT_PASSPORT_PRICE_LABEL} · ` +
  `Premios en el café antes del ${PRIZE_CLAIM_DEADLINE_LABEL}`
