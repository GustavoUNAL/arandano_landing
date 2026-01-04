'use client'

import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'
import WhatsAppIcon from './WhatsAppIcon'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  size?: string
}

interface HeaderProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
  cartItems?: CartItem[]
  onSendWhatsAppOrder?: () => void
  onCartClick?: () => void
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
      className="w-6 h-6 sm:w-7 sm:h-7"
    >
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
    {count > 0 && (
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-lg">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </div>
)

export default function Header({ searchQuery = '', onSearchChange, cartItems = [], onSendWhatsAppOrder, onCartClick }: HeaderProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const whatsappNumber = '573207909835'
  const whatsappMessage = encodeURIComponent('Hola, quiero hacer un pedido en Arándano Café Bar.')
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearchQuery(value)
    if (onSearchChange) {
      onSearchChange(value)
    }
  }

  const handleWhatsAppClick = () => {
    if (onSendWhatsAppOrder && cartItems.length > 0) {
      onSendWhatsAppOrder()
    } else {
      window.open(whatsappUrl, '_blank')
    }
  }

  const handleCartClick = (e: React.MouseEvent) => {
    // En mobile (cuando onCartClick existe), abrir el modal
    // En desktop (cuando no existe onCartClick), usar el comportamiento original
    if (onCartClick) {
      onCartClick()
    } else if (cartItems.length > 0) {
      handleWhatsAppClick()
    }
  }

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
      <div className="container-custom">
        <nav className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 py-2 sm:py-3">
          {/* Logo - Only visible on desktop */}
          <Link 
            href="/" 
            className="hidden lg:flex items-center hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <div className="relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16">
              <Image
                src="/images/logo.png"
                alt="Arándano Café Bar Logo"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 56px, 64px"
                priority
              />
            </div>
          </Link>

          {/* Search Bar - Solo mostrar si onSearchChange está definido */}
          {onSearchChange && (
            <div className="flex-1 min-w-0 lg:max-w-2xl lg:mx-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-berry-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={localSearchQuery}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-berry-950 placeholder-berry-400 bg-white transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Right side: Cart, WhatsApp */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Cart Icon */}
            <button
              onClick={handleCartClick}
              className={`relative p-2 transition-colors rounded-lg hover:bg-stone-50 active:bg-stone-100 ${
                cartItems.length > 0 
                  ? 'text-berry-700 hover:text-berry-950' 
                  : 'text-stone-300 hover:text-berry-700'
              }`}
              aria-label="Ver carrito"
            >
              <CartIcon count={cartItemsCount} />
            </button>

            {/* WhatsApp Button */}
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-1.5 sm:gap-2 bg-[#25D366] hover:bg-[#20BA5A] active:bg-[#1DA851] text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg md:rounded-full shadow-md hover:shadow-lg active:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap"
              aria-label="Pedir por WhatsApp"
            >
              <WhatsAppIcon size={16} className="sm:w-5 sm:h-5 text-white flex-shrink-0" />
              <span className="hidden sm:inline">Pedir por WhatsApp</span>
              <span className="sm:hidden">Pedir</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}
