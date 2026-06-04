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

  const wrapperClass = 'max-w-xl sm:max-w-2xl mx-auto px-4 sm:px-6'
  const frameClass =
    'relative w-full aspect-[3/2] max-h-[17rem] sm:max-h-[19rem] md:max-h-[21rem] lg:max-h-[24rem] rounded-xl overflow-hidden bg-stone-100/90 mx-auto shadow-sm ring-1 ring-stone-200/60'

  const canOrder = Boolean(current?.productId && current.price != null)

  if (!ready) {
    return (
      <div className={wrapperClass} aria-hidden>
        <div className={`${frameClass} bg-stone-200/40 animate-pulse`} />
      </div>
    )
  }

  if (count === 0) return null

  return (
    <div className={wrapperClass} aria-label="Productos destacados">
      <div className={frameClass} onPointerDown={pauseCarousel}>
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
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-2 mt-3" role="tablist" aria-label="Productos">
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
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-berry-600' : 'w-2 bg-stone-300 hover:bg-stone-400'
              }`}
            />
          ))}
        </div>
      )}

      <div className="mt-4 sm:mt-5 text-center sm:text-left">
        <h3 className="font-display text-xl sm:text-2xl font-bold text-berry-950">
          {current?.name || current?.alt}
        </h3>
        {current?.description && (
          <p className="mt-2 text-sm sm:text-base text-stone-600 leading-relaxed">
            {current.description}
          </p>
        )}
        {current?.price != null && (
          <p className="mt-2 text-lg sm:text-xl font-bold text-berry-700">
            ${current.price.toLocaleString('es-CO')}
          </p>
        )}

        {canOrder ? (
          <button
            type="button"
            onClick={addCurrentProduct}
            className="mt-4 w-full sm:w-auto min-h-[48px] px-6 py-3 bg-berry-600 hover:bg-berry-700 active:bg-berry-800 text-white font-semibold rounded-xl shadow-md transition-all"
          >
            Agregar producto
          </button>
        ) : (
          <p className="mt-4 text-sm text-stone-500">Consulta la carta para pedir este producto.</p>
        )}
      </div>

      {cart.length > 0 && (
        <div className="mt-6 pt-6 border-t border-stone-200/80">
          <h4 className="font-display text-lg font-bold text-berry-950 mb-3">Tu pedido</h4>
          <ul className="space-y-3">
            {cart.map((item) => (
              <li
                key={item.productId}
                className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl p-3 sm:p-4 shadow-sm"
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
              Enviar producto
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
