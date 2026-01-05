'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  price: number
  description?: string
  category: string
  type: 'cafeteria' | 'bebida'
  totalSold?: number
}

interface CartItem extends Product {
  quantity: number
}

const CATEGORIES = [
  { id: 'cafes', name: 'Cafés', filter: (p: Product) => p.type === 'cafeteria' && (p.category === 'cafe-caliente' || p.category === 'cafe-frio') },
  { id: 'cocteles', name: 'Cócteles', filter: (p: Product) => p.type === 'bebida' && p.category === 'coctel' },
  { id: 'acompanantes', name: 'Acompañantes', filter: (p: Product) => p.type === 'cafeteria' && p.category === 'pasteleria' },
  { id: 'cervezas', name: 'Cervezas', filter: (p: Product) => p.type === 'bebida' && p.category === 'cerveza' }
]

export default function WaiterPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('cafes')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'nequi' | 'daviplata'>('efectivo')
  const [paymentDate, setPaymentDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const allProducts = await response.json()
        setProducts(allProducts)
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  const filteredProducts = products
    .filter(CATEGORIES.find(c => c.id === selectedCategory)?.filter || (() => true))
    .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
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

  const removeItemFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const calculateChange = () => {
    const total = getTotal()
    const paid = parseFloat(amountPaid) || 0
    return Math.max(0, paid - total)
  }

  const handlePayment = async () => {
    if (cart.length === 0) return

    const total = getTotal()
    const paid = parseFloat(amountPaid) || 0

    if (paymentMethod === 'efectivo' && paid < total) {
      alert('El monto pagado es menor al total')
      return
    }

    setProcessing(true)

    try {
      // Determinar fecha de pago (si está vacía, usar fecha actual)
      const saleDate = paymentDate ? new Date(paymentDate) : new Date()
      const saleHour = saleDate.getHours()
      
      // Registrar la venta
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price
          })),
          total,
          channel: 'presencial',
          paymentMethod,
          date: saleDate.toISOString(),
          hour: saleHour
        })
      })

      if (response.ok) {
        // Limpiar carrito y cerrar modal
        setCart([])
        setAmountPaid('')
        setPaymentMethod('efectivo')
        setPaymentDate('')
        setShowPaymentModal(false)
        alert('Venta registrada exitosamente')
      } else {
        alert('Error al registrar la venta')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Error al procesar el pago')
    } finally {
      setProcessing(false)
    }
  }

  const clearCart = () => {
    setCart([])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-berry-600 text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-berry-950 mb-2">Sistema de Cobros</h1>
          <p className="text-stone-600">Selecciona productos y gestiona pagos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Productos */}
          <div className="lg:col-span-2">
            {/* Categorías */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex gap-2 flex-wrap justify-center">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-berry-600 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de productos */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-semibold text-berry-950 mb-4 text-center">
                {CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((item) => item.id === product.id)
                  const quantity = cartItem?.quantity || 0

                  return (
                    <div
                      key={product.id}
                      className="p-4 border-2 border-stone-200 rounded-lg hover:border-berry-400 hover:bg-berry-50 transition-all"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-berry-950 text-base">{product.name}</span>
                        <span className="text-berry-600 font-semibold ml-2 text-lg">
                          ${formatPrice(product.price)}
                        </span>
                      </div>
                      {product.description && (
                        <p className="text-xs text-stone-600 mt-1">{product.description}</p>
                      )}
                      {product.totalSold && product.totalSold > 0 && (
                        <div className="mt-2 text-xs text-berry-500">
                          ⭐ Más vendido
                        </div>
                      )}
                      
                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-2 mt-3">
                        {quantity > 0 ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFromCart(product.id)
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-berry-600 hover:bg-berry-700 active:bg-berry-800 text-white rounded-lg font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                              aria-label="Quitar uno"
                            >
                              −
                            </button>
                            <span className="w-12 text-center font-bold text-lg text-berry-950 bg-stone-100 rounded-lg py-1">
                              {quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                addToCart(product)
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-berry-600 hover:bg-berry-700 active:bg-berry-800 text-white rounded-lg font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                              aria-label="Agregar uno"
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="w-full py-2 bg-berry-600 hover:bg-berry-700 active:bg-berry-800 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                          >
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Panel derecho - Carrito */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-berry-950">Carrito</h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <p className="text-stone-500 text-center py-8">El carrito está vacío</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-stone-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm text-berry-950">
                            {item.name}
                          </div>
                          <div className="text-xs text-stone-600">
                            ${formatPrice(item.price)} c/u
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 flex items-center justify-center bg-stone-200 rounded hover:bg-stone-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-6 h-6 flex items-center justify-center bg-berry-600 text-white rounded hover:bg-berry-700"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItemFromCart(item.id)}
                            className="ml-2 text-red-600 hover:text-red-700 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-stone-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-berry-950">Total:</span>
                      <span className="text-2xl font-bold text-berry-600">
                        ${formatPrice(getTotal())}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full bg-berry-600 hover:bg-berry-700 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      Cobrar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full my-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-berry-950 mb-4 text-center">Procesar Pago</h3>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-stone-600 text-lg">Total a pagar:</span>
                <span className="text-3xl font-bold text-berry-600">
                  ${formatPrice(getTotal())}
                </span>
              </div>
            </div>

            {/* Selector de fecha (opcional para pagos pasados) */}
            <div className="mb-4">
              <label className="block text-sm sm:text-base font-medium text-stone-700 mb-2">
                Fecha de pago (opcional):
              </label>
              <input
                type="datetime-local"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 sm:py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent text-sm sm:text-base"
                max={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-stone-500 mt-1">
                Deja vacío para usar fecha y hora actual
              </p>
            </div>

            {/* Selector de medio de pago */}
            <div className="mb-6">
              <label className="block text-base font-medium text-stone-700 mb-3 text-center">
                Medio de pago:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setPaymentMethod('efectivo')
                    setAmountPaid('')
                  }}
                  className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                    paymentMethod === 'efectivo'
                      ? 'bg-berry-600 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Efectivo
                </button>
                <button
                  onClick={() => {
                    setPaymentMethod('nequi')
                    setAmountPaid('')
                  }}
                  className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                    paymentMethod === 'nequi'
                      ? 'bg-berry-600 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Nequi
                </button>
                <button
                  onClick={() => {
                    setPaymentMethod('daviplata')
                    setAmountPaid('')
                  }}
                  className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                    paymentMethod === 'daviplata'
                      ? 'bg-berry-600 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Daviplata
                </button>
              </div>
            </div>

            {/* Campo de monto solo para efectivo */}
            {paymentMethod === 'efectivo' && (
              <div className="mb-6">
                <label className="block text-base font-medium text-stone-700 mb-3 text-center">
                  Monto recibido:
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={amountPaid}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setAmountPaid(value)
                  }}
                  placeholder="0"
                  className="w-full px-4 py-4 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-2xl font-semibold text-center mb-3"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePayment()
                    }
                  }}
                />
                
                {/* Botones de billetes sugeridos */}
                <div className="grid grid-cols-3 gap-2">
                  {[100000, 50000, 20000, 10000, 5000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        const current = parseFloat(amountPaid) || 0
                        setAmountPaid(String(current + amount))
                      }}
                      className="px-3 py-2 bg-berry-100 hover:bg-berry-200 text-berry-700 font-semibold rounded-lg transition-colors active:scale-95 text-sm sm:text-base"
                    >
                      ${formatPrice(amount)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mostrar cambio solo para efectivo */}
            {paymentMethod === 'efectivo' && amountPaid && parseFloat(amountPaid) >= getTotal() && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-green-800 font-semibold text-lg">Cambio:</span>
                  <span className="text-3xl font-bold text-green-600">
                    ${formatPrice(calculateChange())}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'efectivo' && amountPaid && parseFloat(amountPaid) < getTotal() && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-red-800 font-medium text-center text-lg">
                  Falta: ${formatPrice(getTotal() - parseFloat(amountPaid))}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setAmountPaid('')
                  setPaymentMethod('efectivo')
                  setPaymentDate('')
                }}
                className="flex-1 px-4 py-3 border-2 border-stone-300 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                disabled={processing}
              >
                Cancelar
              </button>
              <button
                onClick={handlePayment}
                disabled={
                  processing ||
                  (paymentMethod === 'efectivo' && (!amountPaid || parseFloat(amountPaid) < getTotal()))
                }
                className="flex-1 px-4 py-3 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {processing ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

