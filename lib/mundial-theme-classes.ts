/** Clases reutilizables para páginas /mundial (modo claro / oscuro). */
export function mundialTheme(isDark: boolean) {
  return {
    page: isDark ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-900',
    header: isDark
      ? 'border-white/10 bg-stone-950/80'
      : 'border-stone-200 bg-white/90',
    border: isDark ? 'border-white/10' : 'border-stone-200',
    borderSubtle: isDark ? 'border-white/5' : 'border-stone-200',
    card: isDark
      ? 'border-white/10 bg-stone-900/90'
      : 'border-stone-200 bg-white shadow-sm',
    cardSoft: isDark
      ? 'border-white/10 bg-white/[0.03]'
      : 'border-stone-200 bg-white',
    cardLegal: isDark
      ? 'border-white/5 bg-stone-900/50'
      : 'border-stone-200 bg-stone-50',
    muted: isDark ? 'text-stone-400' : 'text-stone-600',
    mutedSm: isDark ? 'text-stone-500' : 'text-stone-500',
    body: isDark ? 'text-stone-300' : 'text-stone-700',
    footer: isDark
      ? 'border-white/10 bg-stone-950'
      : 'border-stone-200 bg-stone-100',
    ctaSection: isDark
      ? 'border-white/10 bg-berry-950/30'
      : 'border-stone-200 bg-berry-50',
    creditsBox: isDark
      ? 'border-berry-500/20 bg-gradient-to-br from-berry-950/50 to-stone-950'
      : 'border-berry-300/40 bg-gradient-to-br from-berry-50 to-white',
    galleryOverlay: isDark ? 'from-stone-950/80' : 'from-stone-100/90',
    galleryBg: isDark ? 'bg-stone-900' : 'bg-stone-200',
    resultText: isDark ? 'text-white' : 'text-stone-900',
    arrow: isDark ? 'text-stone-600' : 'text-stone-400',
    legalTitle: isDark ? 'text-stone-200' : 'text-stone-800',
    legalBorder: isDark ? 'border-white/10' : 'border-stone-300',
    footerMuted: isDark ? 'text-stone-600' : 'text-stone-500',
    btnOutline: isDark
      ? 'border-white/15 text-stone-300 hover:bg-white/5'
      : 'border-stone-300 text-stone-700 hover:bg-stone-100',
  }
}

export function scoringTierClass(
  color: 'emerald' | 'sky' | 'amber' | 'stone',
  isDark: boolean
): string {
  if (isDark) {
    const dark = {
      emerald: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
      sky: 'border-sky-500/40 bg-sky-950/30 text-sky-300',
      amber: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
      stone: 'border-white/10 bg-white/5 text-stone-400',
    }
    return dark[color]
  }
  const light = {
    emerald: 'border-emerald-400/50 bg-emerald-50 text-emerald-800',
    sky: 'border-sky-400/50 bg-sky-50 text-sky-800',
    amber: 'border-amber-400/50 bg-amber-50 text-amber-900',
    stone: 'border-stone-200 bg-stone-100 text-stone-600',
  }
  return light[color]
}
