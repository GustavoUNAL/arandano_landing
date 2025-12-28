'use client'

import WhatsAppIcon from './WhatsAppIcon'

export default function FloatingWhatsApp() {
  const whatsappNumber = '573207909835' // +57 3207909835
  const whatsappMessage = encodeURIComponent('Hola, quiero hacer un pedido en Arándano Café Bar.')
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 bg-[#25D366] hover:bg-[#20BA5A] rounded-full flex items-center justify-center shadow-2xl hover:shadow-[#25D366]/50 transition-all duration-300 hover:scale-110 active:scale-95 z-50 group"
      aria-label="Contactar por WhatsApp"
    >
      <WhatsAppIcon size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform duration-300" />
      <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-ping"></span>
      <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full"></span>
    </a>
  )
}

