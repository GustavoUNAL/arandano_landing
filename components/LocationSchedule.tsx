'use client'

export default function LocationSchedule() {
  const latitude = 1.223624
  const longitude = -77.284434
  
  // Google Maps embed URL - sin API key (usando el formato básico)
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&hl=es&z=15&output=embed`
  
  // Google Maps link para abrir en la app
  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`

  return (
    <section className="py-10 sm:py-14 md:py-18 lg:py-20 bg-white px-4">
      <div className="container-custom">
        <div className="max-w-6xl mx-auto text-center space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-berry-950 mb-5 sm:mb-6 md:mb-8">
            Ubicación y Horarios
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Mapa */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden order-2 lg:order-1">
              <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px]">
                <iframe
                  src={mapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                  title="Ubicación de Arándano Café Bar"
                />
              </div>
              <div className="p-4 sm:p-6">
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-berry-700 hover:text-berry-950 font-medium transition-colors text-sm sm:text-base"
                >
                  <span>📍</span>
                  Abrir en Google Maps
                </a>
              </div>
            </div>
            
            {/* Información */}
            <div className="grid grid-cols-2 lg:flex lg:flex-col gap-3 sm:gap-4 lg:gap-6 order-1 lg:order-2">
              <div className="bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-2 sm:mb-3 md:mb-4">📍</div>
                <h3 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-berry-950 mb-2 sm:mb-3 md:mb-4">
                  Ubicación
                </h3>
                <p className="text-berry-800 text-xs sm:text-sm md:text-base lg:text-lg font-medium mb-1 sm:mb-2">
                  Cra 35 calle17 - 86 div
                </p>
                <p className="text-berry-600 text-xs sm:text-sm md:text-base lg:text-lg">
                  Pasto, Nariño, Colombia
                </p>
              </div>
              
              <div className="bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-2 sm:mb-3 md:mb-4">⏰</div>
                <h3 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-berry-950 mb-2 sm:mb-3 md:mb-4">
                  Horarios
                </h3>
                <p className="text-berry-800 text-xs sm:text-sm md:text-base lg:text-lg font-medium">
                  Abierto 24/7
                </p>
                <p className="text-berry-600 text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
                  Todos los días del año
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

