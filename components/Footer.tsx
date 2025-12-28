import WhatsAppIcon from './WhatsAppIcon'

export default function Footer() {
  const whatsappNumber = '573207909835' // +57 3207909835
  const whatsappUrl = `https://wa.me/${whatsappNumber}`
  const instagramUrl = 'https://instagram.com/arandano_cafe_bar' // Reemplaza con tu Instagram
  const mapsUrl = 'https://maps.google.com/?q=Arándano+Café+Bar+Pasto' // Reemplaza con tu ubicación

  return (
    <footer className="bg-stone-100 border-t border-stone-200 px-4 py-6 sm:py-10 md:py-12 lg:py-14">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-berry-950 mb-2">
              Arándano Café Bar
            </h3>
            <p className="text-berry-700 text-xs sm:text-sm md:text-base">
              Tu café de día, tu servicio de bebidas 24/7
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-berry-700 hover:text-berry-950 transition-colors duration-200 font-medium"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon size={20} className="text-berry-700" />
              WhatsApp
            </a>
            
            <span className="hidden sm:inline text-berry-400">•</span>
            
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-berry-700 hover:text-berry-950 transition-colors duration-200 font-medium"
              aria-label="Instagram"
            >
              <span className="text-xl">📷</span>
              Instagram
            </a>
            
            <span className="hidden sm:inline text-berry-400">•</span>
            
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-berry-700 hover:text-berry-950 transition-colors duration-200 font-medium"
              aria-label="Google Maps"
            >
              <span className="text-xl">📍</span>
              Google Maps
            </a>
          </div>
          
          <div className="text-center pt-6 sm:pt-8 border-t border-stone-300">
            <p className="text-berry-600 text-xs sm:text-sm">
              © {new Date().getFullYear()} Arándano Café Bar. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

