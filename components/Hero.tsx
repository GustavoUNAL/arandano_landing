'use client'

import Image from 'next/image'
import WhatsAppIcon from './WhatsAppIcon'

export default function Hero() {
  const whatsappNumber = '573207909835' // +57 3207909835
  const whatsappMessage = encodeURIComponent('Hola, quiero hacer un pedido en Arándano Café Bar.')
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <section className="relative min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] flex items-start sm:items-center justify-center bg-white px-4 pt-2 pb-4 sm:pt-6 sm:pb-8 md:pt-8 md:pb-12">
      <div className="container-custom relative z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 pt-1 sm:pt-0">
          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-8 md:mb-12">
            <div className="relative w-72 h-72 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80">
              <Image
                src="/images/logo.png"
                alt="Arándano Café Bar Logo"
                fill
                className="object-contain drop-shadow-xl"
                priority
                sizes="(max-width: 640px) 256px, (max-width: 768px) 224px, (max-width: 1024px) 288px, 320px"
              />
            </div>
          </div>
          
          <div className="pt-2 sm:pt-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 sm:gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold text-base sm:text-lg md:text-xl px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 rounded-full shadow-2xl hover:shadow-[#25D366]/50 transition-all duration-300 hover:scale-105 active:scale-95"
              aria-label="Pedir por WhatsApp"
            >
              <WhatsAppIcon size={24} className="sm:w-7 sm:h-7 text-white" />
              <span className="whitespace-nowrap">Pedir por WhatsApp</span>
            </a>
          </div>
          
          <p className="text-berry-600 text-xs sm:text-sm md:text-base pt-2 sm:pt-4">
            Disponible 24/7 · Respuesta rápida
          </p>
        </div>
      </div>
    </section>
  )
}

