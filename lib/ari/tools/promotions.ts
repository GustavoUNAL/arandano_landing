import { getActivePromotions } from '@/lib/ari/repository'

export async function getArandanoPromotions(tags?: string[]) {
  try {
    const rows = await getActivePromotions()
    let filtered = rows
    if (tags?.length) {
      filtered = rows.filter((p) => {
        try {
          const t: string[] = JSON.parse(p.tags || '[]')
          return t.some((tag) => tags.includes(tag))
        } catch {
          return false
        }
      })
    }
    const pick = (filtered.length ? filtered : rows).slice(0, 1)
    return {
      promotions: pick.map((p) => ({
        title: p.title,
        body: p.body,
        ctaLabel: p.ctaLabel,
        ctaUrl: p.ctaUrl,
      })),
    }
  } catch {
    return {
      promotions: [
        {
          title: 'Transmisiones en Arándano Café Bar',
          body: 'Vive los partidos del Mundial con nosotros en Pasto. Consulta horarios en tu perfil.',
          ctaLabel: 'Ver perfil',
          ctaUrl: '/perfil',
        },
      ],
    }
  }
}
