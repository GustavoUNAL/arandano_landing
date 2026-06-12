export type PerfilTab = 'inicio' | 'mundial' | 'jugar' | 'picks' | 'admin'

export const PERFIL_PATH = '/perfil'
export const PERFIL_JUGAR_PATH = '/perfil?tab=jugar'

const VALID_TABS: PerfilTab[] = ['inicio', 'mundial', 'jugar', 'picks', 'admin']

export function isPerfilTab(value: string | null | undefined): value is PerfilTab {
  return !!value && VALID_TABS.includes(value as PerfilTab)
}

export function perfilPathForTab(tab: PerfilTab): string {
  if (tab === 'inicio') return PERFIL_PATH
  return `${PERFIL_PATH}?tab=${tab}`
}

export function perfilPathForPlayMatch(matchId: number): string {
  return `${PERFIL_PATH}?tab=jugar&match=${matchId}`
}
