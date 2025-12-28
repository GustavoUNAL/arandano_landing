import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import LocationSchedule from '@/components/LocationSchedule'

export default function Contacto() {
  const whatsappNumber = '573207909835' // +57 3207909835
  const whatsappUrl = `https://wa.me/${whatsappNumber}`
  const instagramUrl = 'https://instagram.com/arandano_cafe_bar'
  const mapsUrl = 'https://maps.google.com/?q=1.223624,-77.284434'

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="container-custom py-12 sm:py-16 md:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-berry-950 mb-4 sm:mb-6">
                Contacto
              </h1>
              <p className="text-berry-700 text-base sm:text-lg md:text-xl">
                Estamos disponibles 24/7 para atenderte
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 text-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💬</div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-berry-950 mb-3 sm:mb-4">
                  WhatsApp
                </h3>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-berry-700 hover:text-berry-950 font-medium transition-colors text-sm sm:text-base"
                >
                  Contáctanos por WhatsApp
                </a>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 text-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📷</div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-berry-950 mb-3 sm:mb-4">
                  Instagram
                </h3>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-berry-700 hover:text-berry-950 font-medium transition-colors text-sm sm:text-base"
                >
                  Síguenos en Instagram
                </a>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 text-center">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📍</div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-berry-950 mb-3 sm:mb-4">
                Visítanos
              </h3>
              <p className="text-berry-800 text-base sm:text-lg mb-2 sm:mb-4">
                Cra 35 calle17 - 86 div
              </p>
              <p className="text-berry-700 mb-3 sm:mb-4 text-sm sm:text-base">
                Pasto, Nariño, Colombia
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-berry-700 hover:text-berry-950 font-medium transition-colors text-sm sm:text-base"
              >
                Abrir en Google Maps
              </a>
            </div>
          </div>
        </div>

        <LocationSchedule />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  )
}

