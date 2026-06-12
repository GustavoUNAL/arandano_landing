const FIFA_FACTS: { keywords: string[]; title: string; content: string }[] = [
  {
    keywords: ['brasil', 'mundiales', 'ganado', 'campeon'],
    title: 'Brasil en Mundiales',
    content:
      'Brasil es la selección con más títulos mundiales: 5 copas (1958, 1962, 1970, 1994, 2002). Es el único país presente en todas las ediciones.',
  },
  {
    keywords: ['alemania', 'francia', 'historial'],
    title: 'Alemania vs Francia',
    content:
      'Alemania y Francia son rivales históricos en Mundiales y Eurocopas. Entre ambos suman múltiples títulos mundiales (Alemania 4, Francia 2). Los cruces suelen ser tácticos y cerrados.',
  },
  {
    keywords: ['goleador', 'goles', 'historico', 'máximo', 'maximo'],
    title: 'Máximos goleadores en Mundiales',
    content:
      'Miroslav Klose (Alemania) es el máximo goleador histórico de Copas del Mundo con 16 goles. Ronaldo Nazário (Brasil) suma 15; Lionel Messi y otros activos siguen escalando el ranking.',
  },
  {
    keywords: ['victorias', 'mundialistas', 'mas victorias'],
    title: 'Selecciones con más victorias en Mundiales',
    content:
      'Alemania y Brasil lideran tradicionalmente en victorias acumuladas en fase final de Copas del Mundo, seguidas por Italia y Argentina.',
  },
  {
    keywords: ['argentina', 'mundiales', 'campeon'],
    title: 'Argentina en Mundiales',
    content: 'Argentina ha ganado 3 Mundiales (1978, 1986, 2022) y múltiples finales adicionales.',
  },
]

export function searchFifaHistory(query: string) {
  const q = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const matches = FIFA_FACTS.filter((fact) =>
    fact.keywords.some((kw) => q.includes(kw) || kw.split(' ').every((w) => q.includes(w)))
  )

  if (matches.length === 0) {
    return {
      chunks: [],
      note: 'No encontré un dato histórico preciso en la base local. Responde con cautela o sugiere reformular la pregunta.',
    }
  }

  return {
    chunks: matches.map((m) => ({ title: m.title, content: m.content })),
    confidence: matches.length >= 2 ? 'media' : 'baja',
  }
}
