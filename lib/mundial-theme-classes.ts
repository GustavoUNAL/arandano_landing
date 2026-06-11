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
    mutedSm: isDark ? 'text-stone-400' : 'text-stone-600',
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
    accent: isDark ? 'text-berry-300' : 'text-berry-600',
    accentLink: isDark ? 'text-berry-400' : 'text-berry-600',
    profileHero: isDark
      ? 'border-berry-500/20 bg-gradient-to-br from-berry-700 via-berry-800 to-berry-950 shadow-lg shadow-berry-950/50'
      : 'border-berry-200 bg-gradient-to-br from-white via-berry-50 to-berry-100/80 shadow-md shadow-berry-100/60',
    profileHeroTitle: isDark ? 'text-white' : 'text-stone-900',
    profileHeroMuted: isDark ? 'text-berry-100/95' : 'text-stone-600',
    profileHeroStat: isDark
      ? 'bg-black/25 border-white/15'
      : 'bg-white/90 border-berry-200/80 shadow-sm',
    profileHeroStatValue: isDark ? 'text-white' : 'text-stone-900',
    profileHeroInput: isDark
      ? 'border-white/30 bg-black/25 text-white placeholder:text-white/50 focus:border-white/60'
      : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:border-berry-400 focus:ring-2 focus:ring-berry-200/50',
    profileHeroEdit: isDark
      ? 'text-berry-100/90 hover:text-white'
      : 'text-stone-600 hover:text-stone-900',
    profileHeroAvatar: isDark
      ? 'border-white/40 ring-white/20'
      : 'border-berry-200 ring-berry-100',
    sidebarUserName: isDark ? 'text-stone-100' : 'text-stone-900',
    sidebarUserMeta: isDark ? 'text-stone-400' : 'text-stone-600',
    navActive: isDark
      ? 'bg-berry-600/20 text-berry-300'
      : 'bg-berry-50 text-berry-700 border border-berry-200',
    navInactive: isDark
      ? 'text-stone-500 hover:bg-white/5 hover:text-stone-300'
      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
    tableHead: isDark
      ? 'text-stone-500 border-white/5'
      : 'text-stone-500 border-stone-200',
    tableRow: isDark
      ? 'border-white/5 hover:bg-white/[0.02]'
      : 'border-stone-100 hover:bg-stone-50',
    tableRowWinner: isDark ? 'bg-yellow-950/20' : 'bg-amber-50',
    tableRowYou: isDark ? 'bg-berry-950/40' : 'bg-berry-50',
    tableName: isDark ? 'text-stone-200' : 'text-stone-800',
    tableNameYou: isDark ? 'text-berry-300' : 'text-berry-700',
    podioBox: isDark
      ? 'border-berry-500/20 bg-berry-950/20'
      : 'border-berry-200 bg-berry-50',
    podioChip: isDark
      ? 'bg-white/5 border-white/10 text-stone-200'
      : 'bg-white border-stone-200 text-stone-700 shadow-sm',
    podioChipYou: isDark
      ? 'bg-berry-600/30 border-berry-500/40 text-berry-100'
      : 'bg-berry-100 border-berry-300 text-berry-800',
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
