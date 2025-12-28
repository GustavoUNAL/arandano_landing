import Link from 'next/link'

export default function Services() {
  const services = [
    {
      icon: '☕',
      title: 'Café & Snacks',
      description: 'Café de especialidad y deliciosos snacks para acompañar tu día.',
      link: '/menu-cafes',
    },
    {
      icon: '🍹',
      title: 'Servicio de Bebidas',
      description: 'Amplia variedad de bebidas disponibles las 24 horas del día.',
      link: '/menu-bebidas',
    },
  ]

  return (
    <section className="py-6 sm:py-10 md:py-14 lg:py-16 bg-white px-4">
      <div className="container-custom">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-center text-berry-950 mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          Tienda Virtual
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-5 md:gap-8 lg:gap-10 max-w-4xl mx-auto">
          {services.map((service, index) => (
            <Link
              key={index}
              href={service.link}
              className="bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:bg-stone-100 transition-all duration-300 hover:border-berry-300 hover:shadow-xl hover:shadow-berry-200/50 block"
            >
              <div className="text-2xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 md:mb-4">{service.icon}</div>
              <h3 className="font-display text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-berry-950 mb-1 sm:mb-2 md:mb-3">
                {service.title}
              </h3>
              <p className="text-berry-800 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed mb-2 sm:mb-3 md:mb-4 hidden sm:block">
                {service.description}
              </p>
              <p className="text-berry-600 font-medium text-xs sm:text-sm md:text-base">
                Ver menú →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

