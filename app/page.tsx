'use client'

import Header from '@/components/Header'
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import LocationSchedule from '@/components/LocationSchedule'
import Footer from '@/components/Footer'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import { useState, useMemo } from 'react'
import WhatsAppIcon from '@/components/WhatsAppIcon'

interface Product {
  id: string
  name: string
  price: number
  description?: string
  size?: string
  category: 'cafe-caliente' | 'cafe-frio' | 'pasteleria' | 'combo' | 'coctel' | 'vino' | 'vodka' | 'ginebra' | 'tequila' | 'whisky'
  type: 'cafeteria' | 'bebida'
}

interface CartItem extends Product {
  quantity: number
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

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'cafeteria' | 'bebida'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)
  const whatsappNumber = '573207909835'

  // Productos de Cafetería
  const productosCafeteria: Product[] = [
    // Cafés Calientes
    { id: 'cafe-negro', name: 'Café negro artisanal', price: 3800, description: 'Café artesanal preparado tradicionalmente, sin adiciones', category: 'cafe-caliente', type: 'cafeteria' },
    { id: 'cafe-leche', name: 'Café artesanal con leche', price: 4200, description: 'Café artesanal suavizado con leche fresca', category: 'cafe-caliente', type: 'cafeteria' },
    { id: 'cafe-aromatizado', name: 'Café aromatizado artesanal (canela / vainilla)', price: 5000, description: 'Café artesanal con esencia natural de canela o vainilla', category: 'cafe-caliente', type: 'cafeteria' },
    { id: 'cafe-irlandes', name: 'Café irlandes', price: 10000, description: 'Café con whisky irlandés y crema batida', category: 'cafe-caliente', type: 'cafeteria' },
    { id: 'carajillo', name: 'Carajillo', price: 8000, description: 'Café con licor, tradicional preparación', category: 'cafe-caliente', type: 'cafeteria' },
    // Cafés Fríos
    { id: 'cafe-frio', name: 'Café frío artisanal', price: 3800, description: 'Café artesanal servido frío, refrescante', category: 'cafe-frio', type: 'cafeteria' },
    { id: 'cafe-helado', name: 'Café helado artesanal (affogato)', price: 10000, description: 'Helado bañado con café artesanal caliente', category: 'cafe-frio', type: 'cafeteria' },
    { id: 'cafe-frio-leche', name: 'Café artesanal frío con leche', price: 4200, description: 'Café artesanal frío con leche, suave y refrescante', category: 'cafe-frio', type: 'cafeteria' },
    // Pastelería
    { id: 'pastel-dia', name: 'Pastel del día', price: 5000, description: 'Pastel casero recién preparado, variedad del día', category: 'pasteleria', type: 'cafeteria' },
    { id: 'acompanante', name: 'Acompañante del día (Empanada, Buñuelo)', price: 2000, description: 'Delicioso acompañante recién hecho, opción del día', category: 'pasteleria', type: 'cafeteria' },
    // Combos
    { id: 'combo-cafe-pastel', name: 'Café artesanal caliente + pastel del día', price: 7000, description: 'Combo perfecto: café caliente artesanal acompañado de nuestro pastel del día', category: 'combo', type: 'cafeteria' },
  ]

  // Productos de Bebidas
  const productosBebidas: Product[] = [
    // Cócteles
    { id: 'coctel-arandano', name: 'Cóctel Arándano', price: 12000, description: 'Jugo de arándano, Campari y jugo de naranja (copa estándar)', category: 'coctel', type: 'bebida' },
    // Vinos
    { id: 'vino-tinto-copa', name: 'Vino Tinto Chile (Gato Negro / Santa Carolina)', price: 9000, size: 'Copa 150ml', category: 'vino', type: 'bebida' },
    { id: 'vino-tinto-botella', name: 'Vino Tinto Chile (Gato Negro / Santa Carolina)', price: 42000, size: 'Botella 750ml', category: 'vino', type: 'bebida' },
    { id: 'vino-blanco-copa', name: 'Vino Blanco Chile (Sauvignon Blanc)', price: 9000, size: 'Copa 150ml', category: 'vino', type: 'bebida' },
    { id: 'vino-blanco-botella', name: 'Vino Blanco Chile (Sauvignon Blanc)', price: 40000, size: 'Botella 750ml', category: 'vino', type: 'bebida' },
    { id: 'vino-rosado-copa', name: 'Vino Rosado Chile', price: 9500, size: 'Copa 150ml', category: 'vino', type: 'bebida' },
    { id: 'vino-rosado-botella', name: 'Vino Rosado Chile', price: 44000, size: 'Botella 750ml', category: 'vino', type: 'bebida' },
    // Vodka
    { id: 'vodka-smirnoff-shot', name: 'Vodka Smirnoff', price: 11000, size: 'Shot 30ml', category: 'vodka', type: 'bebida' },
    { id: 'vodka-smirnoff-botella', name: 'Vodka Smirnoff', price: 80000, size: 'Botella 750ml', category: 'vodka', type: 'bebida' },
    { id: 'vodka-absolut-shot', name: 'Vodka Absolut', price: 12000, size: 'Shot 30ml', category: 'vodka', type: 'bebida' },
    { id: 'vodka-absolut-botella', name: 'Vodka Absolut', price: 105000, size: 'Botella 750ml', category: 'vodka', type: 'bebida' },
    { id: 'vodka-skyy-shot', name: 'Vodka Skyy', price: 11000, size: 'Shot 30ml', category: 'vodka', type: 'bebida' },
    { id: 'vodka-skyy-botella', name: 'Vodka Skyy', price: 80000, size: 'Botella 750ml', category: 'vodka', type: 'bebida' },
    // Ginebra
    { id: 'gin-gordons-shot', name: 'Ginebra Gordon\'s', price: 12000, size: 'Shot 30ml', category: 'ginebra', type: 'bebida' },
    { id: 'gin-gordons-botella', name: 'Ginebra Gordon\'s', price: 165000, size: 'Botella 750ml', category: 'ginebra', type: 'bebida' },
    { id: 'gin-beefeater-shot', name: 'Ginebra Beefeater', price: 12000, size: 'Shot 30ml', category: 'ginebra', type: 'bebida' },
    { id: 'gin-beefeater-botella', name: 'Ginebra Beefeater', price: 165000, size: 'Botella 750ml', category: 'ginebra', type: 'bebida' },
    // Tequila
    { id: 'tequila-jose-cuervo-shot', name: 'Tequila José Cuervo Especial', price: 12000, size: 'Shot 30ml', category: 'tequila', type: 'bebida' },
    { id: 'tequila-jose-cuervo-botella', name: 'Tequila José Cuervo Especial', price: 155000, size: 'Botella 750ml', category: 'tequila', type: 'bebida' },
    { id: 'tequila-olmeca-shot', name: 'Tequila Olmeca', price: 12000, size: 'Shot 30ml', category: 'tequila', type: 'bebida' },
    { id: 'tequila-olmeca-botella', name: 'Tequila Olmeca', price: 155000, size: 'Botella 750ml', category: 'tequila', type: 'bebida' },
    // Whisky
    { id: 'whisky-old-parr-shot', name: 'Whisky Old Parr / Passport Scotch / Jack Daniel\'s', price: 14000, size: 'Shot 30ml', category: 'whisky', type: 'bebida' },
    { id: 'whisky-old-parr-botella', name: 'Whisky Old Parr / Passport Scotch / Jack Daniel\'s', price: 195000, size: 'Botella 750ml', category: 'whisky', type: 'bebida' },
  ]

  const allProducts = [...productosCafeteria, ...productosBebidas]

  // Orden de categorías para cafetería
  const cafeteriaCategoryOrder = ['cafe-caliente', 'cafe-frio', 'pasteleria', 'combo']
  
  // Orden de categorías para bebidas
  const bebidasCategoryOrder = ['coctel', 'vino', 'vodka', 'ginebra', 'tequila', 'whisky']

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesType = selectedType === 'all' || product.type === selectedType
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory

      return matchesSearch && matchesType && matchesCategory
    })
  }, [searchQuery, selectedType, selectedCategory])

  // Obtener categorías únicas basadas en el tipo seleccionado, ordenadas
  const availableCategories = useMemo(() => {
    const products = selectedType === 'all' ? allProducts : 
                     selectedType === 'cafeteria' ? productosCafeteria : productosBebidas
    const categories = new Set(products.map(p => p.category))
    
    if (selectedType === 'cafeteria') {
      return cafeteriaCategoryOrder.filter(cat => categories.has(cat))
    } else if (selectedType === 'bebida') {
      return bebidasCategoryOrder.filter(cat => categories.has(cat))
    } else {
      // Cuando es 'all', combinar ambos órdenes
      return [...cafeteriaCategoryOrder, ...bebidasCategoryOrder].filter(cat => categories.has(cat))
    }
  }, [selectedType])

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

  const categoryLabels: Record<string, string> = {
    'cafe-caliente': 'Cafés Artesanales Calientes',
    'cafe-frio': 'Cafés Artesanales Fríos',
    'pasteleria': 'Pastelería y Acompañante',
    'combo': 'Combos Arándano',
    'coctel': 'Cócteles',
    'vino': 'Vinos',
    'vodka': 'Vodka',
    'ginebra': 'Ginebra',
    'tequila': 'Tequila',
    'whisky': 'Whisky',
  }

  const categoryIcons: Record<string, string> = {
    'cafe-caliente': '☕',
    'cafe-frio': '🧊',
    'pasteleria': '🍰',
    'combo': '✨',
    'coctel': '🍸',
    'vino': '🍷',
    'vodka': '🍸',
    'ginebra': '🍸',
    'tequila': '🥃',
    'whisky': '🥃',
  }

  const ProductCard = ({ product }: { product: Product }) => {
    const cartItem = cart.find((c) => c.id === product.id)
    const quantity = cartItem?.quantity || 0

    return (
      <div className="bg-white border-2 border-stone-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 hover:bg-stone-50 hover:border-berry-300 transition-all duration-300 hover:shadow-lg">
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm sm:text-base md:text-lg lg:text-xl font-bold text-berry-950 mb-1.5 sm:mb-2 md:mb-3 leading-tight break-words">
              {product.name}
            </h3>
            {product.size && (
              <p className="text-berry-600 text-xs sm:text-sm mb-1 font-medium">
                {product.size}
              </p>
            )}
            {product.description && (
              <p className="text-berry-600 text-xs sm:text-sm mb-2 sm:mb-3 leading-relaxed line-clamp-2">
                {product.description}
              </p>
            )}
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-berry-700">
              ${product.price.toLocaleString('es-CO')}
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 mt-auto">
            {quantity > 0 ? (
              <>
                <button
                  onClick={() => removeFromCart(product.id)}
                  className="flex-1 sm:flex-none w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-berry-600 hover:bg-berry-700 active:bg-berry-800 text-white rounded-lg flex items-center justify-center font-bold text-base sm:text-lg md:text-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                  aria-label="Quitar uno"
                >
                  −
                </button>
                <span className="w-10 sm:w-12 md:w-16 text-center font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-berry-950 bg-stone-100 rounded-lg py-1.5 sm:py-2">
                  {quantity}
                </span>
                <button
                  onClick={() => addToCart(product)}
                  className="flex-1 sm:flex-none w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-berry-600 hover:bg-berry-700 active:bg-berry-800 text-white rounded-lg flex items-center justify-center font-bold text-base sm:text-lg md:text-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                  aria-label="Agregar al carrito"
                >
                  +
                </button>
              </>
            ) : (
              <button
                onClick={() => addToCart(product)}
                className="w-full sm:w-auto sm:flex-1 bg-berry-600 hover:bg-berry-700 active:bg-berry-800 text-white font-semibold text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-1.5 sm:gap-2"
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

  // Agrupar productos por tipo y categoría, manteniendo el orden
  const groupedProducts = useMemo(() => {
    // Primero agrupar por tipo
    const byType: { cafeteria: Record<string, Product[]>, bebida: Record<string, Product[]> } = {
      cafeteria: {},
      bebida: {}
    }
    
    filteredProducts.forEach(product => {
      const typeGroup = product.type === 'cafeteria' ? byType.cafeteria : byType.bebida
      if (!typeGroup[product.category]) {
        typeGroup[product.category] = []
      }
      typeGroup[product.category].push(product)
    })

    // Crear estructura ordenada: primero cafetería, luego bebidas
    const orderedGroups: Array<{ type: 'cafeteria' | 'bebida', category: string, products: Product[] }> = []
    
    // Agregar categorías de cafetería en orden
    cafeteriaCategoryOrder.forEach(category => {
      if (byType.cafeteria[category] && byType.cafeteria[category].length > 0) {
        orderedGroups.push({
          type: 'cafeteria',
          category,
          products: byType.cafeteria[category]
        })
      }
    })

    // Agregar categorías de bebidas en orden
    bebidasCategoryOrder.forEach(category => {
      if (byType.bebida[category] && byType.bebida[category].length > 0) {
        orderedGroups.push({
          type: 'bebida',
          category,
          products: byType.bebida[category]
        })
      }
    })

    return orderedGroups
  }, [filteredProducts])

  return (
    <>
      <Header 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
        cartItems={cart}
        onSendWhatsAppOrder={sendWhatsAppOrder}
        onCartClick={() => setIsCartModalOpen(true)}
      />
      <main className="min-h-screen bg-stone-50">
        {/* Hero Section */}
        <Hero />

        {/* Products Section */}
        <section className="container-custom py-4 sm:py-6 md:py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {/* Filters & Products */}
              <div className="lg:col-span-3 order-2 lg:order-1">
                {/* Filters - Compact */}
                <div className="mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm text-berry-600 font-normal">Filtrar por:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { value: 'all', label: 'Todos' },
                      { value: 'cafeteria', label: 'Cafetería' },
                      { value: 'bebida', label: 'Bar' },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => {
                          setSelectedType(filter.value as any)
                          setSelectedCategory('all')
                        }}
                        className={`px-2.5 py-1 rounded text-xs sm:text-sm font-normal transition-colors duration-150 ${
                          selectedType === filter.value
                            ? 'bg-berry-600 text-white'
                            : 'bg-white text-berry-700 hover:bg-stone-50 border border-stone-300'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Clear Filters Button - Only show if filters are active */}
                  {(selectedType !== 'all' || selectedCategory !== 'all') && (
                    <button
                      onClick={() => {
                        setSelectedType('all')
                        setSelectedCategory('all')
                      }}
                      className="p-1.5 text-berry-600 hover:text-red-600 hover:bg-stone-50 rounded transition-colors"
                      aria-label="Limpiar filtros"
                      title="Limpiar filtros"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                  
                  {/* Settings Icon */}
                  <button
                    onClick={() => setIsFilterModalOpen(true)}
                    className="ml-auto p-1.5 text-berry-600 hover:text-berry-700 hover:bg-stone-50 rounded transition-colors"
                    aria-label="Configuración de filtros"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </button>
                </div>

                {/* Filter Modal */}
                {isFilterModalOpen && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsFilterModalOpen(false)}
                  >
                    <div
                      className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="sticky top-0 bg-white border-b border-stone-200 px-4 sm:px-6 py-4 flex items-center justify-between">
                        <h2 className="text-lg sm:text-xl font-bold text-berry-950">Filtros y Ordenamiento</h2>
                        <button
                          onClick={() => setIsFilterModalOpen(false)}
                          className="p-1 text-berry-600 hover:text-berry-950 hover:bg-stone-100 rounded transition-colors"
                          aria-label="Cerrar"
                        >
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
                          >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                      
                      <div className="p-4 sm:p-6 space-y-6">
                        {/* Type Filter */}
                        <div>
                          <label className="block text-sm font-semibold text-berry-950 mb-3">Tipo de Producto</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: 'all', label: 'Todos' },
                              { value: 'cafeteria', label: 'Cafetería' },
                              { value: 'bebida', label: 'Bar' },
                            ].map((filter) => (
                              <button
                                key={filter.value}
                                onClick={() => {
                                  setSelectedType(filter.value as any)
                                  setSelectedCategory('all')
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                                  selectedType === filter.value
                                    ? 'bg-berry-600 text-white'
                                    : 'bg-stone-100 text-berry-700 hover:bg-stone-200 border border-stone-300'
                                }`}
                              >
                                {filter.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Category Filter */}
                        {availableCategories.length > 0 && (
                          <div>
                            <label className="block text-sm font-semibold text-berry-950 mb-3">Categoría</label>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                                  selectedCategory === 'all'
                                    ? 'bg-berry-600 text-white'
                                    : 'bg-stone-100 text-berry-700 hover:bg-stone-200 border border-stone-300'
                                }`}
                              >
                                Todas las categorías
                              </button>
                              {availableCategories.map((category) => (
                                <button
                                  key={category}
                                  onClick={() => setSelectedCategory(category)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                                    selectedCategory === category
                                      ? 'bg-berry-600 text-white'
                                      : 'bg-stone-100 text-berry-700 hover:bg-stone-200 border border-stone-300'
                                  }`}
                                >
                                  {categoryLabels[category] || category}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Results Count */}
                        {filteredProducts.length > 0 && (
                          <div className="pt-4 border-t border-stone-200">
                            <p className="text-sm text-berry-600">
                              Mostrando <strong className="text-berry-950">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'producto' : 'productos'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="sticky bottom-0 bg-white border-t border-stone-200 px-4 sm:px-6 py-4 flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setSelectedType('all')
                            setSelectedCategory('all')
                          }}
                          className="px-4 py-2 text-sm font-medium text-berry-700 hover:text-berry-950 hover:bg-stone-50 rounded-lg transition-colors"
                        >
                          Limpiar filtros
                        </button>
                        <button
                          onClick={() => setIsFilterModalOpen(false)}
                          className="px-4 py-2 bg-berry-600 text-white text-sm font-medium rounded-lg hover:bg-berry-700 transition-colors"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products List */}
                {filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-xl p-12 text-center border border-stone-200">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-berry-600 text-lg font-semibold">No se encontraron productos</p>
                    <p className="text-berry-500 text-sm mt-2">Intenta cambiar los filtros o el término de búsqueda</p>
                  </div>
                ) : (
                  <div className="space-y-10 sm:space-y-12 md:space-y-16">
                    {groupedProducts.map((group, index) => {
                      // Agregar separador visual entre cafetería y bebidas cuando se muestran todos
                      const showSeparator = selectedType === 'all' && 
                                           index > 0 && 
                                           group.type === 'bebida' && 
                                           groupedProducts[index - 1].type === 'cafeteria'
                      
                      return (
                        <div key={`${group.type}-${group.category}`}>
                          {showSeparator && (
                            <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-16 pt-6 sm:pt-8 md:pt-10 lg:pt-12 border-t-2 border-stone-300">
                              <div className="flex items-center justify-center mb-6 sm:mb-8 md:mb-10">
                                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                                  <div className="w-8 sm:w-12 md:w-16 h-0.5 bg-gradient-to-r from-transparent to-berry-300"></div>
                                  <div className="text-xl sm:text-2xl">🍹</div>
                                  <div className="w-12 sm:w-16 md:w-24 h-0.5 bg-gradient-to-r from-berry-300 via-berry-600 to-berry-300"></div>
                                  <div className="text-xl sm:text-2xl">🍷</div>
                                  <div className="w-8 sm:w-12 md:w-16 h-0.5 bg-gradient-to-l from-transparent to-berry-300"></div>
                                </div>
                              </div>
                              <h2 className="text-center font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-berry-950 mb-6 sm:mb-8">
                                Bebidas
                              </h2>
                            </div>
                          )}
                          <section>
                            <h3 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-berry-950 mb-3 sm:mb-4 md:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3">
                              <span className="text-xl sm:text-2xl md:text-3xl flex-shrink-0">{categoryIcons[group.category] || '•'}</span>
                              <span className="break-words">{categoryLabels[group.category] || group.category}</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                              {group.products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                              ))}
                            </div>
                          </section>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Note for Cafeteria */}
                {selectedType === 'all' || selectedType === 'cafeteria' ? (
                  <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-6 mt-8 sm:mt-12">
                    <p className="text-center text-berry-700 text-sm sm:text-base">
                      <strong className="text-berry-950">Nota:</strong> Todos nuestros productos son elaborados de manera artesanal.
                      La disponibilidad puede variar según el día.
                    </p>
                  </div>
                ) : null}

                {/* Legal Notice for Bebidas */}
                {(selectedType === 'all' || selectedType === 'bebida') && filteredProducts.some(p => p.type === 'bebida') && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 sm:p-6 mt-8 sm:mt-12">
                    <p className="text-amber-800 text-xs sm:text-sm md:text-base text-center font-medium">
                      <strong>Importante:</strong> Prohibida la venta de bebidas alcohólicas a menores de edad.
                      Se solicita documento de identidad al momento de la entrega.
                    </p>
                  </div>
                )}
              </div>

              {/* Cart - Hidden on mobile, shown on desktop */}
              <div className="hidden lg:block lg:col-span-1 order-1 lg:order-2">
                <div className={`lg:sticky lg:top-24 xl:top-28 bg-white border-2 ${getTotalItems() > 0 ? 'border-berry-400' : 'border-stone-200'} rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg lg:shadow-xl transition-all duration-300`}>
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
                                  onClick={() => addToCart(item)}
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
        </section>

        {/* How It Works */}
        <HowItWorks />

        {/* Location & Schedule */}
        <LocationSchedule />
      </main>
      <Footer />
      <FloatingWhatsApp />

      {/* Cart Modal - Mobile Only */}
      {isCartModalOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={() => setIsCartModalOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-stone-200 px-4 py-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-berry-950 flex items-center gap-2">
                <CartIcon count={getTotalItems()} />
                <span>Carrito</span>
              </h3>
              <button
                onClick={() => setIsCartModalOpen(false)}
                className="p-2 text-berry-600 hover:text-berry-950 hover:bg-stone-100 rounded transition-colors"
                aria-label="Cerrar"
              >
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
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🛒</div>
                  <p className="text-berry-600 text-base">
                    Tu carrito está vacío
                  </p>
                  <p className="text-berry-500 text-sm mt-2">
                    Agrega productos para comenzar
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-stone-50 border border-stone-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-semibold text-berry-950 text-sm">
                              {item.name}
                            </p>
                            {item.size && (
                              <p className="text-berry-600 text-xs mt-1">
                                {item.size}
                              </p>
                            )}
                            <p className="text-berry-600 text-xs mt-1">
                              ${item.price.toLocaleString('es-CO')} c/u
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const newCart = cart.filter((i) => i.id !== item.id)
                              setCart(newCart)
                            }}
                            className="text-berry-600 hover:text-red-600 ml-2 flex-shrink-0 transition-colors text-xl"
                            aria-label="Eliminar"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 bg-stone-200 hover:bg-stone-300 rounded-lg flex items-center justify-center text-base font-bold transition-all duration-200 hover:scale-110 active:scale-95"
                            >
                              −
                            </button>
                            <span className="w-10 text-center font-bold text-base bg-white border border-stone-300 rounded-lg py-1">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-8 h-8 bg-berry-600 hover:bg-berry-700 text-white rounded-lg flex items-center justify-center text-base font-bold transition-all duration-200 hover:scale-110 active:scale-95"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-bold text-berry-700 text-base ml-2">
                            ${(item.price * item.quantity).toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-stone-300 pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xl text-berry-950">Total:</span>
                      <span className="font-bold text-2xl text-berry-700">
                        ${getTotal().toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {getTotalItems() > 0 && (
                      <button
                        onClick={() => {
                          clearCart()
                          setIsCartModalOpen(false)
                        }}
                        className="flex-1 px-4 py-3 text-sm font-medium text-berry-700 hover:text-berry-950 hover:bg-stone-50 rounded-lg transition-colors border border-stone-300"
                      >
                        Limpiar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        sendWhatsAppOrder()
                        setIsCartModalOpen(false)
                      }}
                      disabled={cart.length === 0}
                      className="flex-1 bg-[#25D366] hover:bg-[#20BA5A] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold text-base px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <WhatsAppIcon size={20} className="text-white" />
                      <span>Enviar pedido</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

