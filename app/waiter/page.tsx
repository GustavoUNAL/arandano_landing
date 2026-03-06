'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

const PLANTA_LAYOUT_KEY = 'waiter-planta-layout'

const defaultPlantaLayout = {
  bar: { top: 6, left: 8, width: 84 },
  mesa1: { top: 42, left: 12 },
  mesa2: { top: 42, left: 60 }
}

interface Product {
  id: string
  name: string
  price: number
  description?: string
  category: string
  type: 'cafeteria' | 'bebida'
  totalSold?: number
  size?: string
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
  mesa?: string
}

const MESAS_OPCIONES_DEFAULT = [
  'Mesa circular 1',
  'Mesa circular 2',
  'Barra',
  'Otro'
]

const MESAS_STORAGE_KEY = 'waiter-mesas-order-v2'
const CUENTAS_MESAS_STORAGE_KEY = 'waiter-cuentas-mesas'

interface CuentaMesa {
  items: CartItem[]
  comment: string
}

/** Parsea fecha de venta como fecha local (YYYY-MM-DD + hour) para que coincida con el calendario. */
function parseSaleDateLocal (dateStr: string, hour: number = 0): Date {
  const s = (dateStr || '').split('T')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d, hour, 0, 0, 0)
  }
  const d = new Date(dateStr)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, d.getHours(), d.getMinutes(), 0)
}

function iconoMesa (mesa: string): string {
  if (mesa === 'Otro') return '✏️ '
  if (mesa === 'Barra') return '🍸 '
  if (mesa.startsWith('Mesa circular')) return '⭕ '
  return '🪑 '
}

