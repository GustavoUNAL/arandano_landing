'use client'

import WhatsAppIcon from './WhatsAppIcon'
import Image from 'next/image'

export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Contáctanos por WhatsApp',
      description: 'Envíanos un mensaje con tu pedido. Estamos disponibles las 24 horas del día, todos los días.',
      color: 'from-berry-500 to-berry-600',
    },
    {
      number: '2',
      title: 'Confirmamos disponibilidad',
      description: 'Te confirmamos que tenemos lo que necesitas y coordinamos el método de entrega contigo.',
      icon: '✓',
      color: 'from-berry-600 to-berry-700',
    },
    {
      number: '3',
      title: 'Preparamos y entregamos',
      description: 'Preparamos tu pedido con cuidado y te lo entregamos en tiempo récord. ¡Disfruta!',
      icon: '🚀',
      color: 'from-berry-700 to-berry-800',
    },
  ]

  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-b from-white via-stone-50 to-white px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-berry-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-berry-300 rounded-full blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20 md:mb-24">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-berry-950 mb-6 animate-fade-in">
            Cómo Funciona
          </h2>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-berry-300"></div>
            <div className="w-2 h-2 bg-berry-600 rounded-full"></div>
            <div className="w-24 h-0.5 bg-gradient-to-r from-berry-300 via-berry-600 to-berry-300"></div>
            <div className="w-2 h-2 bg-berry-600 rounded-full"></div>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-berry-300"></div>
          </div>
          <p className="text-berry-600 text-lg sm:text-xl md:text-2xl font-medium max-w-3xl mx-auto">
            Pedir es fácil, rápido y disponible 24/7
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Steps container */}
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 sm:gap-16 lg:gap-12 xl:gap-16 relative">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="relative animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Content container */}
                  <div className="relative z-10 text-center">
                    {/* Number circle with icon */}
                    <div className="relative inline-flex items-center justify-center mb-8 sm:mb-10">
                      {/* Outer glow layers */}
                      <div className="absolute inset-0 bg-berry-200 rounded-full blur-2xl opacity-40 animate-pulse-slow"></div>
                      <div className="absolute -inset-2 bg-berry-100 rounded-full blur-xl opacity-30"></div>
                      
                      {/* Main circle */}
                      <div className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-500 group`}>
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                        
                        {/* Icon - WhatsApp for first step, others use emoji */}
                        <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                          {index === 0 ? (
                            <WhatsAppIcon size={48} className="text-white sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20" />
                          ) : step.icon ? (
                            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl block">
                              {step.icon}
                            </span>
                          ) : (
                            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl block">✓</span>
                          )}
                        </div>
                        
                        {/* Number badge */}
                        <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-berry-600">
                          <span className="text-berry-700 font-display text-xs sm:text-sm md:text-base font-bold">{step.number}</span>
                        </div>
                      </div>

                      {/* Decorative ring */}
                      <div className="absolute inset-0 border-2 border-berry-300/50 rounded-full animate-ping-slow"></div>
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-berry-950 mb-4 sm:mb-5 leading-tight px-4">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-berry-700 text-base sm:text-lg md:text-xl leading-relaxed max-w-sm mx-auto px-4">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow connector - only on desktop, between items */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute top-[140px] right-0 transform translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/90 backdrop-blur-sm border-2 border-berry-300 rounded-full flex items-center justify-center shadow-xl hover:border-berry-500 hover:bg-white transition-all duration-300 group/arrow">
                        <svg
                          className="w-6 h-6 sm:w-7 sm:h-7 text-berry-600 group-hover/arrow:text-berry-700 group-hover/arrow:translate-x-1 transition-all duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 sm:mt-20 md:mt-24 lg:mt-28 text-center">
            <div className="inline-block relative group">
              {/* Background glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-berry-400 to-berry-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
              
              {/* Content */}
              <div className="relative bg-white/80 backdrop-blur-sm border-2 border-berry-200 rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 max-w-3xl mx-4">
                <div className="text-3xl sm:text-4xl md:text-5xl mb-4">✨</div>
                <p className="text-berry-950 font-display text-xl sm:text-2xl md:text-3xl font-bold mb-3">
                  ¿Listo para hacer tu pedido?
                </p>
                <p className="text-berry-700 text-base sm:text-lg md:text-xl">
                  Contáctanos ahora por WhatsApp y recibe tu pedido en tiempo récord
                </p>
              </div>
            </div>
          </div>

          {/* Logo Image at the end */}
          <div className="mt-16 sm:mt-20 md:mt-24 lg:mt-28 flex justify-center">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72">
              <Image
                src="/images/logo.png"
                alt="Arándano Café Bar Logo"
                fill
                className="object-contain drop-shadow-xl"
                sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, (max-width: 1024px) 256px, 288px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
