'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-2xl font-bold text-berry-950 mb-2">
          Algo salió mal
        </h1>
        <p className="text-stone-600 text-sm mb-6">
          Ocurrió un error al cargar esta página.
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-6 py-3 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-xl transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
