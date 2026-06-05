'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-stone-50 flex items-center justify-center px-4 antialiased">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">
            Error inesperado
          </h1>
          <p className="text-stone-600 text-sm mb-6">
            No se pudo cargar la aplicación.
          </p>
          <button
            type="button"
            onClick={reset}
            className="px-6 py-3 bg-stone-800 hover:bg-stone-900 text-white font-semibold rounded-xl transition-colors"
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  )
}
