/** Orden de ítems en cartas públicas (MENÚ ARÁNDANO CAFÉ BAR). */

export function sortMenuByIds<T extends { id: string }>(
  items: T[],
  order: readonly string[]
): T[] {
  const rank = new Map(order.map((id, i) => [id, i]))
  return [...items].sort((a, b) => {
    const ra = rank.get(a.id) ?? 9999
    const rb = rank.get(b.id) ?? 9999
    if (ra !== rb) return ra - rb
    return a.id.localeCompare(b.id, 'es')
  })
}

/** CAFETERÍA (orden del menú impreso) */
export const MENU_ORDER_CAFETERIA = [
  'cafe-negro',
  'cafe-aromatizado',
  'carajillo',
  'cafe-leche',
  'cafe-irlandes',
  'vaso-leche',
  'cafe-frape',
  'cafe-helado',
  'leche-achocolatada',
  'aromatica-fruta',
  'aromatica',
  'jarra-aromatica-fruta',
  'hervidos',
  'jarra-hervidos',
  'soda-italiana'
] as const

export const MENU_ORDER_PANADERIA = [
  'porcion-galletas',
  'empanadas',
  'tostadas'
] as const

export const MENU_ORDER_COMBO_FIJO = ['combo-cafe-panaderia'] as const

export const MENU_ORDER_COMBO_DIA = [
  'combo-dia-lunes',
  'combo-dia-martes',
  'combo-dia-miercoles',
  'combo-dia-jueves',
  'combo-dia-viernes',
  'combo-dia-sabado'
] as const

export const MENU_ORDER_CERVEZA = [
  'cerveza-poker-330',
  'cerveza-coronita',
  'cerveza-pokeron-750',
  'cerveza-club-colombia-330',
  'cerveza-michelada',
  'cerveza-budweiser'
] as const

export const MENU_ORDER_COCTEL = [
  'coctel-arandano',
  'coctel-margarita',
  'coctel-pina-colada',
  'coctel-negroni',
  'coctel-moscow-mule',
  'coctel-gin-tonic',
  'coctel-whisky-rocas'
] as const

export const MENU_ORDER_SHOT = [
  'shot-vodka',
  'shot-tequila',
  'shot-brandy',
  'shot-aguardiente',
  'shot-whisky',
  'shot-ginebra',
  'shot-ron'
] as const

/** LICORES (botellas) — orden del menú */
export const MENU_ORDER_LICORES_BOTELLA = [
  'aguardiente-botella-750',
  'gin-gordons-botella',
  'tequila-olmeca-botella',
  'whisky-old-parr-botella',
  'vino-tinto-botella',
  'vodka-smirnoff-botella'
] as const

export const LICOR_CATEGORIES = [
  'aguardiente',
  'ginebra',
  'tequila',
  'whisky',
  'vino',
  'vodka'
] as const
