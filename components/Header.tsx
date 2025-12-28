'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'

export default function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Tienda Virtual', href: '/tienda-virtual' },
    { name: 'Contacto', href: '/contacto' },
  ]

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
      <div className="container-custom">
        <nav className="flex items-center justify-between h-16 sm:h-20">
          <Link 
            href="/" 
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="Arándano Café Bar Logo"
                fill
                className="object-contain"
                sizes="(max-width: 640px) 32px, (max-width: 768px) 40px, 48px"
                priority
              />
            </div>
            <span className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-berry-950">
              Arándano Café Bar
            </span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-medium text-base lg:text-lg transition-colors duration-200 ${
                    isActive
                      ? 'text-berry-700 border-b-2 border-berry-700 pb-1'
                      : 'text-berry-600 hover:text-berry-950'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-berry-950 hover:text-berry-700 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-stone-200 py-4">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`font-medium text-base py-2 px-4 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'text-berry-700 bg-berry-50'
                        : 'text-berry-600 hover:text-berry-950 hover:bg-stone-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
