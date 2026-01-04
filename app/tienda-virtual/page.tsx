import Footer from '@/components/Footer'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import Link from 'next/link'

export default function TiendaVirtual() {
  const categories = [
    {
      icon: '☕',
      title: 'Café & Snacks',
      description: 'Café de especialidad y deliciosos snacks para acompañar tu día.',
      link: '/menu-cafes',
    },
    {
      icon: '🍹',
      title: 'Bebidas',
      description: 'Amplia variedad de bebidas disponibles las 24 horas del día.',
      link: '/menu-bebidas',
    },
  ]

  return (
    <>
      <main className="min-h-screen bg-stone-50">
        <div className="container-custom py-12 sm:py-16 md:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-berry-950 mb-4 sm:mb-6">
                Tienda Virtual
              </h1>
              <p className="text-berry-700 text-base sm:text-lg md:text-xl">
                Explora nuestros menús y haz tu pedido
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
              {categories.map((category, index) => (
                <Link
                  key={index}
                  href={category.link}
                  className="bg-white border-2 border-stone-200 rounded-2xl p-8 sm:p-10 hover:bg-stone-50 hover:border-berry-300 transition-all duration-300 hover:shadow-xl hover:shadow-berry-200/50 block text-center group"
                >
                  <div className="text-5xl sm:text-6xl md:text-7xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-berry-950 mb-3 sm:mb-4">
                    {category.title}
                  </h2>
                  <p className="text-berry-700 text-sm sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-6">
                    {category.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-berry-600 hover:text-berry-950 font-semibold text-base sm:text-lg transition-colors">
                    Ver menú
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  )
}
