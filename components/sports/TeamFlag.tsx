interface TeamFlagProps {
  code: string
  alt: string
  className?: string
}

/** Banderas ISO 3166-1 alpha-2 (flagcdn.com) — img nativo, sin next/image */
export default function TeamFlag({ code, alt, className = 'h-6 w-9' }: TeamFlagProps) {
  return (
    <img
      src={`https://flagcdn.com/w160/${code.toLowerCase()}.png`}
      alt={alt}
      className={`rounded-sm object-cover shadow-sm ring-1 ring-black/10 dark:ring-white/15 shrink-0 ${className}`}
      loading="lazy"
    />
  )
}
