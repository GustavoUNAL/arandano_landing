'use client'

import {
  GOOGLE_MAPS_PLACE_URL,
  MAP_EMBED_SEARCH_QUERY
} from '@/lib/site-location'

export default function LocationSchedule () {
  // Embed: búsqueda por nombre + dirección (evita coordenadas incorrectas).
  const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    MAP_EMBED_SEARCH_QUERY
  )}&hl=es&z=17&output=embed`

  const mapsLink = GOOGLE_MAPS_PLACE_URL

  return (
    <section className="py-6 sm:py-8 md:py-10 bg-white px-4">
      <div className="container-custom">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-berry-950 mb-4 sm:mb-5 text-center">
            Ubicación y Horarios
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Mapa */}
            <div className="overflow-hidden order-2 lg:order-1">
              <div className="relative w-full h-[250px] sm:h-[300px] md:h-[350px]">
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
              <div className="pt-2 sm:pt-3 text-center">
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-berry-700 hover:text-berry-950 font-medium transition-colors text-xs sm:text-sm"
                >
                  Abrir en Google Maps
                </a>
              </div>
            </div>
            
            {/* Información */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5 lg:gap-6 order-1 lg:order-2 text-center">
              <div className="space-y-1">
                <h3 className="font-display text-base sm:text-lg md:text-xl font-semibold text-berry-950 tracking-tight">
                  Ubicación
                </h3>
                <p className="text-stone-700 text-sm sm:text-base font-medium">
                  Carrera 35 #17-86
                </p>
                <p className="text-stone-600 text-xs sm:text-sm">
                  Pasto, Nariño, Colombia
                </p>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-display text-base sm:text-lg md:text-xl font-semibold text-berry-950 tracking-tight">
                  Horarios
                </h3>
                <p className="text-stone-700 text-sm sm:text-base font-medium">
                  10am - 11pm
                </p>
                <p className="text-stone-600 text-xs sm:text-sm">
                  Todos los días
                </p>
              </div>
              
              <div className="space-y-1 col-span-2 lg:col-span-1">
                <h3 className="font-display text-base sm:text-lg md:text-xl font-semibold text-berry-950 tracking-tight">
                  Delivery
                </h3>
                <p className="text-stone-700 text-sm sm:text-base font-medium">
                  24/7
                </p>
                <p className="text-stone-600 text-xs sm:text-sm">
                  Disponible siempre
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

