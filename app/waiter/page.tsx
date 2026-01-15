'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

interface Sale {
  id: string
  date: string
  hour: number
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  total: number
  subtotal?: number
  discount?: number
  discountType?: 'percentage' | 'amount'
  discountValue?: number
  comment?: string
  channel: 'presencial' | 'whatsapp'
  paymentMethod?: 'efectivo' | 'nequi'
  ticketNumber?: string
}

const CATEGORIES = [
  { id: 'cafes', name: 'Cafés', filter: (p: Product) => p.type === 'cafeteria' && (p.category === 'cafe-caliente' || p.category === 'cafe-frio') },
  { id: 'cocteles', name: 'Cócteles', filter: (p: Product) => p.type === 'bebida' && p.category === 'coctel' },
  { id: 'acompanantes', name: 'Acompañantes', filter: (p: Product) => p.type === 'cafeteria' && p.category === 'pasteleria' },
  { id: 'cervezas', name: 'Cervezas', filter: (p: Product) => p.type === 'bebida' && p.category === 'cerveza' }
]

export default function WaiterPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('cafes')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'nequi'>('efectivo')
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    // Inicializar con fecha y hora actual
    const now = new Date()
    // Ajustar al formato datetime-local (YYYY-MM-DDTHH:mm)
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  })
  const [discount, setDiscount] = useState<string>('')
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage')
  const [orderComment, setOrderComment] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [showSalesModal, setShowSalesModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showSaleDetail, setShowSaleDetail] = useState(false)
  const [paymentAction, setPaymentAction] = useState<'pay' | 'add'>('pay')
  const [showFloatingCart, setShowFloatingCart] = useState(true)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

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
    loadRecentSales()
  }, [])

  const loadRecentSales = async () => {
    try {
      const response = await fetch('/api/sales')
      const sales = await response.json()
      // Ordenar por fecha más reciente y tomar las últimas 20
      const sorted = sales.sort((a: Sale, b: Sale) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 20)
      setRecentSales(sorted)
    } catch (error) {
      console.error('Error loading sales:', error)
    }
  }

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

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getDiscountAmount = () => {
    if (!discount) return 0
    const discountValue = parseFloat(discount) || 0
    if (discountType === 'percentage') {
      return (getSubtotal() * discountValue) / 100
    }
    return discountValue
  }

  const getTotal = () => {
    const subtotal = getSubtotal()
    const discountAmount = getDiscountAmount()
    return Math.max(0, subtotal - discountAmount)
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

    // Permitir pagar cero o sin monto para casos especiales
    // Solo validar si el monto pagado es menor al total Y es diferente de 0 o vacío
    if (paymentMethod === 'efectivo' && amountPaid && paid > 0 && paid < total) {
      alert('El monto pagado es menor al total')
      return
    }

    setProcessing(true)

    try {
      // Usar la fecha y hora seleccionada en el campo
      const saleDate = new Date(paymentDate)
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
          subtotal: getSubtotal(),
          discount: getDiscountAmount(),
          discountType: discount ? discountType : undefined,
          discountValue: discount ? parseFloat(discount) : undefined,
          comment: orderComment || undefined,
          channel: 'presencial',
          paymentMethod: paymentMethod,
          date: saleDate.toISOString(),
          hour: saleHour
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Limpiar carrito y resetear modal
        setCart([])
        setAmountPaid('')
        setPaymentMethod('efectivo')
        setDiscount('')
        setDiscountType('percentage')
        setOrderComment('')
        setPaymentAction('pay')
        // Resetear fecha a la actual
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        setPaymentDate(`${year}-${month}-${day}T${hours}:${minutes}`)
        setShowPaymentModal(false)
        await loadRecentSales()
        
        // Mostrar advertencias si hay
        if (data.warnings && data.warnings.length > 0) {
          console.warn('Advertencias al crear venta:', data.warnings)
        }
        
        // Mostrar confirmación visual
        setShowSuccessMessage(true)
        setTimeout(() => {
          setShowSuccessMessage(false)
        }, 3000)
      } else {
        // Intentar leer el mensaje de error del servidor
        let errorMessage = 'Error al registrar la venta'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          if (errorData.details) {
            console.error('[Waiter] Error detalles:', errorData.details)
            errorMessage += `: ${errorData.details}`
          }
        } catch (e) {
          console.error('[Waiter] Error al leer respuesta:', e)
        }
        console.error('[Waiter] Error al registrar venta:', response.status, errorMessage)
        alert(errorMessage)
      }
    } catch (error: any) {
      console.error('[Waiter] Error processing payment:', error)
      const errorMessage = error?.message || 'Error al procesar el pago. Verifica la consola para más detalles.'
      alert(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta venta? Se restaurará el stock de los productos.')) {
      return
    }

    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadRecentSales()
        if (selectedSale?.id === saleId) {
          setShowSaleDetail(false)
          setSelectedSale(null)
        }
        alert('Venta eliminada exitosamente')
      } else {
        alert('Error al eliminar la venta')
      }
    } catch (error) {
      console.error('Error deleting sale:', error)
      alert('Error al eliminar la venta')
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
        {/* Título Centrado */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-berry-950 mb-1">Sistema de Cobros</h1>
          <p className="text-sm text-stone-600">Selecciona productos y gestiona pagos</p>
        </div>

        {/* Botón Categorías y Ver Ventas en la misma fila */}
        <div className="flex flex-row justify-center items-center gap-3 mb-6">
          <button
            onClick={() => setShowCategoriesModal(true)}
            className="px-6 py-2.5 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <span>📂</span>
            <span>{CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Categorías'}</span>
            <span>▼</span>
          </button>
          <button
            onClick={() => setShowSalesModal(true)}
            className="px-6 py-2.5 bg-stone-600 hover:bg-stone-700 text-white font-semibold rounded-lg transition-colors"
          >
            📊 Ver Ventas ({recentSales.length})
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Panel de Productos - Ahora ocupa todo el ancho */}
          <div>

            {/* Lista de productos */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
              <h2 className="text-lg font-semibold text-berry-950 mb-3 text-center">
                {CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((item) => item.id === product.id)
                  const quantity = cartItem?.quantity || 0

                  return (
                    <div
                      key={product.id}
                      className={`p-3 border-2 rounded-lg transition-all flex flex-col ${
                        product.totalSold && product.totalSold > 0
                          ? 'border-berry-300 bg-berry-50 hover:border-berry-400 hover:bg-berry-100'
                          : 'border-stone-200 hover:border-berry-400 hover:bg-berry-50'
                      }`}
                    >
                      {/* Nombre del producto */}
                      <div className="mb-2">
                        <h3 className="font-semibold text-berry-950 text-sm leading-tight mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        {product.totalSold && product.totalSold > 0 && (
                          <div className="text-xs text-berry-600 font-medium mb-1">
                            ⭐ {product.totalSold} vendidos
                          </div>
                        )}
                      </div>

                      {/* Precio destacado */}
                      <div className="mb-2">
                        <div className="text-berry-600 font-bold text-lg">
                          ${formatPrice(product.price)}
                        </div>
                      </div>
                      
                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-1.5 mt-auto pt-2">
                        {quantity > 0 ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFromCart(product.id)
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-berry-600 hover:bg-berry-700 active:bg-berry-800 text-white rounded font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95"
                              aria-label="Quitar uno"
                            >
                              −
                            </button>
                            <span className="flex-1 text-center font-bold text-base text-berry-950 bg-stone-100 rounded py-1.5">
                              {quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                addToCart(product)
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-berry-600 hover:bg-berry-700 active:bg-berry-800 text-white rounded font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95"
                              aria-label="Agregar uno"
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="w-full py-2 bg-berry-600 hover:bg-berry-700 active:bg-berry-800 text-white font-medium text-sm rounded transition-all duration-200 hover:scale-105 active:scale-95"
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
        </div>

        {/* Carrito Flotante */}
        <div className={`fixed bottom-4 right-4 ${showPaymentModal ? 'z-30' : 'z-40'}`}>
          {cart.length > 0 ? (
            <div className="bg-white rounded-xl shadow-2xl border-2 border-stone-200 max-w-sm w-[calc(100vw-2rem)] sm:w-96">
              {/* Header del carrito */}
              <div className="flex justify-between items-center p-4 border-b border-stone-200 bg-stone-50 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center text-white font-bold">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                  <h2 className="text-lg font-bold text-berry-950">Carrito</h2>
                </div>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded"
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    onClick={() => setShowFloatingCart(!showFloatingCart)}
                    className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                    aria-label={showFloatingCart ? "Minimizar" : "Expandir"}
                  >
                    {showFloatingCart ? '▼' : '▲'}
                  </button>
                </div>
              </div>

              {showFloatingCart && (
                <div className="max-h-[60vh] overflow-y-auto">
                  {/* Items del carrito */}
                  <div className="p-4 space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-stone-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-berry-950 truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-stone-600">
                            ${formatPrice(item.price)} c/u
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-7 h-7 flex items-center justify-center bg-stone-200 rounded hover:bg-stone-300 text-sm font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-7 h-7 flex items-center justify-center bg-stone-600 text-white rounded hover:bg-stone-700 text-sm font-bold"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItemFromCart(item.id)}
                            className="ml-1 text-red-600 hover:text-red-700 text-sm font-bold w-6 h-6 flex items-center justify-center hover:bg-red-50 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumen de precios */}
                  <div className="px-4 pb-4 border-t border-stone-200 pt-4">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm text-stone-600">
                        <span>Subtotal:</span>
                        <span>${formatPrice(getSubtotal())}</span>
                      </div>
                      {discount && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span className="text-xs">
                            Descuento ({discountType === 'percentage' ? `${discount}%` : 'Monto'}):
                          </span>
                          <span>-${formatPrice(getDiscountAmount())}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                        <span className="text-base font-semibold text-berry-950">Total:</span>
                        <span className="text-xl font-bold text-berry-600">
                          ${formatPrice(getTotal())}
                        </span>
                      </div>
                    </div>

                    {/* Botón de cobrar */}
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full bg-berry-600 hover:bg-berry-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg"
                    >
                      💳 Cobrar ${formatPrice(getTotal())}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <style jsx global>{`
                @keyframes floatCart {
                  0%, 100% {
                    transform: translateY(0px);
                  }
                  50% {
                    transform: translateY(-12px);
                  }
                }
                .cart-float {
                  animation: floatCart 3s ease-in-out infinite;
                }
                .cart-float:hover {
                  animation-play-state: paused;
                }
              `}</style>
              <button
                onClick={() => setShowFloatingCart(!showFloatingCart)}
                className="cart-float w-16 h-16 bg-gradient-to-br from-berry-500 via-berry-600 to-berry-700 hover:from-berry-600 hover:via-berry-700 hover:to-berry-800 text-white rounded-full shadow-2xl hover:shadow-berry-500/50 flex items-center justify-center text-2xl font-bold transition-all duration-300 hover:scale-110 active:scale-95"
                aria-label="Ver carrito"
              >
                🛒
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal de categorías */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-berry-950">Selecciona una Categoría</h3>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-xl font-bold"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setShowCategoriesModal(false)
                  }}
                  className={`px-6 py-4 rounded-lg font-semibold transition-colors text-left ${
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
        </div>
      )}

      {/* Modal de pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[50] p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-berry-950">Procesar Venta</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setAmountPaid('')
                  setPaymentMethod('efectivo')
                  setPaymentAction('pay')
                  setShowAdvancedOptions(false)
                  const now = new Date()
                  const year = now.getFullYear()
                  const month = String(now.getMonth() + 1).padStart(2, '0')
                  const day = String(now.getDate()).padStart(2, '0')
                  const hours = String(now.getHours()).padStart(2, '0')
                  const minutes = String(now.getMinutes()).padStart(2, '0')
                  setPaymentDate(`${year}-${month}-${day}T${hours}:${minutes}`)
                }}
                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-xl font-bold"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            
            {/* Resumen y Opciones en la misma fila */}
            <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Resumen */}
              <div>
                <div className="space-y-1.5 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Subtotal:</span>
                    <span>${formatPrice(getSubtotal())}</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-xs text-red-600">
                      <span>Desc. ({discountType === 'percentage' ? `${discount}%` : 'Monto'}):</span>
                      <span>-${formatPrice(getDiscountAmount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1.5 border-t border-stone-200">
                    <span className="text-stone-700 font-semibold text-sm">Total:</span>
                    <span className="text-2xl font-bold text-berry-600">
                      ${formatPrice(getTotal())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de opciones avanzadas */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="w-full h-full px-3 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <span>{showAdvancedOptions ? '▼' : '▶'}</span>
                  <span>⚙️ Opciones</span>
                  {(discount || orderComment) && (
                    <span className="ml-auto text-xs bg-berry-600 text-white px-2 py-0.5 rounded-full">
                      {[discount, orderComment].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Opciones avanzadas colapsables */}
            {showAdvancedOptions && (
              <div className="mb-3 space-y-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
                {/* Descuento y Comentario en fila */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Descuento */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">
                      Descuento:
                    </label>
                    <div className="flex gap-1 mb-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('percentage')
                          setDiscount('')
                        }}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          discountType === 'percentage'
                            ? 'bg-berry-600 text-white'
                            : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('amount')
                          setDiscount('')
                        }}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          discountType === 'amount'
                            ? 'bg-berry-600 text-white'
                            : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        Monto
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        step={discountType === 'percentage' ? '0.1' : '100'}
                        min="0"
                        max={discountType === 'percentage' ? '100' : undefined}
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder={discountType === 'percentage' ? '10' : '5000'}
                        className="flex-1 px-2 py-1.5 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-berry-500 focus:border-berry-500"
                      />
                      {discount && (
                        <button
                          type="button"
                          onClick={() => setDiscount('')}
                          className="px-2 py-1.5 bg-stone-200 hover:bg-stone-300 rounded text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comentario */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">
                      Comentario:
                    </label>
                    <textarea
                      value={orderComment}
                      onChange={(e) => setOrderComment(e.target.value)}
                      placeholder="Ej: Consumo propio..."
                      className="w-full px-2 py-1.5 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-berry-500 focus:border-berry-500"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Fecha y hora */}
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    📅 Fecha/hora:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-stone-300 rounded text-xs bg-white focus:ring-1 focus:ring-berry-500 focus:border-berry-500"
                      max={new Date().toISOString().slice(0, 16)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date()
                        const year = now.getFullYear()
                        const month = String(now.getMonth() + 1).padStart(2, '0')
                        const day = String(now.getDate()).padStart(2, '0')
                        const hours = String(now.getHours()).padStart(2, '0')
                        const minutes = String(now.getMinutes()).padStart(2, '0')
                        setPaymentDate(`${year}-${month}-${day}T${hours}:${minutes}`)
                      }}
                      className="px-2 py-1.5 text-xs bg-berry-100 hover:bg-berry-200 text-berry-700 rounded font-medium"
                    >
                      Ahora
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Selector de medio de pago */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-stone-700 mb-2 text-center">
                Medio de pago:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setPaymentMethod('efectivo')
                    setAmountPaid('')
                  }}
                  className={`px-3 py-2.5 rounded-lg font-semibold transition-colors text-sm ${
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
                  className={`px-3 py-2.5 rounded-lg font-semibold transition-colors text-sm ${
                    paymentMethod === 'nequi'
                      ? 'bg-berry-600 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Nequi
                </button>
              </div>
            </div>

            {/* Campo de monto solo para efectivo */}
            {paymentMethod === 'efectivo' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-stone-700 mb-2 text-center">
                  💵 Monto recibido:
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
                  placeholder="0 o vacío"
                  className="w-full px-3 py-3 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-xl font-semibold text-center mb-2"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePayment()
                    }
                  }}
                />
                
                {/* Botones de billetes sugeridos */}
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[100000, 50000, 20000, 10000, 5000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        const current = parseFloat(amountPaid) || 0
                        setAmountPaid(String(current + amount))
                      }}
                      className="px-2 py-1.5 bg-berry-100 hover:bg-berry-200 text-berry-700 font-medium rounded text-xs transition-colors active:scale-95"
                    >
                      ${(amount / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setAmountPaid('0')}
                  className="w-full px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded text-xs transition-colors"
                >
                  Establecer en $0
                </button>

                {/* Mostrar cambio o falta solo para efectivo */}
                {amountPaid && (
                  <>
                    {parseFloat(amountPaid) >= getTotal() && parseFloat(amountPaid) > 0 && (
                      <div className="mt-2 p-2.5 bg-green-50 border-2 border-green-300 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-green-800 font-semibold text-sm">💰 Cambio:</span>
                          <span className="text-xl font-bold text-green-600">
                            ${formatPrice(calculateChange())}
                          </span>
                        </div>
                      </div>
                    )}
                    {parseFloat(amountPaid) > 0 && parseFloat(amountPaid) < getTotal() && (
                      <div className="mt-2 p-2.5 bg-red-50 border-2 border-red-300 rounded-lg">
                        <p className="text-red-800 font-medium text-center text-sm">
                          ⚠️ Falta: ${formatPrice(getTotal() - parseFloat(amountPaid))}
                        </p>
                      </div>
                    )}
                    {parseFloat(amountPaid) === 0 && (
                      <div className="mt-2 p-2.5 bg-amber-50 border-2 border-amber-300 rounded-lg">
                        <p className="text-amber-800 font-medium text-center text-xs">
                          ℹ️ Se registrará sin pago
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200">
              <button
                onClick={handlePayment}
                disabled={
                  processing ||
                  (paymentMethod === 'efectivo' && amountPaid !== '' && parseFloat(amountPaid) > 0 && parseFloat(amountPaid) < getTotal())
                }
                className="flex-1 px-4 py-2.5 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {processing ? 'Procesando...' : '✅ Confirmar Pago'}
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setAmountPaid('')
                  setPaymentMethod('efectivo')
                  setPaymentAction('pay')
                  setShowAdvancedOptions(false)
                  // Resetear fecha a la actual al cancelar
                  const now = new Date()
                  const year = now.getFullYear()
                  const month = String(now.getMonth() + 1).padStart(2, '0')
                  const day = String(now.getDate()).padStart(2, '0')
                  const hours = String(now.getHours()).padStart(2, '0')
                  const minutes = String(now.getMinutes()).padStart(2, '0')
                  setPaymentDate(`${year}-${month}-${day}T${hours}:${minutes}`)
                }}
                className="flex-1 px-4 py-2.5 border-2 border-stone-300 rounded-lg hover:bg-stone-50 transition-colors font-medium text-sm sm:text-base"
                disabled={processing}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de ventas */}
      {showSalesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl w-full my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-berry-950">Ventas Recientes</h3>
              <button
                onClick={() => {
                  setShowSalesModal(false)
                  setShowSaleDetail(false)
                  setSelectedSale(null)
                }}
                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-xl font-bold"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {recentSales.length === 0 ? (
              <p className="text-center text-stone-500 py-8">No hay ventas registradas</p>
            ) : (
              <div className="space-y-3">
                {recentSales.map((sale) => {
                  const saleDate = new Date(sale.date)
                  return (
                    <div
                      key={sale.id}
                      className="border border-stone-200 rounded-lg p-3 sm:p-4 hover:bg-stone-50 transition-colors"
                    >
                      {/* Header móvil: fecha y total */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-semibold text-berry-950 text-sm sm:text-base">
                              {saleDate.toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {sale.paymentMethod && (
                              <span className="px-2 py-1 bg-berry-100 text-berry-700 rounded text-xs font-medium">
                                {sale.paymentMethod}
                              </span>
                            )}
                            {!sale.paymentMethod && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                Sin pago
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-stone-600">
                            {sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'}
                          </div>
                          {sale.comment && (
                            <div className="text-xs text-stone-500 mt-1 italic line-clamp-2">
                              &quot;{sale.comment}&quot;
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                          <span className="text-lg sm:text-xl font-bold text-berry-600">
                            ${formatPrice(sale.total)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Botones apilados en móvil, en línea en desktop */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-stone-200">
                        <button
                          onClick={() => {
                            setSelectedSale(sale)
                            setShowSaleDetail(true)
                          }}
                          className="flex-1 px-4 py-2 bg-berry-600 hover:bg-berry-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Ver Detalle
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de detalle de venta */}
      {showSaleDetail && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-berry-950">Detalle de Venta</h3>
              <button
                onClick={() => {
                  setShowSaleDetail(false)
                  setSelectedSale(null)
                }}
                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-xl font-bold"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Información de la venta - Mejorado para móvil */}
              <div className="bg-stone-50 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <span className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1">Fecha y Hora:</span>
                    <p className="text-sm sm:text-base text-stone-600">
                      {new Date(selectedSale.date).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {selectedSale.paymentMethod && (
                    <div>
                      <span className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1">Método de pago:</span>
                      <p className="text-sm sm:text-base text-stone-600 capitalize">{selectedSale.paymentMethod}</p>
                    </div>
                  )}
                  {!selectedSale.paymentMethod && (
                    <div>
                      <span className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1">Estado:</span>
                      <p className="text-sm sm:text-base text-amber-600 font-semibold">Sin pago</p>
                    </div>
                  )}
                  {selectedSale.ticketNumber && (
                    <div className="sm:col-span-2">
                      <span className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1">Ticket:</span>
                      <p className="text-sm sm:text-base text-stone-600">{selectedSale.ticketNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Productos - Mejorado para móvil */}
              <div>
                <h4 className="font-semibold text-berry-950 mb-3 text-base sm:text-lg">Productos:</h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-stone-50 rounded-lg p-3 sm:p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-berry-950 text-sm sm:text-base mb-1">
                            {item.productName}
                          </div>
                          <div className="text-xs sm:text-sm text-stone-600">
                            Cantidad: {item.quantity} × ${formatPrice(item.unitPrice)} c/u
                          </div>
                        </div>
                        <div className="flex justify-between sm:justify-end items-center gap-4">
                          <span className="font-semibold text-berry-600 text-base sm:text-lg">
                            ${formatPrice(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSale.comment && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                  <span className="block text-xs sm:text-sm font-semibold text-amber-800 mb-1">Comentario:</span>
                  <p className="text-sm sm:text-base text-amber-700">{selectedSale.comment}</p>
                </div>
              )}

              {/* Resumen de precios - Mejorado para móvil */}
              <div className="border-t border-stone-200 pt-4">
                <div className="space-y-2 sm:space-y-3">
                  {selectedSale.subtotal && selectedSale.subtotal !== selectedSale.total && (
                    <div className="flex justify-between text-sm sm:text-base text-stone-600">
                      <span>Subtotal:</span>
                      <span className="font-medium">${formatPrice(selectedSale.subtotal)}</span>
                    </div>
                  )}
                  {selectedSale.discount && selectedSale.discount > 0 && (
                    <div className="flex justify-between text-sm sm:text-base text-red-600">
                      <span className="break-words pr-2">
                        Descuento ({selectedSale.discountType === 'percentage' ? `${selectedSale.discountValue}%` : 'Monto'}):
                      </span>
                      <span className="font-medium whitespace-nowrap">-${formatPrice(selectedSale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-stone-300">
                    <span className="text-base sm:text-lg font-semibold text-berry-950">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-berry-600">
                      ${formatPrice(selectedSale.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones - Apilados en móvil */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200">
                <a
                  href="/waiter"
                  className="flex-1 px-4 py-2.5 text-berry-600 hover:text-berry-800 text-sm font-medium text-center"
                >
                  ← Volver
                </a>
                <button
                  onClick={() => handleDeleteSale(selectedSale.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
                >
                  Eliminar Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante para volver al panel */}
      {!(showPaymentModal || showSalesModal || showCategoriesModal || showSaleDetail || (cart.length > 0 && showFloatingCart)) && (
        <button
          onClick={() => router.push('/admin')}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-stone-700 hover:bg-stone-800 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center z-40"
          title="Volver al Panel de Administración"
          aria-label="Volver al Panel de Administración"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      )}

      {/* Mensaje de confirmación de venta exitosa */}
      {showSuccessMessage && (
        <>
          <style jsx global>{`
            @keyframes successFadeIn {
              from {
                opacity: 0;
                transform: scale(0.8) translateY(-20px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            @keyframes checkmarkScale {
              0% {
                transform: scale(0);
              }
              50% {
                transform: scale(1.2);
              }
              100% {
                transform: scale(1);
              }
            }
            .success-popup {
              animation: successFadeIn 0.4s ease-out;
            }
            .success-checkmark {
              animation: checkmarkScale 0.6s ease-out 0.2s both;
            }
          `}</style>
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[60] pointer-events-none">
            <div className="success-popup bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 min-w-[280px] pointer-events-auto">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center success-checkmark">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-berry-950 mb-2">¡Venta Registrada!</h3>
                <p className="text-stone-600 text-sm">La venta se ha registrado exitosamente</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

