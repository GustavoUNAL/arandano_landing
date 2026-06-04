import { NextResponse } from 'next/server'
import { getShowcaseImages } from '@/lib/showcase-images'

export const dynamic = 'force-dynamic'

/**
 * GET /api/showcase
 * Devuelve las imágenes del carrusel (public/images/showcase + showcase-manifest.json).
 */
export async function GET() {
  try {
    const images = getShowcaseImages()
    const local = images.length > 0 && images.every((i) => i.src.startsWith('/images/showcase/'))
    return NextResponse.json({
      images,
      count: images.length,
      source: local ? 'local' : 'fallback',
      folder: 'public/images/showcase',
      manifest: 'data/showcase-manifest.json'
    })
  } catch (error) {
    console.error('[api/showcase]', error)
    return NextResponse.json(
      { error: 'No se pudieron cargar las imágenes', images: [] },
      { status: 500 }
    )
  }
}