function loadMesasOrden(): string[] {
  if (typeof window === 'undefined') return [...MESAS_OPCIONES_DEFAULT]
  try {
    const saved = localStorage.getItem(MESAS_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as string[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (_) {}
  return [...MESAS_OPCIONES_DEFAULT]
}

function WaiterLayout ({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-stone-50">{children}</div>
}

/** Barra de búsqueda que mantiene su propio estado para no perder el texto al re-renderizar el padre. */
function ProductSearchInput({
  categoryKey,
  onSearchChange,
  resultCount,
  showCount
}: {
  categoryKey: string
  onSearchChange: (value: string) => void
  resultCount: number
  showCount: boolean
}) {
  const [value, setValue] = useState('')
  useEffect(() => {
    setValue('')
  }, [categoryKey])
  return (
    <div className="mb-3">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value
          setValue(v)
          onSearchChange(v)
        }}
        placeholder="Buscar producto..."
        className="w-full px-3 py-2 border-2 border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-arandano-500 focus:border-arandano-500 placeholder-stone-400"
      />
      {showCount && (
        <p className="text-xs text-stone-500 mt-1">
          {resultCount} {resultCount === 1 ? 'producto' : 'productos'}
        </p>
      )}
    </div>
  )
}

const CIGARETTES_PRODUCTS: Product[] = [
  {
    id: 'cig-marlboro-rojo',
    name: 'Marlboro Rojo',
    price: 1000,
    description: 'Cigarrillo Marlboro rojo',
    category: 'cigarrillos',
    type: 'bebida'
  },
  {
    id: 'cig-marlboro-sandia',
    name: 'Marlboro Sandía',
    price: 1000,
    description: 'Cigarrillo Marlboro sabor sandía',
    category: 'cigarrillos',
    type: 'bebida'
  },
  {
    id: 'cig-marlboro-morado',
    name: 'Marlboro Morado',
    price: 1000,
    description: 'Cigarrillo Marlboro morado',
    category: 'cigarrillos',
    type: 'bebida'
  }
]

const buildMediaBottleProducts = (products: Product[]): Product[] => {
  const medias: Product[] = []

  const amarillos = products.filter(
    (p) =>
      p.type === 'bebida' &&
      p.category === 'aguardiente' &&
      p.name.toLowerCase().includes('amarillo') &&
      (p.size?.toLowerCase().includes('750') || p.size?.toLowerCase().includes('botella'))
  )
  const narinos = products.filter(
    (p) =>
      p.type === 'bebida' &&
      p.category === 'aguardiente' &&
      p.name.toLowerCase().includes('nariño') &&
      (p.size?.toLowerCase().includes('750') || p.size?.toLowerCase().includes('botella'))
  )
  const rones = products.filter(
    (p) =>
      p.type === 'bebida' &&
      p.category === 'ron' &&
      (p.size?.toLowerCase().includes('750') || p.size?.toLowerCase().includes('botella'))
  )

  const pickCheapest = (arr: Product[]): Product | undefined =>
    arr.length ? arr.reduce((min, p) => (p.price < min.price ? p : min), arr[0]) : undefined

  const fullAmarillo = pickCheapest(amarillos)
  if (fullAmarillo) {
    medias.push({
      ...fullAmarillo,
      id: 'media-aguardiente-amarillo',
      name: 'Media Aguardiente Amarillo',
      price: Math.round(fullAmarillo.price / 2),
      size: '1/2 botella'
    })
  }

  const fullNarino = pickCheapest(narinos)
  if (fullNarino) {
    medias.push({
      ...fullNarino,
      id: 'media-aguardiente-narino',
      name: 'Media Aguardiente Nariño',
      price: Math.round(fullNarino.price / 2),
      size: '1/2 botella'
    })
  }

  const fullRon = pickCheapest(rones)
  if (fullRon) {
    medias.push({
      ...fullRon,
      id: 'media-ron',
      name: 'Media Botella Ron',
      price: Math.round(fullRon.price / 2),
      size: '1/2 botella'
    })
  }

  return medias
}

const AROMATICA_PRODUCT: Product = {
  id: 'prod-aromatica',
  name: 'Aromática',
  price: 4000,
  description: 'Aromática',
  category: 'cafe-caliente',
  type: 'cafeteria'
}

const ACCOMPANIMENT_EXTRAS: Product[] = [
  { id: 'prod-suspiros', name: 'Suspiros', price: 1000, description: 'Suspiros', category: 'pasteleria', type: 'cafeteria' },
  { id: 'prod-galletas-especiales', name: 'Galletas especiales', price: 2000, description: 'Galletas especiales', category: 'pasteleria', type: 'cafeteria' }
]

const CATEGORIES = [
  { id: 'todos', name: 'Todos los productos', filter: (_p: Product) => true },
  { id: 'cafes', name: 'Cafés', filter: (p: Product) => p.type === 'cafeteria' && (p.category === 'cafe-caliente' || p.category === 'cafe-frio') },
  { id: 'cocteles', name: 'Cócteles', filter: (p: Product) => p.type === 'bebida' && p.category === 'coctel' },
  { id: 'acompanantes', name: 'Acompañantes', filter: (p: Product) => p.type === 'cafeteria' && p.category === 'pasteleria' },
  { id: 'cervezas', name: 'Cervezas', filter: (p: Product) => p.type === 'bebida' && p.category === 'cerveza' },
  { id: 'bebidas', name: 'Bebidas', filter: (p: Product) => p.type === 'bebida' },
  { id: 'shots', name: 'Shots', filter: (p: Product) => p.type === 'bebida' && (p.size?.toLowerCase().includes('shot') || p.size?.toLowerCase().includes('30ml') || p.name?.toLowerCase().includes('shot')) },
  { id: 'cigarrillos', name: 'Cigarrillos', filter: (p: Product) => p.category === 'cigarrillos' || p.id.startsWith('cig-') }
]

export default function WaiterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
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
  const [debtName, setDebtName] = useState<string>('')
  const [showDebtForm, setShowDebtForm] = useState(false)
  /** Mesa elegida para el cobro. Se selecciona desde un modal; la lista de precios se muestra siempre primero. */
  const [mesaElegida, setMesaElegida] = useState<string>('')
  const [mesaOtro, setMesaOtro] = useState<string>('')
  const [showMesaOtroInput, setShowMesaOtroInput] = useState(false)
  const [showMesaSelectorModal, setShowMesaSelectorModal] = useState(false)
  /** Orden de las mesas (como están ubicadas). Cargado desde localStorage. */
  const [mesasOrden, setMesasOrden] = useState<string[]>(MESAS_OPCIONES_DEFAULT)
  /** Cuentas por mesa: items y comentario que se van sumando. Persistido en localStorage. */
  const [cuentasPorMesa, setCuentasPorMesa] = useState<Record<string, CuentaMesa>>({})
  const [loading, setLoading] = useState(true)
  /** Posiciones en % en la vista planta (barra y mesas). Arrastrables. */
  const [plantaLayout, setPlantaLayout] = useState<typeof defaultPlantaLayout>(defaultPlantaLayout)
  const [plantaDragging, setPlantaDragging] = useState<string | null>(null)
  const plantaDragStart = useRef<{ id: string; startX: number; startY: number; startLeft: number; startTop: number; startWidth?: number } | null>(null)
  const plantaContainerRef = useRef<HTMLDivElement>(null)
  const plantaLayoutRef = useRef(plantaLayout)
  const plantaDidDragRef = useRef(false)
  plantaLayoutRef.current = plantaLayout

  // Cargar orden de mesas y layout planta desde localStorage al montar (client)
  useEffect(() => {
    setMesasOrden(loadMesasOrden())
    try {
      const saved = typeof window !== 'undefined' && localStorage.getItem(PLANTA_LAYOUT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as typeof defaultPlantaLayout
        if (parsed.bar && parsed.mesa1 && parsed.mesa2) setPlantaLayout(parsed)
      }
    } catch (_) {}
  }, [])

  // Si se llega con ?date=YYYY-MM-DD (ej. desde Ventas "Agregar venta este día"), prellenar fecha de cobro
  useEffect(() => {
    const dateParam = searchParams.get('date')
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setPaymentDate(`${dateParam}T12:00`)
    }
  }, [searchParams])

  const savePlantaLayout = useCallback((layout: typeof defaultPlantaLayout) => {
    try {
      localStorage.setItem(PLANTA_LAYOUT_KEY, JSON.stringify(layout))
    } catch (_) {}
  }, [])

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

  const handlePlantaPointerDown = useCallback((e: React.PointerEvent, id: 'bar' | 'mesa1' | 'mesa2') => {
    e.preventDefault()
    plantaDidDragRef.current = false
    const el = id === 'bar' ? plantaLayout.bar : id === 'mesa1' ? plantaLayout.mesa1 : plantaLayout.mesa2
    const startLeft = 'width' in el ? el.left : el.left
    const startTop = 'width' in el ? el.top : el.top
    const startWidth = 'width' in el && typeof el.width === 'number' ? el.width : undefined
    plantaDragStart.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      startLeft,
      startTop,
      ...(startWidth !== undefined && { startWidth })
    }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [plantaLayout])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const ref = plantaContainerRef.current
      const start = plantaDragStart.current
      if (!ref || !start) return
      const rect = ref.getBoundingClientRect()
      const dx = ((e.clientX - start.startX) / rect.width) * 100
      const dy = ((e.clientY - start.startY) / rect.height) * 100
      plantaDidDragRef.current = true
      setPlantaDragging(start.id)
      setPlantaLayout(prev => {
        const next = { ...prev }
        if (start.id === 'bar') {
          const w = start.startWidth ?? prev.bar.width
          next.bar = {
            ...prev.bar,
            left: clamp(start.startLeft + dx, 0, 100 - w),
            top: clamp(start.startTop + dy, 0, 82)
          }
        } else if (start.id === 'mesa1') {
          next.mesa1 = {
            left: clamp(start.startLeft + dx, 0, 72),
            top: clamp(start.startTop + dy, 0, 72)
          }
        } else if (start.id === 'mesa2') {
          next.mesa2 = {
            left: clamp(start.startLeft + dx, 0, 72),
            top: clamp(start.startTop + dy, 0, 72)
          }
        }
        plantaLayoutRef.current = next
        return next
      })
    }
    const onUp = () => {
      if (plantaDragStart.current) {
        savePlantaLayout(plantaLayoutRef.current)
        plantaDragStart.current = null
      }
      setPlantaDragging(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [savePlantaLayout])

  const [processing, setProcessing] = useState(false)
  const [totalSalesCount, setTotalSalesCount] = useState<number>(0)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showSaleDetail, setShowSaleDetail] = useState(false)
  const [paymentAction, setPaymentAction] = useState<'pay' | 'add'>('pay')
  const [showFloatingCart, setShowFloatingCart] = useState(true)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [editSaleDateTime, setEditSaleDateTime] = useState<string>('')
  const [editSaleComment, setEditSaleComment] = useState<string>('')
  const [editSaleItems, setEditSaleItems] = useState<Sale['items']>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState<string>('')
  const gridProductSearchRef = useRef<string>('')
  const [gridSearchTrigger, setGridSearchTrigger] = useState(0)
  const [showProductSelector, setShowProductSelector] = useState(false)
  /** Por producto: cuántas unidades se pagan en este cobro (por defecto todas). */
  const [paymentSelection, setPaymentSelection] = useState<Record<string, number>>({})

  useEffect(() => {
    gridProductSearchRef.current = ''
    setGridSearchTrigger((n) => n + 1)
  }, [selectedCategory])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const allProducts = await response.json()
        setProducts(allProducts)
        setAvailableProducts(allProducts)
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
    loadRecentSales()
    try {
      const saved = typeof window !== 'undefined' && localStorage.getItem(CUENTAS_MESAS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, CuentaMesa>
        if (parsed && typeof parsed === 'object') setCuentasPorMesa(parsed)
      }
    } catch (_) {}
  }, [])

  const selectMesa = useCallback((mesa: string) => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(CUENTAS_MESAS_STORAGE_KEY) : null
      const parsed = raw ? (JSON.parse(raw) as Record<string, CuentaMesa>) : {}
      const cuenta = parsed[mesa]
      setCart(cuenta?.items ?? [])
      setOrderComment(cuenta?.comment ?? '')
    } catch (_) {
      setCart([])
      setOrderComment('')
    }
    setMesaElegida(mesa)
  }, [])

  useEffect(() => {
    if (!mesaElegida) return
    setCuentasPorMesa((prev) => {
      const next = { ...prev, [mesaElegida]: { items: cart, comment: orderComment } }
      try {
        localStorage.setItem(CUENTAS_MESAS_STORAGE_KEY, JSON.stringify(next))
      } catch (_) {}
      return next
    })
  }, [mesaElegida, cart, orderComment])

  const loadRecentSales = async () => {
    try {
      const response = await fetch(`/api/sales?t=${Date.now()}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) {
        console.error('[Waiter] Error al cargar ventas:', data?.message || data?.error)
        return
      }
      const sales = Array.isArray(data) ? data : []
      setTotalSalesCount(sales.length)
    } catch (error) {
      console.error('Error loading sales:', error)
    }
  }

  const allProductsList = useMemo(() => {
    const list: Product[] = [
      ...products,
      ...CIGARETTES_PRODUCTS,
      ...buildMediaBottleProducts(products),
      AROMATICA_PRODUCT,
      ...ACCOMPANIMENT_EXTRAS
    ]
    const byId = new Map<string, Product>()
    list.forEach((p) => {
      if (!byId.has(p.id)) byId.set(p.id, p)
    })
    return Array.from(byId.values()).sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
  }, [products])

  const categoryFilter = CATEGORIES.find(c => c.id === selectedCategory)?.filter || (() => true)
  const filteredByCategory =
    selectedCategory === 'todos' ? allProductsList : allProductsList.filter(categoryFilter)

  const filteredProducts = filteredByCategory
  const searchTerm = (gridProductSearchRef.current || '').trim().toLowerCase()
  const baseDisplayed = searchTerm
    ? filteredProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm) ||
          (p.description?.toLowerCase().includes(searchTerm) ?? false)
      )
    : filteredProducts
  const aromaticMatchesSearch =
    searchTerm &&
    (AROMATICA_PRODUCT.name.toLowerCase().includes(searchTerm) ||
      (AROMATICA_PRODUCT.description?.toLowerCase().includes(searchTerm) ?? false))
  const displayedProducts =
    aromaticMatchesSearch && !baseDisplayed.some((p) => p.id === AROMATICA_PRODUCT.id)
      ? [AROMATICA_PRODUCT, ...baseDisplayed]
      : baseDisplayed

  const addToCart = (product: Product) => {
    const wasEmpty = cart.length === 0
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
    // Si era el primer producto agregado, asegurar que el carrito flotante esté visible
    if (wasEmpty) {
      setShowFloatingCart(true)
    }
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

  const getSelectedSubtotal = () => {
    return cart.reduce((total, item) => total + (paymentSelection[item.id] ?? 0) * item.price, 0)
  }

  const getSelectedDiscountAmount = () => {
    if (!discount) return 0
    const discountValue = parseFloat(discount) || 0
    const sub = getSelectedSubtotal()
    if (discountType === 'percentage') return (sub * discountValue) / 100
    return discountValue
  }

  const getSelectedTotal = () => {
    return Math.max(0, getSelectedSubtotal() - getSelectedDiscountAmount())
  }

  const getPendingAfterThisPayment = () => {
    const totalCuenta = getTotal()
    const totalQueSeCobraAhora = getSelectedTotal()
    return Math.max(0, totalCuenta - totalQueSeCobraAhora)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const calculateChange = () => {
    const total = showPaymentModal ? getSelectedTotal() : getTotal()
    const paid = parseFloat(amountPaid) || 0
    return Math.max(0, paid - total)
  }

  const handlePayment = async () => {
    const itemsToPay = cart.filter((item) => (paymentSelection[item.id] ?? 0) > 0)
    if (itemsToPay.length === 0) return

    const total = getSelectedTotal()
    const paid = parseFloat(amountPaid) || 0
    const isPartialCash = paymentMethod === 'efectivo' && paid < total

    setProcessing(true)

    try {
      const saleDate = new Date(paymentDate)
      const dateOnly = paymentDate.slice(0, 10)
      const saleHour = saleDate.getHours()

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToPay.map((item) => ({
            productId: item.id,
            productName: item.name,
            quantity: paymentSelection[item.id] ?? 0,
            unitPrice: item.price
          })),
          total,
          subtotal: getSelectedSubtotal(),
          discount: getSelectedDiscountAmount(),
          discountType: discount ? discountType : undefined,
          discountValue: discount ? parseFloat(discount) : undefined,
          comment: (() => {
            if (isPartialCash) {
              const base = orderComment ? `${orderComment} ` : ''
              const deuda = total - paid
              const nombre = debtName?.trim()
              const nombreTexto = nombre ? ` a nombre de ${nombre}` : ''
              return `${base}[APORTE] Pagó $${formatPrice(paid)} de $${formatPrice(total)} (deuda $${formatPrice(
                deuda
              )}${nombreTexto})`
            }
            return orderComment || undefined
          })(),
          channel: 'presencial',
          paymentMethod: isPartialCash ? 'efectivo-aporte' : paymentMethod,
          date: dateOnly,
          hour: saleHour,
          mesa: mesaElegida || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCart((prev) =>
          prev
            .map((item) => ({
              ...item,
              quantity: item.quantity - (paymentSelection[item.id] ?? 0)
            }))
            .filter((item) => item.quantity > 0)
        )
        setPaymentSelection({})
        setAmountPaid('')
        setPaymentMethod('efectivo')
        setDiscount('')
        setDiscountType('percentage')
        setPaymentAction('pay')
        setDebtName('')
        setShowDebtForm(false)
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        setPaymentDate(`${year}-${month}-${day}T${hours}:${minutes}`)
        setShowPaymentModal(false)
        await loadRecentSales()
        if (data.warnings && data.warnings.length > 0) {
          console.warn('Advertencias al crear venta:', data.warnings)
        }
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
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

  const handleUpdateSale = async () => {
    if (!editingSale) return

    try {
      setProcessing(true)
      
      // datetime-local es "YYYY-MM-DDTHH:mm" (hora local) — enviar fecha como YYYY-MM-DD y hora por separado
      const dateOnly = editSaleDateTime.slice(0, 10)
      const newDate = new Date(editSaleDateTime)
      const hour = newDate.getHours()

      // Calcular el total basado en los items editados
      const newTotal = editSaleItems.reduce((sum, item) => sum + item.totalPrice, 0)

      const response = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dateOnly,
          hour: hour,
          items: editSaleItems,
          total: newTotal,
          paymentMethod: editingSale.paymentMethod,
          channel: editingSale.channel,
          comment: editSaleComment || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[handleUpdateSale] Error del servidor:', error)
        throw new Error(error.error || error.details || 'Error al actualizar la venta')
      }

      const updatedSale = await response.json()

      // Recargar ventas y actualizar la venta seleccionada para que el detalle muestre la nueva fecha
      await loadRecentSales()
      setSelectedSale(updatedSale)
      setShowSaleDetail(true)

      // Cerrar modal de edición
      setEditingSale(null)
      setEditSaleDateTime('')
      setEditSaleComment('')
      setEditSaleItems([])
      setShowProductSelector(false)
      setProductSearch('')
      
      alert('Venta actualizada correctamente')
    } catch (error: any) {
      console.error('[handleUpdateSale] Error completo:', error)
      console.error('[handleUpdateSale] Stack:', error.stack)
      const errorMessage = error.message || 'Error desconocido al actualizar la venta'
      alert(`Error al actualizar la venta: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  const addProductToSale = (product: Product) => {
    const existingItem = editSaleItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      // Si ya existe, aumentar cantidad
      setEditSaleItems(editSaleItems.map(item =>
        item.productId === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              totalPrice: (item.quantity + 1) * item.unitPrice
            }
          : item
      ))
    } else {
      // Agregar nuevo producto
      setEditSaleItems([
        ...editSaleItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          totalPrice: product.price
        }
      ])
    }
    setProductSearch('')
  }

  const removeProductFromSale = (productId: string) => {
    setEditSaleItems(editSaleItems.filter(item => item.productId !== productId))
  }

  const updateProductQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProductFromSale(productId)
      return
    }
    
    setEditSaleItems(editSaleItems.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice
          }
        : item
    ))
  }

  const filteredAvailableProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const getEditTotal = () => {
    return editSaleItems.reduce((sum, item) => sum + item.totalPrice, 0)
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

  let content: JSX.Element
  if (loading) {
    content = (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-arandano-600 text-xl">Cargando...</div>
      </div>
    )
  } else {
    content = (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <WaiterLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-end">
            <button
              onClick={() => router.push('/sales')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-arandano-600 hover:bg-arandano-50 transition-colors"
              title="Ver ventas en calendario"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Ver Ventas ({totalSalesCount})</span>
            </button>
          </div>
          {/* Título y lista primero; mesa como selector secundario */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-arandano-950 mb-1">Sistema de Cobros</h1>
              <p className="text-sm text-stone-600">Lista de precios — agrega productos y elige mesa antes de cobrar</p>
            </div>
            <div className="flex flex-row justify-center sm:justify-end gap-2 flex-wrap items-center">
              <button
                onClick={() => setShowMesaSelectorModal(true)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  mesaElegida
                    ? 'bg-arandano-100 text-arandano-800 border border-arandano-300 hover:bg-arandano-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                }`}
              >
                <span>{mesaElegida ? iconoMesa(mesaElegida) : '🪑'}</span>
                <span>{mesaElegida || 'Seleccionar mesa'}</span>
                <span>▼</span>
              </button>
              <button
                onClick={() => setShowCategoriesModal(true)}
                className="px-5 py-2.5 bg-arandano-600 hover:bg-arandano-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <span>📂</span>
                <span>{CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Categorías'}</span>
                <span>▼</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notificación: cantidad de productos seleccionados */}
        {cart.length > 0 && (
          <div className="mx-4 mt-2 mb-1 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-arandano-600 text-white text-sm font-semibold shadow-md">
              <span>🛒</span>
              <span>
                {cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'producto' : 'productos'} en la cuenta
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Panel de Productos - Ahora ocupa todo el ancho */}
          <div>

            {/* Lista de productos */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
              <h2 className="text-lg font-semibold text-arandano-950 mb-2 text-center">
                {CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </h2>
              <ProductSearchInput
                categoryKey={selectedCategory}
                onSearchChange={(v) => {
                  gridProductSearchRef.current = v
                  setGridSearchTrigger((n) => n + 1)
                }}
                resultCount={displayedProducts.length}
                showCount={searchTerm.length > 0}
              />
              <div className="grid grid-cols-2 gap-3">
                {displayedProducts.map((product) => {
                  const cartItem = cart.find((item) => item.id === product.id)
                  const quantity = cartItem?.quantity || 0

                  return (
                    <div
                      key={product.id}
                      className={`p-3 border-2 rounded-lg transition-all flex flex-col ${
                        product.totalSold && product.totalSold > 0
                          ? 'border-arandano-300 bg-arandano-50 hover:border-arandano-400 hover:bg-arandano-100'
                          : 'border-stone-200 hover:border-arandano-400 hover:bg-arandano-50'
                      }`}
                    >
                      {/* Nombre del producto */}
                      <div className="mb-2">
                        <h3 className="font-semibold text-arandano-950 text-sm leading-tight mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        {product.totalSold && product.totalSold > 0 && (
                          <div className="text-xs text-arandano-600 font-medium mb-1">
                            ⭐ {product.totalSold} vendidos
                          </div>
                        )}
                      </div>

                      {/* Precio destacado */}
                      <div className="mb-2">
                        <div className="text-arandano-600 font-bold text-lg">
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
                              className="w-8 h-8 flex items-center justify-center bg-arandano-600 hover:bg-arandano-700 active:bg-arandano-800 text-white rounded font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95"
                              aria-label="Quitar uno"
                            >
                              −
                            </button>
                            <span className="flex-1 text-center font-bold text-base text-arandano-950 bg-stone-100 rounded py-1.5">
                              {quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                addToCart(product)
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-arandano-600 hover:bg-arandano-700 active:bg-arandano-800 text-white rounded font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95"
                              aria-label="Agregar uno"
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="w-full py-2 bg-arandano-600 hover:bg-arandano-700 active:bg-arandano-800 text-white font-medium text-sm rounded transition-all duration-200 hover:scale-105 active:scale-95"
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
        {cart.length > 0 && !showFloatingCart ? (
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
              onClick={() => setShowFloatingCart(true)}
              className="fixed bottom-24 right-6 cart-float w-14 h-14 bg-[rgb(47,77,107)] hover:bg-arandano-700 text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-200 z-40"
              aria-label="Ver carrito"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
            </button>
          </>
        ) : cart.length > 0 ? (
          <div className={`fixed bottom-8 sm:bottom-4 left-0 right-0 sm:left-auto sm:right-4 ${showPaymentModal ? 'z-30' : 'z-40'}`}>
            <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl border-t-2 sm:border-2 border-stone-200 w-full sm:max-w-md sm:w-[28rem]">
              {/* Header del carrito */}
              <div className="flex justify-between items-center p-3 sm:p-4 border-b border-stone-200 bg-arandano-50 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[rgb(47,77,107)] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                  <h2 className="text-lg font-bold text-arandano-950">Carrito</h2>
                </div>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-lg hover:scale-110 transition-transform active:scale-95"
                      title="Limpiar carrito"
                      aria-label="Limpiar carrito"
                    >
                      🗑️
                    </button>
                  )}
                  <button
                    onClick={() => setShowFloatingCart(false)}
                    className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                    aria-label="Minimizar"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {showFloatingCart && (
                <>
                  {/* Items del carrito: solo esta parte hace scroll */}
                  <div className="max-h-[40vh] sm:max-h-[36vh] overflow-y-auto overscroll-contain">
                    <div className="p-3 sm:p-4 space-y-2">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 bg-stone-50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-arandano-950 truncate">
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
                              className="w-7 h-7 flex items-center justify-center bg-[rgb(47,77,107)] text-white rounded hover:bg-arandano-700 text-sm font-bold"
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
                  </div>

                  {/* Comentario / detalles de la mesa: fuera del scroll para escribir sin problemas */}
                  <div
                    className="px-3 sm:px-4 py-3 border-t border-stone-200 bg-amber-50/50 flex-shrink-0"
                  >
                    <label htmlFor="waiter-order-comment" className="block text-sm font-semibold text-arandano-950 mb-1.5">
                      Detalles o comentario de la mesa (opcional)
                    </label>
                    <textarea
                      id="waiter-order-comment"
                      defaultValue={orderComment}
                      onBlur={(e) => {
                        setOrderComment(e.target.value)
                      }}
                      placeholder="Ej: Sin hielo, nombre del cliente, instrucciones..."
                      rows={3}
                      className="w-full px-3 py-2.5 border-2 border-stone-300 rounded-lg text-sm text-stone-900 bg-white focus:ring-2 focus:ring-arandano-500 focus:border-arandano-500 focus:outline-none resize-y min-h-[4.5rem] touch-manipulation"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </div>

                  {/* Resumen de precios */}
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-3 sm:pt-4 border-t border-stone-200 bg-stone-50">
                    <div className="space-y-2 mb-3 sm:mb-4">
                      <div className="flex justify-between text-xs sm:text-sm text-stone-600">
                        <span>Subtotal:</span>
                        <span>${formatPrice(getSubtotal())}</span>
                      </div>
                      {discount && (
                        <div className="flex justify-between text-xs sm:text-sm text-red-600">
                          <span className="text-[10px] sm:text-xs">
                            Descuento ({discountType === 'percentage' ? `${discount}%` : 'Monto'}):
                          </span>
                          <span>-${formatPrice(getDiscountAmount())}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                        <span className="text-sm sm:text-base font-semibold text-arandano-950">Total:</span>
                        <span className="text-lg sm:text-xl font-bold text-arandano-600">
                          ${formatPrice(getTotal())}
                        </span>
                      </div>
                    </div>

                    {/* Botón de cobrar */}
                    <button
                      onClick={() => {
                        setPaymentSelection(cart.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.id]: item.quantity }), {}))
                        setDebtName('')
                        setShowDebtForm(false)
                        setShowPaymentModal(true)
                      }}
                      className="w-full bg-[rgb(47,77,107)] hover:bg-arandano-700 text-white font-semibold py-3 sm:py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      💳 Cobrar ${formatPrice(getTotal())}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal de categorías */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-arandano-950">Filtrar por categoría</h3>
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
                      ? 'bg-arandano-600 text-white'
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

      {/* Modal selección de mesa */}
      {showMesaSelectorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full my-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-arandano-950">Seleccionar mesa</h3>
              <button
                onClick={() => { setShowMesaSelectorModal(false); setShowMesaOtroInput(false); setMesaOtro('') }}
                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-100 rounded-lg"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            {!showMesaOtroInput ? (
              <>
                <p className="text-stone-600 text-sm mb-3">Toca una zona o arrastra para mover</p>
                <div
                  ref={plantaContainerRef}
                  className="relative w-full aspect-[3/4] min-h-[280px] bg-stone-100 rounded-xl border-2 border-stone-300 overflow-hidden select-none touch-none"
                >
                  <button
                    type="button"
                    onPointerDown={(e) => handlePlantaPointerDown(e, 'bar')}
                    onClick={() => { if (plantaDidDragRef.current) return; selectMesa('Barra'); setShowMesaSelectorModal(false) }}
                    style={{ left: `${plantaLayout.bar.left}%`, top: `${plantaLayout.bar.top}%`, width: `${plantaLayout.bar.width}%`, height: '18%' }}
                    className="absolute rounded-lg bg-amber-700 border-2 border-amber-800 flex items-center justify-center cursor-grab hover:bg-amber-600"
                  >
                    <span className="text-white font-semibold text-sm">🍸 Barra</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => handlePlantaPointerDown(e, 'mesa1')}
                    onClick={() => { if (plantaDidDragRef.current) return; selectMesa('Mesa circular 1'); setShowMesaSelectorModal(false) }}
                    style={{ left: `${plantaLayout.mesa1.left}%`, top: `${plantaLayout.mesa1.top}%`, width: '28%', aspectRatio: '1' }}
                    className="absolute rounded-full bg-arandano-600 border-2 border-arandano-800 flex items-center justify-center cursor-grab hover:bg-arandano-500"
                  >
                    <span className="text-white font-bold text-sm">1</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => handlePlantaPointerDown(e, 'mesa2')}
                    onClick={() => { if (plantaDidDragRef.current) return; selectMesa('Mesa circular 2'); setShowMesaSelectorModal(false) }}
                    style={{ left: `${plantaLayout.mesa2.left}%`, top: `${plantaLayout.mesa2.top}%`, width: '28%', aspectRatio: '1' }}
                    className="absolute rounded-full bg-arandano-600 border-2 border-arandano-800 flex items-center justify-center cursor-grab hover:bg-arandano-500"
                  >
                    <span className="text-white font-bold text-sm">2</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowMesaOtroInput(true); setMesaOtro('') }}
                  className="mt-4 w-full py-2.5 text-sm text-arandano-600 hover:text-arandano-700 font-medium border border-arandano-300 rounded-lg"
                >
                  ✏️ Otra ubicación
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-stone-700">Indica la mesa o ubicación</label>
                <input
                  type="text"
                  value={mesaOtro}
                  onChange={(e) => setMesaOtro(e.target.value)}
                  placeholder="Ej: Mesa 10, Delivery..."
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl text-arandano-950 focus:ring-2 focus:ring-arandano-500 focus:border-arandano-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowMesaOtroInput(false); setMesaOtro('') }} className="flex-1 py-3 rounded-xl font-medium bg-stone-200 text-stone-700">Atrás</button>
                  <button
                    type="button"
                    onClick={() => {
                      const valor = mesaOtro.trim()
                      if (valor) { selectMesa(valor); setShowMesaSelectorModal(false); setShowMesaOtroInput(false); setMesaOtro('') }
                    }}
                    disabled={!mesaOtro.trim()}
                    className="flex-1 py-3 rounded-xl font-semibold bg-arandano-600 text-white hover:bg-arandano-700 disabled:opacity-50"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[50] p-3 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-arandano-950">Procesar Venta</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPaymentSelection({})
                  setAmountPaid('')
                  setPaymentMethod('efectivo')
                  setPaymentAction('pay')
                  setDebtName('')
                  setShowDebtForm(false)
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
            
            {/* Mesa y comentario asignados */}
            {(mesaElegida || orderComment) && (
              <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm">
                {mesaElegida && (
                  <p className="text-arandano-800 font-medium">
                    {iconoMesa(mesaElegida)} Mesa: {mesaElegida}
                  </p>
                )}
                {orderComment && (
                  <p className="text-stone-700 mt-1">
                    📝 {orderComment}
                  </p>
                )}
              </div>
            )}

            {/* Elegir qué productos cobrar ahora */}
            <div className="mb-3">
              <p className="text-xs font-medium text-stone-600 mb-2">Cantidad a pagar ahora (el resto queda en la cuenta):</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cart.map((item) => {
                  const toPay = paymentSelection[item.id] ?? 0
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-arandano-950 truncate">{item.name}</div>
                        <div className="text-xs text-stone-500">En cuenta: {item.quantity} · ${formatPrice(item.price)} c/u</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPaymentSelection((prev) => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] ?? item.quantity) - 1) }))}
                          className="w-8 h-8 flex items-center justify-center bg-stone-200 hover:bg-stone-300 rounded text-sm font-bold"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold text-sm">{toPay}</span>
                        <button
                          type="button"
                          onClick={() => setPaymentSelection((prev) => ({ ...prev, [item.id]: Math.min(item.quantity, (prev[item.id] ?? 0) + 1) }))}
                          className="w-8 h-8 flex items-center justify-center bg-arandano-600 hover:bg-arandano-700 text-white rounded text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Resumen y Opciones en la misma fila */}
            <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Resumen (solo lo seleccionado) */}
              <div>
                <div className="space-y-1.5 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Subtotal (seleccionado):</span>
                    <span>${formatPrice(getSelectedSubtotal())}</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-xs text-red-600">
                      <span>Desc. ({discountType === 'percentage' ? `${discount}%` : 'Monto'}):</span>
                      <span>-${formatPrice(getSelectedDiscountAmount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1.5 border-t border-stone-200">
                    <span className="text-stone-700 font-semibold text-sm">A cobrar ahora:</span>
                    <span className="text-2xl font-bold text-arandano-600">
                      ${formatPrice(getSelectedTotal())}
                    </span>
                  </div>
                  {getPendingAfterThisPayment() > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-dashed border-amber-300">
                      <p className="text-[11px] text-amber-800">
                        Saldo pendiente después de este pago:{' '}
                        <span className="font-semibold">
                          ${formatPrice(getPendingAfterThisPayment())}
                        </span>
                        . Queda registrado en la cuenta de la mesa.
                      </p>
                    </div>
                  )}
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
                    <span className="ml-auto text-xs bg-arandano-600 text-white px-2 py-0.5 rounded-full">
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
                            ? 'bg-arandano-600 text-white'
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
                            ? 'bg-arandano-600 text-white'
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
                        className="flex-1 px-2 py-1.5 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-arandano-500 focus:border-arandano-500"
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

                  {/* Comentario / detalles de la mesa */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label htmlFor="waiter-payment-comment" className="block text-xs font-medium text-stone-700 mb-1.5">
                      Detalles / comentario de la mesa:
                    </label>
                    <textarea
                      id="waiter-payment-comment"
                      value={orderComment}
                      onChange={(e) => setOrderComment(e.target.value)}
                      placeholder="Ej: Consumo propio, instrucciones..."
                      className="w-full px-3 py-2.5 border-2 border-stone-300 rounded-lg text-sm text-stone-900 bg-white focus:ring-2 focus:ring-arandano-500 focus:border-arandano-500 focus:outline-none resize-y min-h-[4rem] touch-manipulation"
                      rows={3}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </div>
                </div>

                {/* Fecha y hora */}
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    📅 Fecha/hora:
                  </label>
                  <p className="text-xs text-stone-500 mb-1">Puedes elegir una fecha pasada para registrar ventas anteriores.</p>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-stone-300 rounded text-xs bg-white focus:ring-1 focus:ring-arandano-500 focus:border-arandano-500"
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
                      className="px-2 py-1.5 text-xs bg-arandano-100 hover:bg-arandano-200 text-arandano-700 rounded font-medium"
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
                      ? 'bg-arandano-600 text-white'
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
                      ? 'bg-arandano-600 text-white'
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
                  className="w-full px-3 py-3 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500 focus:border-arandano-500 text-xl font-semibold text-center mb-2"
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
                      className="px-2 py-1.5 bg-arandano-100 hover:bg-arandano-200 text-arandano-700 font-medium rounded text-xs transition-colors active:scale-95"
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
                    {parseFloat(amountPaid) >= getSelectedTotal() && parseFloat(amountPaid) > 0 && (
                      <div className="mt-2 p-2.5 bg-green-50 border-2 border-green-300 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-green-800 font-semibold text-sm">💰 Cambio:</span>
                          <span className="text-xl font-bold text-green-600">
                            ${formatPrice(calculateChange())}
                          </span>
                        </div>
                      </div>
                    )}
                    {((parseFloat(amountPaid) > 0 && parseFloat(amountPaid) < getSelectedTotal()) ||
                      (parseFloat(amountPaid) === 0 && getSelectedTotal() > 0)) && (
                      <div className="mt-2 p-2.5 bg-red-50 border-2 border-red-300 rounded-lg space-y-2">
                        <p className="text-red-800 font-medium text-center text-sm">
                          {parseFloat(amountPaid) === 0
                            ? `💰 Monto recibido: $0 — Saldo como deuda: ${formatPrice(getSelectedTotal())}`
                            : `⚠️ Falta: ${formatPrice(getSelectedTotal() - parseFloat(amountPaid))}`}
                        </p>
                        {!showDebtForm && (
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => setShowDebtForm(true)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              Crear deuda con este saldo
                            </button>
                          </div>
                        )}
                        {showDebtForm && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 gap-1.5">
                              <div>
                                <label className="block text-[11px] font-medium text-red-900 mb-0.5">
                                  A nombre de quién queda la deuda:
                                </label>
                                <input
                                  type="text"
                                  defaultValue={debtName}
                                  onBlur={(e) => setDebtName(e.target.value)}
                                  placeholder="Ej: Cliente, mesa, persona..."
                                  className="w-full px-2 py-1.5 border border-red-300 rounded text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                                />
                              </div>
                            </div>
                            <p className="text-[11px] text-red-900 mt-1">
                              Saldo pendiente que quedará como deuda:{' '}
                              <span className="font-semibold">
                                ${formatPrice(getSelectedTotal() - (parseFloat(amountPaid) || 0))}
                              </span>
                              .
                            </p>
                            <p className="text-[10px] text-red-800">
                              Se registrará esta venta como <span className="font-semibold">aporte</span> y el saldo
                              pendiente quedará asociado a este nombre y resaltado en rojo en el panel de ventas.
                            </p>
                            <div className="flex justify-center pt-1">
                              <button
                                type="button"
                                onClick={handlePayment}
                                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                              >
                                Confirmar pago parcial
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {parseFloat(amountPaid) === 0 && getSelectedTotal() === 0 && (
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
                  getSelectedTotal() <= 0 ||
                  (paymentMethod === 'efectivo' && amountPaid !== '' && parseFloat(amountPaid) > 0 && parseFloat(amountPaid) < getSelectedTotal())
                }
                className="flex-1 px-4 py-2.5 bg-arandano-600 hover:bg-arandano-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {processing ? 'Procesando...' : '✅ Confirmar Pago'}
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPaymentSelection({})
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


      {/* Vista profunda de edición de venta: ancho fijo, capa profunda */}
      {editingSale && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl flex flex-col bg-white rounded-2xl shadow-2xl my-8 min-h-[85vh] max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-arandano-950">Editar Venta</h3>
              <button
                onClick={() => {
                  setEditingSale(null)
                  setEditSaleDateTime('')
                  setEditSaleComment('')
                  setEditSaleItems([])
                  setShowProductSelector(false)
                  setProductSearch('')
                }}
                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-xl font-bold"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 sm:p-8 space-y-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  📅 Fecha y Hora (editable):
                </label>
                <input
                  type="datetime-local"
                  value={editSaleDateTime}
                  onChange={(e) => setEditSaleDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500 focus:border-transparent bg-white"
                  aria-label="Fecha y hora de la venta"
                />
                <p className="text-xs text-stone-500 mt-1">Puedes cambiar la fecha y hora de la venta aquí</p>
              </div>

              {/* Productos de la venta */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-stone-700">
                    🛒 Productos:
                  </label>
                  <button
                    onClick={() => setShowProductSelector(!showProductSelector)}
                    className="px-3 py-1.5 bg-arandano-600 hover:bg-arandano-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {showProductSelector ? '✕ Cancelar' : '+ Agregar Producto'}
                  </button>
                </div>

                {/* Selector de productos */}
                {showProductSelector && (
                  <div className="mb-4 p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar producto..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500 focus:border-transparent mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredAvailableProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addProductToSale(product)}
                          className="w-full text-left px-3 py-2 bg-white hover:bg-arandano-50 border border-stone-200 rounded-lg transition-colors flex justify-between items-center"
                        >
                          <span className="text-sm font-medium text-arandano-950">{product.name}</span>
                          <span className="text-sm text-arandano-600 font-semibold">${formatPrice(product.price)}</span>
                        </button>
                      ))}
                      {filteredAvailableProducts.length === 0 && (
                        <p className="text-sm text-stone-500 text-center py-2">No se encontraron productos</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de productos en la venta */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {editSaleItems.map((item, index) => {
                    const product = availableProducts.find(p => p.id === item.productId)
                    return (
                      <div key={index} className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-arandano-950">{item.productName}</div>
                          <div className="text-xs text-stone-600">${formatPrice(item.unitPrice)} c/u</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateProductQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-stone-200 hover:bg-stone-300 rounded text-sm font-bold"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-semibold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateProductQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-arandano-600 hover:bg-arandano-700 text-white rounded text-sm font-bold"
                          >
                            +
                          </button>
                          <span className="w-20 text-right font-semibold text-arandano-600">
                            ${formatPrice(item.totalPrice)}
                          </span>
                          <button
                            onClick={() => removeProductFromSale(item.productId)}
                            className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded text-sm font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {editSaleItems.length === 0 && (
                    <p className="text-sm text-stone-500 text-center py-4 bg-stone-50 rounded-lg">
                      No hay productos en esta venta
                    </p>
                  )}
                </div>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  💬 Comentario:
                </label>
                <textarea
                  value={editSaleComment}
                  onChange={(e) => setEditSaleComment(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Ej: Consumo propio, nota especial, etc."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[4.5rem]"
                  rows={3}
                  autoComplete="off"
                />
                <p className="text-xs text-stone-500 mt-1">Opcional: agrega un comentario a esta venta</p>
              </div>

              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-sm text-stone-600">
                  <span className="font-semibold">Total:</span> <span className="text-lg font-bold text-arandano-600">${formatPrice(getEditTotal())}</span>
                </p>
                <p className="text-sm text-stone-600">
                  <span className="font-semibold">Productos:</span> {editSaleItems.length}
                </p>
                {editingSale.paymentMethod && (
                  <p className="text-sm text-stone-600">
                    <span className="font-semibold">Método de pago:</span> {editingSale.paymentMethod}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateSale}
                  disabled={processing || !editSaleDateTime || editSaleItems.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-400 text-white rounded-lg font-medium transition-colors"
                >
                  {processing ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  onClick={() => {
                    setEditingSale(null)
                    setEditSaleDateTime('')
                    setEditSaleComment('')
                    setEditSaleItems([])
                    setShowProductSelector(false)
                    setProductSearch('')
                  }}
                  className="flex-1 px-4 py-2 bg-stone-300 hover:bg-stone-400 text-stone-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle de venta */}
      {showSaleDetail && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-arandano-950">Detalle de Venta</h3>
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
                    <span className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1">Código de Venta:</span>
                    <p className="text-sm sm:text-base text-arandano-600 font-mono font-semibold">{selectedSale.id}</p>
                  </div>
                  <div>
                    <span className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1">Fecha y Hora:</span>
                    <p className="text-sm sm:text-base text-stone-600">
                      {parseSaleDateLocal(selectedSale.date, selectedSale.hour ?? 0).toLocaleDateString('es-CO', {
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
                <h4 className="font-semibold text-arandano-950 mb-3 text-base sm:text-lg">Productos:</h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-stone-50 rounded-lg p-3 sm:p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-arandano-950 text-sm sm:text-base mb-1">
                            {item.productName}
                          </div>
                          <div className="text-xs sm:text-sm text-stone-600">
                            Cantidad: {item.quantity} × ${formatPrice(item.unitPrice)} c/u
                          </div>
                        </div>
                        <div className="flex justify-between sm:justify-end items-center gap-4">
                          <span className="font-semibold text-arandano-600 text-base sm:text-lg">
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
                    <span className="text-base sm:text-lg font-semibold text-arandano-950">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-arandano-600">
                      ${formatPrice(selectedSale.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones - Apilados en móvil */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200">
                <button
                  onClick={() => {
                    const dateStr = selectedSale.date
                    const datePart = typeof dateStr === 'string' && dateStr.length >= 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.slice(0, 10)) ? dateStr.slice(0, 10) : null
                    const year = datePart ? datePart.slice(0, 4) : String(new Date(dateStr).getFullYear())
                    const month = datePart ? datePart.slice(5, 7) : String(new Date(dateStr).getMonth() + 1).padStart(2, '0')
                    const day = datePart ? datePart.slice(8, 10) : String(new Date(dateStr).getDate()).padStart(2, '0')
                    const hours = String(selectedSale.hour !== undefined && selectedSale.hour !== null ? selectedSale.hour : 0).padStart(2, '0')
                    const minutes = '00'
                    setEditingSale(selectedSale)
                    setEditSaleDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
                    setEditSaleComment(selectedSale.comment || '')
                    setEditSaleItems([...selectedSale.items])
                    setShowProductSelector(false)
                    setProductSearch('')
                    setShowSaleDetail(false)
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
                >
                  ✏️ Editar Venta
                </button>
                <button
                  onClick={() => handleDeleteSale(selectedSale.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
                >
                  🗑️ Eliminar Venta
                </button>
              </div>
            </div>
          </div>
        </div>
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
                <h3 className="text-xl font-bold text-arandano-950 mb-2">¡Venta Registrada!</h3>
                <p className="text-stone-600 text-sm">La venta se ha registrado exitosamente</p>
              </div>
            </div>
          </div>
        </>
      )}
        </WaiterLayout>
      </main>
    </div>
    )
  }
  return content
}

