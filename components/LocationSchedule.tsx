'use client'

import ScrollReveal from '@/components/ScrollReveal'
import {
  GOOGLE_MAPS_PLACE_URL,
  MAP_EMBED_SEARCH_QUERY
} from '@/lib/site-location'

const PinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5 shrink-0"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
      clipRule="evenodd"
    />
  </svg>
)

export default function LocationSchedule () {
  const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    MAP_EMBED_SEARCH_QUERY
  )}&hl=es&z=17&output=embed`

  return (
    <ScrollReveal delay={120}>
      <article className="location-card max-w-xl mx-auto">
        <div className="location-card-inner">
          <header className="location-card-header">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-berry-600">
              <PinIcon />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                Ubicación
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-[1.65rem] font-bold text-berry-950 mt-3 text-center sm:text-left">
              Arándano Café Bar
            </h2>
            <p className="text-berry-700 text-sm sm:text-base font-medium mt-1 text-center sm:text-left">
              Cerca de la Universidad Mariana
            </p>
          </header>

          <div className="location-map-frame">
            <div className="location-map-inset">
              <iframe
                src={mapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full rounded-[1rem] sm:rounded-[1.125rem]"
                title="Mapa — Arándano Café Bar"
              />
            </div>
          </div>

          <footer className="location-card-footer">
            <div className="text-center sm:text-left text-stone-600 text-sm space-y-0.5">
              <p className="font-semibold text-stone-800 text-base">
                Carrera 35 #17-86
              </p>
              <p>Pasto, Nariño, Colombia</p>
            </div>
            <a
              href={GOOGLE_MAPS_PLACE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="location-maps-btn"
            >
              Abrir en Google Maps
            </a>
          </footer>
        </div>
      </article>
    </ScrollReveal>
  )
}
