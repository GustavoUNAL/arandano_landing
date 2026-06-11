interface TeamCrestProps {
  src?: string | null
  alt: string
  size?: number
  className?: string
}

/** Escudos externos (SVG/PNG de football-data.org) — evita next/image con URLs remotas problemáticas */
export default function TeamCrest({ src, alt, size = 40, className = '' }: TeamCrestProps) {
  if (!src) {
    return (
      <div
        className={`rounded-full bg-stone-800 border border-white/10 flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <span className="text-sm">⚽</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain shrink-0 ${className}`}
      loading="lazy"
    />
  )
}
