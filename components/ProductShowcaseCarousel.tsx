'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { ShowcaseImage } from '@/lib/showcase-config'
import WhatsAppIcon from '@/components/WhatsAppIcon'

const INTERVAL_MS = 7000
const FADE_MS = 2400
const WHATSAPP_NUMBER = '573207909835'

type CartItem = {
  productId: string
  name: string
  description?: string
  price: number
  quantity: number
}

export default function ProductShowcaseCarousel() {
  const [images, setImages] = useState<ShowcaseImage[]>([])
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [sending, setSending] = useState(false)
  const paused = useRef(false)
  const count = images.length
  const current = images[index]

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

  const pauseCarousel = () => {
    paused.current = true
    window.setTimeout(() => {
      paused.current = false
    }, 8000)
  }

  const addCurrentProduct = () => {
    const productId = current?.productId
    const price = current?.price
    if (!productId || price == null) return
    pauseCarousel()

    const name = current.name || current.alt
    const description = current.description

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId)
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { productId, name, description, price, quantity: 1 }]
    })
  }

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const getTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const sendOrder = async () => {
    if (cart.length === 0 || sending) return
    setSending(true)

    const orderNumber = Math.floor(1000 + Math.random() * 9000)
    const total = getTotal()
    const orderItems = cart
      .map(
        (item) =>
          `${item.name} x${item.quantity} - $${(item.price * item.quantity).toLocaleString('es-CO')}`
      )
      .join('\n')

    try {
      await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price
          })),
          total,
          channel: 'whatsapp'
        })
      })
    } catch (error) {
      console.error('Error registrando venta:', error)
    }

    const message = encodeURIComponent(
      `Hola, quiero hacer un pedido en Arándano Café Bar:\n\n📦 Orden #${orderNumber}\n\n${orderItems}\n\n💰 Total: $${total.toLocaleString('es-CO')}`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank')
    setCart([])
    setSending(false)
  }

  const canOrder = Boolean(current?.productId && current.price != null)

  if (!ready) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6" aria-hidden>
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-berry-100/80 via-white to-berry-50/60 p-4 sm:p-6 lg:p-8 shadow-lg ring-1 ring-berry-200/40">
          <div className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] rounded-xl bg-stone-200/50 animate-pulse" />
        </div>
      </div>
    )
  }

  if (count === 0) return null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6" aria-label="Productos destacados">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-berry-100/90 via-white to-berry-50/70 shadow-xl ring-1 ring-berry-200/50">
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-berry-300/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-berry-400/15 blur-3xl"
          aria-hidden
        />

        <div className="relative p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-stretch lg:gap-8">
            {/* Carrusel de imágenes */}
            <div className="lg:w-[55%] shrink-0">
              <div
                className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden bg-white/80 shadow-inner ring-2 ring-white/80"
                onPointerDown={pauseCarousel}
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
                          ? 'object-contain object-center p-2 sm:p-4'
                          : 'object-cover opacity-90 saturate-[0.8] brightness-[0.95]'
                      }
                      sizes="(max-width: 1024px) 92vw, 520px"
                      priority={i === 0}
                    />
                  </div>
                ))}

                {!isLocal && (
                  <div
                    className="absolute inset-0 pointer-events-none bg-gradient-to-b from-stone-50/50 via-transparent to-berry-100/30"
                    aria-hidden
                  />
                )}

                {count > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIndex((i) => (i - 1 + count) % count)
                        pauseCarousel()
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-berry-700 shadow-md flex items-center justify-center transition-all"
                      aria-label="Producto anterior"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIndex((i) => (i + 1) % count)
                        pauseCarousel()
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-berry-700 shadow-md flex items-center justify-center transition-all"
                      aria-label="Siguiente producto"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {count > 1 && (
                <div className="flex justify-center gap-2 mt-3 sm:mt-4" role="tablist" aria-label="Productos">
                  {images.map((img, i) => (
                    <button
                      key={img.src + (img.filename ?? i)}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={img.name || img.alt}
                      onClick={() => {
                        setIndex(i)
                        pauseCarousel()
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === index ? 'w-8 bg-berry-600 shadow-sm' : 'w-2 bg-berry-300/70 hover:bg-berry-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Info del producto */}
            <div className="mt-5 lg:mt-0 lg:flex-1 flex flex-col justify-center text-center lg:text-left">
              <span className="inline-flex self-center lg:self-start items-center gap-1.5 px-3 py-1 rounded-full bg-berry-600/10 text-berry-700 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-3">
                <span aria-hidden>🫐</span> Destacado
              </span>

              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-berry-950 leading-tight">
                {current?.name || current?.alt}
              </h3>

              {current?.description && (
                <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed max-w-md mx-auto lg:mx-0">
                  {current.description}
                </p>
              )}

              {current?.price != null && (
                <p className="mt-4 text-2xl sm:text-3xl font-bold text-berry-700">
                  ${current.price.toLocaleString('es-CO')}
                </p>
              )}

              {canOrder ? (
                <button
                  type="button"
                  onClick={addCurrentProduct}
                  className="mt-5 w-full sm:w-auto self-center lg:self-start min-h-[48px] px-8 py-3.5 bg-berry-600 hover:bg-berry-700 active:bg-berry-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  Agregar al pedido
                </button>
              ) : (
                <p className="mt-5 text-sm text-stone-500">Consulta la carta para pedir este producto.</p>
              )}
            </div>
          </div>

          {cart.length > 0 && (
            <div className="mt-6 lg:mt-8 pt-6 border-t border-berry-200/50">
              <h4 className="font-display text-lg sm:text-xl font-bold text-berry-950 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-berry-500" aria-hidden />
                Tu pedido
              </h4>
              <ul className="space-y-3">
                {cart.map((item) => (
                  <li
                    key={item.productId}
                    className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-berry-100 rounded-xl p-3 sm:p-4 shadow-sm"
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-berry-950 truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-xs sm:text-sm text-stone-500 line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      )}
                      <p className="text-sm font-bold text-berry-700 mt-1">
                        ${(item.price * item.quantity).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => changeQty(item.productId, -1)}
                        className="w-9 h-9 rounded-lg bg-stone-100 hover:bg-stone-200 text-berry-950 font-bold"
                        aria-label={`Quitar uno de ${item.name}`}
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-bold text-berry-950">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(item.productId, 1)}
                        className="w-9 h-9 rounded-lg bg-berry-600 hover:bg-berry-700 text-white font-bold"
                        aria-label={`Agregar uno de ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-base sm:text-lg font-bold text-berry-950">
                  Total:{' '}
                  <span className="text-berry-700">${getTotal().toLocaleString('es-CO')}</span>
                </p>
                <button
                  type="button"
                  onClick={sendOrder}
                  disabled={sending}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon size={20} className="text-white" />
                  Enviar pedido
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
