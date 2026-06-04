/** Orden de ítems en cartas públicas (catálogo Arándano Café Bar). */

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

/** CAFETERÍA */
export const MENU_ORDER_CAFETERIA = [
  'cafe-negro',
  'cafe-leche',
  'vaso-leche',
  'cafe-aromatizado',
  'carajillo',
  'cafe-irlandes',
  'cafe-frape',
  'cafe-helado',
  'leche-achocolatada',
  'aromatica-fruta',
  'jarra-aromatica-fruta',
  'soda',
  'soda-italiana',
  'coca-cola',
  'limonada-casa',
  'jugo-natural'
] as const

/** COMIDA RÁPIDA */
export const MENU_ORDER_COMIDA_RAPIDA = [
  'hot-dog-pequeno',
  'hot-dog-grande',
  'sandwich-pastuso',
  'tostadas'
] as const

/** @deprecated Usar MENU_ORDER_COMIDA_RAPIDA */
export const MENU_ORDER_PANADERIA = MENU_ORDER_COMIDA_RAPIDA

/** @deprecated Combos retirados del catálogo */
export const MENU_ORDER_COMBO_FIJO = [] as const

/** @deprecated Combos retirados del catálogo */
export const MENU_ORDER_COMBO_DIA = [] as const

export const MENU_ORDER_CERVEZA = [
  'cerveza-poker-330',
  'cerveza-aguila-330',
  'cerveza-budweiser',
  'cerveza-club-colombia-330',
  'cerveza-coronita',
  'vaso-michelado',
  'jarra-cerveza'
] as const

export const MENU_ORDER_COCTEL = [
  'coctel-hervido',
  'coctel-arandano',
  'coctel-margarita',
  'coctel-pina-colada',
  'coctel-negroni',
  'coctel-moscow-mule',
  'coctel-gin-tonic',
  'coctel-whisky-rocas',
  'coctel-coco-loco',
  'coctel-gin-tonic-campari',
  'coctel-mojito'
] as const

export const MENU_ORDER_SHOT = [
  'shot-vodka',
  'shot-aguardiente',
  'shot-ginebra',
  'shot-tequila',
  'shot-brandy',
  'shot-whisky',
  'shot-ron',
  'copa-vino'
] as const

/** LICORES (botellas) */
export const MENU_ORDER_LICORES_BOTELLA = [
  'aguardiente-narino-750',
  'media-aguardiente-narino',
  'aguardiente-amarillo-750',
  'media-aguardiente-amarillo',
  'gin-gordons-botella',
  'tequila-olmeca-botella',
  'vodka-smirnoff-botella',
  'whisky-old-parr-botella',
  'ron-viejo-caldas-750',
  'brandy-domecq-750',
  'media-brandy-domecq'
] as const

export const LICOR_CATEGORIES = [
  'aguardiente',
  'ginebra',
  'tequila',
  'whisky',
  'vodka',
  'ron',
  'brandy'
] as const
