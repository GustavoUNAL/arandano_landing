'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import Link from 'next/link'
import { useState } from 'react'
import WhatsAppIcon from '@/components/WhatsAppIcon'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  size?: string
}

const CartIcon = ({ count }: { count: number }) => (
  <div className="relative inline-flex items-center justify-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 sm:w-6 sm:h-6"
    >
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
    {count > 0 && (
      <>
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center animate-bounce">
          {count > 9 ? '9+' : count}
        </span>
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center opacity-75 animate-ping"></span>
      </>
    )}
  </div>
)

export default function MenuBebidas() {
  const [cart, setCart] = useState<CartItem[]>([])
  const whatsappNumber = '573207909835'

  const cocteles = [
    { id: 'coctel-arandano', name: 'Cóctel Arándano', price: 12000, description: 'Jugo de arándano, Campari y jugo de naranja (copa estándar)' },
  ]

  const vinos = [
    { id: 'vino-tinto-copa', name: 'Vino Tinto Chile (Gato Negro / Santa Carolina)', price: 9000, size: 'Copa 150ml' },
    { id: 'vino-tinto-botella', name: 'Vino Tinto Chile (Gato Negro / Santa Carolina)', price: 42000, size: 'Botella 750ml' },
    { id: 'vino-blanco-copa', name: 'Vino Blanco Chile (Sauvignon Blanc)', price: 9000, size: 'Copa 150ml' },
    { id: 'vino-blanco-botella', name: 'Vino Blanco Chile (Sauvignon Blanc)', price: 40000, size: 'Botella 750ml' },
    { id: 'vino-rosado-copa', name: 'Vino Rosado Chile', price: 9500, size: 'Copa 150ml' },
    { id: 'vino-rosado-botella', name: 'Vino Rosado Chile', price: 44000, size: 'Botella 750ml' },
  ]

  const vodka = [
    { id: 'vodka-smirnoff-shot', name: 'Vodka Smirnoff', price: 11000, size: 'Shot 30ml' },
    { id: 'vodka-smirnoff-botella', name: 'Vodka Smirnoff', price: 80000, size: 'Botella 750ml' },
    { id: 'vodka-absolut-shot', name: 'Vodka Absolut', price: 12000, size: 'Shot 30ml' },
    { id: 'vodka-absolut-botella', name: 'Vodka Absolut', price: 105000, size: 'Botella 750ml' },
    { id: 'vodka-skyy-shot', name: 'Vodka Skyy', price: 11000, size: 'Shot 30ml' },
    { id: 'vodka-skyy-botella', name: 'Vodka Skyy', price: 80000, size: 'Botella 750ml' },
  ]

  const ginebra = [
    { id: 'gin-gordons-shot', name: 'Ginebra Gordon\'s', price: 12000, size: 'Shot 30ml' },
    { id: 'gin-gordons-botella', name: 'Ginebra Gordon\'s', price: 165000, size: 'Botella 750ml' },
    { id: 'gin-beefeater-shot', name: 'Ginebra Beefeater', price: 12000, size: 'Shot 30ml' },
    { id: 'gin-beefeater-botella', name: 'Ginebra Beefeater', price: 165000, size: 'Botella 750ml' },
  ]

  const tequila = [
    { id: 'tequila-jose-cuervo-shot', name: 'Tequila José Cuervo Especial', price: 12000, size: 'Shot 30ml' },
    { id: 'tequila-jose-cuervo-botella', name: 'Tequila José Cuervo Especial', price: 155000, size: 'Botella 750ml' },
    { id: 'tequila-olmeca-shot', name: 'Tequila Olmeca', price: 12000, size: 'Shot 30ml' },
    { id: 'tequila-olmeca-botella', name: 'Tequila Olmeca', price: 155000, size: 'Botella 750ml' },
  ]

  const whisky = [
    { id: 'whisky-old-parr-shot', name: 'Whisky Old Parr / Passport Scotch / Jack Daniel\'s', price: 14000, size: 'Shot 30ml' },
    { id: 'whisky-old-parr-botella', name: 'Whisky Old Parr / Passport Scotch / Jack Daniel\'s', price: 195000, size: 'Botella 750ml' },
  ]

  const addToCart = (item: { id: string; name: string; price: number; size?: string }) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id)
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prevCart, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === id)
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
      }
      return prevCart.filter((item) => item.id !== id)
    })
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const sendWhatsAppOrder = () => {
    if (cart.length === 0) return

    const orderNumber = Math.floor(1000 + Math.random() * 9000)

    const orderItems = cart
      .map((item) => {
        const sizeText = item.size ? ` (${item.size})` : ''
        return `${item.name}${sizeText} x${item.quantity} - $${(item.price * item.quantity).toLocaleString('es-CO')}`
      })
      .join('\n')

    const total = getTotal()
    const message = encodeURIComponent(
      `Hola, quiero hacer un pedido en Arándano Café Bar:\n\n📦 Orden #${orderNumber}\n\n${orderItems}\n\n💰 Total: $${total.toLocaleString('es-CO')}`
    )
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const MenuCard = ({ item }: { item: { id: string; name: string; price: number; size?: string; description?: string } }) => {
    const cartItem = cart.find((c) => c.id === item.id)
    const quantity = cartItem?.quantity || 0

    return (
      <div className="bg-white border-2 border-stone-200 rounded-xl p-4 sm:p-5 md:p-6 hover:bg-stone-50 hover:border-berry-300 transition-all duration-300 hover:shadow-lg">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex-1">
            <h3 className="font-display text-base sm:text-lg md:text-xl font-bold text-berry-950 mb-2 sm:mb-3 leading-tight">
              {item.name}
            </h3>
            {item.size && (
              <p className="text-berry-600 text-xs sm:text-sm mb-1 font-medium">
                {item.size}
              </p>
            )}
            {item.description && (
              <p className="text-berry-600 text-xs sm:text-sm mb-2 sm:mb-3 leading-relaxed">
                {item.description}
              </p>
            )}
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-berry-700">
              ${item.price.toLocaleString('es-CO')}
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {quantity > 0 ? (
              <>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="flex-1 sm:flex-none w-10 h-10 sm:w-12 sm:h-12 bg-berry-600 hover:bg-berry-700 text-white rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                  aria-label="Quitar uno"
                >
                  −
                </button>
                <span className="w-12 sm:w-16 text-center font-bold text-lg sm:text-xl md:text-2xl text-berry-950 bg-stone-100 rounded-lg py-2">
                  {quantity}
                </span>
                <button
                  onClick={() => addToCart(item)}
                  className="flex-1 sm:flex-none w-10 h-10 sm:w-12 sm:h-12 bg-berry-600 hover:bg-berry-700 text-white rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                  aria-label="Agregar al carrito"
                >
                  +
                </button>
              </>
            ) : (
              <button
                onClick={() => addToCart(item)}
                className="w-full sm:w-auto sm:flex-1 bg-berry-600 hover:bg-berry-700 text-white font-semibold text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-2"
                aria-label="Agregar al carrito"
              >
                <CartIcon count={0} />
                <span>Agregar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-stone-50">
        <div className="container-custom py-6 sm:py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8 md:mb-12">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-berry-700 hover:text-berry-950 transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
              >
                ← Volver al inicio
              </Link>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-berry-950 mb-3 sm:mb-4">
                BEBIDAS
              </h1>
              <p className="text-berry-600 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
                💡 Los precios son referencia para Pasto y entornos similares en Colombia, tomando en cuenta mercados online y superficies.
              </p>
            </div>

            {/* Aviso Legal */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 md:mb-10">
              <p className="text-amber-800 text-xs sm:text-sm md:text-base text-center font-medium">
                <strong>Importante:</strong> Prohibida la venta de bebidas alcohólicas a menores de edad.
                Se solicita documento de identidad al momento de la entrega.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {/* Menú */}
              <div className="lg:col-span-3 space-y-8 sm:space-y-10 md:space-y-12">
                {/* Cócteles */}
                <section>
                  <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-berry-950 mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl">🍸</span>
                    <span>COCTELES</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                    {cocteles.map((item) => (
                      <MenuCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>

                {/* Vinos */}
                <section>
                  <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-berry-950 mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl">🍷</span>
                    <span>VINOS</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                    {vinos.map((item) => (
                      <MenuCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>

                {/* Licores Secos */}
                <section>
                  <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-berry-950 mb-4 sm:mb-6 md:mb-8">
                    🥃 LICORES SECOS
                  </h2>

                  {/* Vodka */}
                  <div className="mb-6 sm:mb-8">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-berry-800 mb-4 sm:mb-6 flex items-center gap-2">
                      <span>🍸</span>
                      <span>Vodka</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                      {vodka.map((item) => (
                        <MenuCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>

                  {/* Ginebra */}
                  <div className="mb-6 sm:mb-8">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-berry-800 mb-4 sm:mb-6 flex items-center gap-2">
                      <span>🍸</span>
                      <span>Ginebra</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                      {ginebra.map((item) => (
                        <MenuCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>

                  {/* Tequila */}
                  <div className="mb-6 sm:mb-8">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-berry-800 mb-4 sm:mb-6 flex items-center gap-2">
                      <span>🥃</span>
                      <span>Tequila</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                      {tequila.map((item) => (
                        <MenuCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>

                  {/* Whisky */}
                  <div className="mb-6 sm:mb-8">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-berry-800 mb-4 sm:mb-6 flex items-center gap-2">
                      <span>🥃</span>
                      <span>Whisky</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                      {whisky.map((item) => (
                        <MenuCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              {/* Carrito */}
              <div className="lg:col-span-1">
                <div className={`sticky top-20 lg:top-24 bg-white border-2 ${getTotalItems() > 0 ? 'border-berry-400' : 'border-stone-200'} rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-berry-950 flex items-center gap-2">
                      <CartIcon count={getTotalItems()} />
                      <span>Carrito</span>
                    </h3>
                    {getTotalItems() > 0 && (
                      <button
                        onClick={clearCart}
                        className="text-xs sm:text-sm text-berry-600 hover:text-berry-950 font-medium transition-colors"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🛒</div>
                      <p className="text-berry-600 text-sm sm:text-base">
                        Tu carrito está vacío
                      </p>
                      <p className="text-berry-500 text-xs sm:text-sm mt-2">
                        Agrega productos para comenzar
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="bg-stone-50 border border-stone-200 rounded-lg p-3 sm:p-4 animate-fade-in"
                          >
                            <div className="flex justify-between items-start mb-2 sm:mb-3">
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="font-semibold text-berry-950 text-xs sm:text-sm md:text-base">
                                  {item.name}
                                </p>
                                {item.size && (
                                  <p className="text-berry-600 text-xs sm:text-sm mt-1">
                                    {item.size}
                                  </p>
                                )}
                                <p className="text-berry-600 text-xs sm:text-sm mt-1">
                                  ${item.price.toLocaleString('es-CO')} c/u
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  const newCart = cart.filter((i) => i.id !== item.id)
                                  setCart(newCart)
                                }}
                                className="text-berry-600 hover:text-red-600 ml-2 flex-shrink-0 transition-colors text-lg sm:text-xl"
                                aria-label="Eliminar"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-7 h-7 sm:w-8 sm:h-8 bg-stone-200 hover:bg-stone-300 rounded-lg flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-200 hover:scale-110 active:scale-95"
                                >
                                  −
                                </button>
                                <span className="w-8 sm:w-10 text-center font-bold text-sm sm:text-base md:text-lg bg-white border border-stone-300 rounded-lg py-1">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, size: item.size })}
                                  className="w-7 h-7 sm:w-8 sm:h-8 bg-berry-600 hover:bg-berry-700 text-white rounded-lg flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-200 hover:scale-110 active:scale-95"
                                >
                                  +
                                </button>
                              </div>
                              <p className="font-bold text-berry-700 text-sm sm:text-base md:text-lg ml-2">
                                ${(item.price * item.quantity).toLocaleString('es-CO')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t-2 border-stone-300 pt-4 sm:pt-5 mb-4 sm:mb-6">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg sm:text-xl text-berry-950">Total:</span>
                          <span className="font-bold text-xl sm:text-2xl md:text-3xl text-berry-700">
                            ${getTotal().toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={sendWhatsAppOrder}
                        disabled={cart.length === 0}
                        className="w-full bg-[#25D366] hover:bg-[#20BA5A] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base md:text-lg px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3"
                      >
                        <WhatsAppIcon size={20} className="text-white" />
                        <span>Enviar pedido</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  )
}
