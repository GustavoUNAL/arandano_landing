'use client'

import Link from 'next/link'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'

export default function MenuPage() {
  const categories = [
    { id: 'cafes', name: 'Cafetería', link: '/menu/cafes' },
    { id: 'acompanantes', name: 'Panadería', link: '/menu/acompanantes' },
    { id: 'combos', name: 'Combos', link: '/menu/combos' },
    { id: 'cervezas', name: 'Cervezas', link: '/menu/cervezas' },
    { id: 'bebidas', name: 'Bar (bebidas)', link: '/menu-bebidas' },
    { id: 'cocteles', name: 'Cócteles', link: '/menu/cocteles' },
    { id: 'shots', name: 'Shots', link: '/menu/shots' }
  ]

  return (
    <>
      <main className="min-h-screen bg-black text-white">
        <div className="menu-container-left">
          <div className="menu-header-left">
            <span className="menu-title-left">CARTA</span>
          </div>
          
          {categories.map((category) => (
            <div key={category.id} className="menu-category-item-left">
              <Link href={category.link}>{category.name}</Link>
            </div>
          ))}
        </div>
      </main>
      <FloatingWhatsApp />
    </>
  )
}

