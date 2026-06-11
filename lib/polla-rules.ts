/**
 * Reglamento y constantes oficiales — Polla Mundialista Arándano 2026
 */

export const POLL_NAME = 'Polla Mundialista Arándano 2026'

export const INITIAL_CREDITS = 20_000
/** Saldo de bienvenida antes del reglamento vigente (migración automática). */
export const LEGACY_INITIAL_CREDITS = 120
export const PREDICTION_COST = 100
export const POINTS_EXACT_SCORE = 3
export const POINTS_GOAL_DIFFERENCE = 2
export const POINTS_CORRECT_RESULT = 1
export const TOP_WINNERS_COUNT = 5
export const GROUP_STAGE_WINNERS_COUNT = 2
export const MIN_SETTLED_PICKS_TO_WIN = 5
export const MAX_SCORE_PER_TEAM = 20

export interface PollaPrize {
  place: string
  prize: string
}

export const GROUP_STAGE_PRIZES: PollaPrize[] = [
  { place: '1er Lugar', prize: '1 Botella de Aguardiente' },
  { place: '2do Lugar', prize: '1 Cubetazo de Cerveza' },
]

export const KNOCKOUT_PHASE_LABEL =
  'Fase Eliminatoria (Octavos, Cuartos, Semis, Final)'

export const CAFE_NAME = 'Arándano Café Bar'
export const CAFE_LOCATION = 'Pasto, Colombia'

/** Uso interno / admin — no mostrar en la UI pública por ahora. */
export const KNOCKOUT_PASSPORT_PRICE_COP = 30_000

/** @deprecated La fase de grupos ya no exige pasaporte; solo aplica eliminatorias. */
export const GROUP_PASSPORT_LABEL = 'Pasaporte Fase de Grupos'

export const KNOCKOUT_PASSPORT_LABEL = 'Pasaporte Eliminatorias'

export const GROUP_STAGE_NO_PASSPORT_NOTE = 'No necesitas pasaporte ni compra en el café.'

export const KNOCKOUT_PASSPORT_ACQUIRE_NOTE =
  'Adquiere el Pasaporte de Eliminatorias en Arándano Café Bar.'

export const KNOCKOUT_PASSPORT_RULES = [
  'La segunda polla (eliminatorias y final) es independiente de la de grupos: ranking nuevo desde octavos de final.',
  KNOCKOUT_PASSPORT_ACQUIRE_NOTE,
  'Tras adquirirlo en el café, el equipo activa tu pasaporte en la plataforma con la misma cuenta de Google con la que juegas.',
  'Sin pasaporte activo puedes seguir pronosticando partidos de eliminatorias, pero no aparecerás en el ranking premiado ni podrás ganar esos premios.',
  'Los puntos de la fase de grupos no se arrastran: en eliminatorias solo cuentan los pronósticos de octavos, cuartos, semifinales y final.',
] as const

export const KNOCKOUT_PRIZES_NOTE =
  'Los premios de la fase eliminatoria se anunciarán próximamente. Solo compiten quienes tengan el Pasaporte Eliminatorias activo.'

export type PollaPhase = 'group' | 'knockout'

export type PointsTier = 'exact' | 'goal_diff' | 'result' | 'miss'

export interface ScoringRules {
  exactScore: number
  goalDifference: number
  correctResult: number
  initialCredits: number
  predictionCost: number
  maxScorePerTeam: number
  topWinners: number
  minSettledPicksToWin: number
}

export function getScoringRules(): ScoringRules {
  return {
    exactScore: POINTS_EXACT_SCORE,
    goalDifference: POINTS_GOAL_DIFFERENCE,
    correctResult: POINTS_CORRECT_RESULT,
    initialCredits: INITIAL_CREDITS,
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
      'Habrá dos premiaciones independientes: una al cerrar la fase de grupos y otra al finalizar la fase eliminatoria (octavos, cuartos, semifinales y final).',
      'La primera polla (fase de grupos) es abierta para cualquier jugador registrado.',
      GROUP_STAGE_NO_PASSPORT_NOTE,
      `Segunda polla (eliminatorias): ${KNOCKOUT_PASSPORT_ACQUIRE_NOTE} (ver sección 2).`,
    ],
  },
  {
    id: 'pasaportes',
    title: '2. Pasaporte Eliminatorias (segunda polla)',
    items: [...KNOCKOUT_PASSPORT_RULES],
  },
  {
    id: 'inscripcion',
    title: '3. Cómo participar',
    items: [
      'Regístrate gratis con tu cuenta de Google.',
      `Recibes ${INITIAL_CREDITS.toLocaleString('es-CO')} créditos virtuales de bienvenida.`,
      `Cada pronóstico nuevo cuesta ${PREDICTION_COST} créditos.`,
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
      `Al cerrar la fase de grupos se premia a los ${GROUP_STAGE_WINNERS_COUNT} primeros del ranking de grupos (mínimo de picks calificados en esa fase):`,
      `${GROUP_STAGE_PRIZES[0].place}: ${GROUP_STAGE_PRIZES[0].prize}`,
      `${GROUP_STAGE_PRIZES[1].place}: ${GROUP_STAGE_PRIZES[1].prize}`,
      '--- Segunda polla · Fase eliminatoria ---',
      `${KNOCKOUT_PHASE_LABEL}: ${KNOCKOUT_PRIZES_NOTE}`,
      `Requisito obligatorio: ${KNOCKOUT_PASSPORT_ACQUIRE_NOTE}`,
      'El ranking eliminatorio es independiente: empieza en cero al comenzar octavos y solo cuenta partidos de eliminatorias.',
    ],
  },
  {
    id: 'ranking',
    title: '7. Tablas y ganadores',
    items: [
      'Hay dos tablas en vivo: ranking de fase de grupos y ranking de fase eliminatoria.',
      'Ranking de grupos: todos los jugadores registrados con pronósticos en partidos de grupos; no exige pasaporte.',
      `Ranking eliminatorio: solo jugadores con ${KNOCKOUT_PASSPORT_LABEL} activo; suma puntos de octavos, cuartos, semifinales y final.`,
      `Para figurar como ganador necesitas al menos ${MIN_SETTLED_PICKS_TO_WIN} pronósticos calificados en esa fase. En eliminatorias, además, el pasaporte activo.`,
      'Desempate: 1) más puntos totales en la fase, 2) más marcadores exactos, 3) más diferencias acertadas, 4) más resultados acertados, 5) más picks calificados en la fase.',
    ],
  },
  {
    id: 'fairplay',
    title: '8. Juego limpio y condiciones',
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
  `${INITIAL_CREDITS.toLocaleString('es-CO')} créditos al registrarte · ` +
  `Grupos: ${GROUP_STAGE_WINNERS_COUNT} ganadores · ${GROUP_STAGE_NO_PASSPORT_NOTE} · ` +
  `Eliminatorias: ${KNOCKOUT_PASSPORT_ACQUIRE_NOTE}`
