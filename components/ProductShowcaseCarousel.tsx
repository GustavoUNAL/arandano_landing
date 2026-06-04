'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { ShowcaseImage } from '@/lib/showcase-config'

const INTERVAL_MS = 7000
const FADE_MS = 2400

export default function ProductShowcaseCarousel() {
  const [images, setImages] = useState<ShowcaseImage[]>([])
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const paused = useRef(false)
  const count = images.length

  useEffect(() => {
    let cancelled = false
    fetch('/api/showcase')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.images?.length) return
        setImages(data.images)
        setReady(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const isLocal = images.length > 0 && images.every((img) => img.src.startsWith('/images/showcase/'))

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!ready || count <= 1 || reducedMotion) return
    const id = window.setInterval(() => {
      if (!document.hidden && !paused.current) {
        setIndex((i) => (i + 1) % count)
      }
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [ready, count, reducedMotion])

  const wrapperClass = 'max-w-xl sm:max-w-2xl mx-auto px-4 sm:px-6'
  const frameClass =
    'relative w-full aspect-[3/2] max-h-[17rem] sm:max-h-[19rem] md:max-h-[21rem] lg:max-h-[24rem] rounded-xl overflow-hidden bg-stone-100/90 mx-auto shadow-sm ring-1 ring-stone-200/60'

  if (!ready) {
    return (
      <div className={wrapperClass} aria-hidden>
        <div className={`${frameClass} bg-stone-200/40 animate-pulse`} />
      </div>
    )
  }

  if (count === 0) return null

  return (
    <div className={wrapperClass} aria-label="Galería ambiental">
      <div
        className={frameClass}
        onPointerDown={() => {
          paused.current = true
        }}
        onPointerUp={() => {
          window.setTimeout(() => {
            paused.current = false
          }, 4000)
        }}
      >
        {images.map((img, i) => (
          <div
            key={img.src + (img.filename ?? i)}
            className="absolute inset-0 ease-in-out"
            style={{
              opacity: i === index ? 1 : 0,
              transitionProperty: 'opacity',
              transitionDuration: reducedMotion ? '0ms' : `${FADE_MS}ms`,
              zIndex: i === index ? 1 : 0
            }}
            aria-hidden={i !== index}
          >
            <Image
              src={img.src}
              alt={i === index ? img.alt : ''}
              fill
              className={
                isLocal
                  ? 'object-contain object-center'
                  : 'object-cover opacity-90 saturate-[0.75] brightness-[0.94]'
              }
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 672px, 672px"
              priority={i === 0}
            />
          </div>
        ))}

        {!isLocal && (
          <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-b from-stone-50/60 via-stone-50/10 to-stone-100/70"
            aria-hidden
          />
        )}
        {isLocal && (
          <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-t from-stone-900/5 via-transparent to-transparent"
            aria-hidden
          />
        )}
      </div>
    </div>
  )
}
