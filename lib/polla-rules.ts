/**
 * Reglamento y constantes oficiales — Polla Mundialista Arándano 2026
 */

export const POLL_NAME = 'Polla Mundialista Arándano 2026'

export const INITIAL_CREDITS = 120
export const PREDICTION_COST = 50
export const POINTS_EXACT_SCORE = 3
export const POINTS_GOAL_DIFFERENCE = 2
export const POINTS_CORRECT_RESULT = 1
export const TOP_WINNERS_COUNT = 5
export const MIN_SETTLED_PICKS_TO_WIN = 5
export const MAX_SCORE_PER_TEAM = 20

export type PointsTier = 'exact' | 'goal_diff' | 'result' | 'miss'

export interface ScoringRules {
  exactScore: number
  goalDifference: number
  correctResult: number
  initialCredits: number
  predictionCost: number
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
      'La polla es un juego de pronósticos del Mundial FIFA 2026 entre amigos y clientes de Arándano Café Bar.',
      'Al final del torneo habrá hasta 5 ganadores según la tabla de puntos.',
    ],
  },
  {
    id: 'inscripcion',
    title: '2. Cómo participar',
    items: [
      'Regístrate en la plataforma.',
      `Recibes ${INITIAL_CREDITS} créditos virtuales de bienvenida.`,
      `Cada pronóstico nuevo cuesta ${PREDICTION_COST} créditos. Editar un pick antes del pitazo no cuesta créditos extra.`,
      'Puedes elegir tu nombre de usuario.',
    ],
  },
  {
    id: 'pronosticos',
    title: '3. Pronósticos',
    items: [
      'Solo puedes pronosticar antes del pitazo inicial de cada partido.',
      'Un pronóstico por partido por persona (marcador local y visitante, 0 a 20 goles).',
      'Cuando el partido termina, el sistema compara tu pick con el resultado oficial y asigna puntos.',
      'No se aceptan pronósticos después de que el partido comience ni en partidos ya calificados.',
    ],
  },
  {
    id: 'puntuacion',
    title: '4. Sistema de puntos (por partido)',
    items: [
      `Marcador exacto: +${POINTS_EXACT_SCORE} puntos (acertaste ambos goles).`,
      `Diferencia de goles correcta: +${POINTS_GOAL_DIFFERENCE} puntos (misma diferencia entre local y visitante; ej. pronosticaste 3-1 y fue 2-0).`,
      `Resultado correcto: +${POINTS_CORRECT_RESULT} punto (acertaste ganador o empate, sin diferencia exacta).`,
      'Fallo: 0 puntos.',
      'En cada partido solo cuenta el mejor nivel alcanzado (no se suman niveles).',
    ],
  },
  {
    id: 'ranking',
    title: '5. Tabla y ganadores',
    items: [
      'La tabla se actualiza en vivo conforme terminan los partidos.',
      `Habrá hasta ${TOP_WINNERS_COUNT} ganadores al cierre del torneo.`,
      `Para figurar como ganador necesitas al menos ${MIN_SETTLED_PICKS_TO_WIN} pronósticos ya calificados (partidos jugados).`,
      'Desempate: 1) más puntos totales, 2) más marcadores exactos, 3) más diferencias acertadas, 4) más resultados acertados, 5) más picks calificados.',
    ],
  },
  {
    id: 'fairplay',
    title: '6. Jugar',
    items: [
      'Una cuenta por persona. Cuentas duplicadas pueden ser descalificadas.',
      'Los resultados se toman de fuentes oficiales del torneo al finalizar cada partido.',
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
      'Los créditos y puntos no tienen valor monetario ni son canjeables por productos o servicios, salvo que Arándano Café Bar comunique por separado un premio simbólico para los ganadores.',
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

export const SCORING_EXAMPLES = [
  {
    prediction: '2 - 1',
    result: '2 - 1',
    points: POINTS_EXACT_SCORE,
    label: 'Marcador exacto',
    color: 'emerald',
  },
  {
    prediction: '3 - 1',
    result: '2 - 0',
    points: POINTS_GOAL_DIFFERENCE,
    label: 'Diferencia correcta (+2)',
    color: 'sky',
  },
  {
    prediction: '1 - 0',
    result: '3 - 2',
    points: POINTS_CORRECT_RESULT,
    label: 'Resultado correcto',
    color: 'amber',
  },
  {
    prediction: '2 - 0',
    result: '1 - 2',
    points: 0,
    label: 'Sin acierto',
    color: 'stone',
  },
] as const

export const REGLAMENTO_SHORT =
  `${INITIAL_CREDITS} créditos al registrarte · ` +
  `${POINTS_EXACT_SCORE}/${POINTS_GOAL_DIFFERENCE}/${POINTS_CORRECT_RESULT} pts por partido · ` +
  `Hasta ${TOP_WINNERS_COUNT} ganadores`
