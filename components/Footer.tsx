import WhatsAppIcon from './WhatsAppIcon'

export default function Footer() {
  const whatsappNumber = '573207909835' // +57 3207909835
  const whatsappUrl = `https://wa.me/${whatsappNumber}`
  const instagramUrl = 'https://instagram.com/arandano_cafe_bar'
  const youtubeUrl = 'https://youtube.com/@arandano_cafe_bar' // Reemplaza con tu canal de YouTube

  return (
    <footer className="bg-stone-100 border-t border-stone-200 px-4 py-6 sm:py-10 md:py-12 lg:py-14">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-berry-950 mb-2">
              Arándano Café Bar
            </h3>
          </div>
          
          <div className="flex flex-row items-center justify-center gap-6 sm:gap-8 mb-6 sm:mb-8">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-berry-700 hover:text-berry-950 transition-colors duration-200"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon size={32} className="text-berry-700" />
            </a>
            
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-berry-700 hover:text-berry-950 transition-colors duration-200"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-berry-700">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-berry-700 hover:text-berry-950 transition-colors duration-200"
              aria-label="YouTube"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-berry-700">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
          
          <div className="text-center pt-6 sm:pt-8 border-t border-stone-300">
            <p className="text-berry-600 text-xs sm:text-sm mb-2">
              © {new Date().getFullYear()} Arándano Café Bar. Todos los derechos reservados.
            </p>
            <p className="text-berry-500 text-xs">
              Desarrollado por{' '}
              <a
                href="mailto:info@grap-ingenieria.tech"
                className="font-semibold hover:text-berry-700 transition-colors"
              >
                GRAP SAS
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

