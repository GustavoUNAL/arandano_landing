export type ShowcaseImage = {
  src: string
  alt: string
  filename?: string
}

/** Solo si no hay fotos en public/images/showcase/ */
export const SHOWCASE_FALLBACK_IMAGES: ShowcaseImage[] = [
  {
    src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=75',
    alt: 'Café recién preparado'
  },
  {
    src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=75',
    alt: 'Ambiente de café'
  },
  {
    src: 'https://images.unsplash.com/photo-1514362545857-507bcad97777?auto=format&fit=crop&w=1200&q=75',
    alt: 'Bebida en el bar'
  }
]
