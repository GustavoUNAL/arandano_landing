'use client'

export default function AriTypingIndicator({ isDark = true }: { isDark?: boolean }) {
  return (
    <div className="flex items-center gap-1 py-0.5" aria-label="Escribiendo">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`inline-block w-1.5 h-1.5 rounded-full animate-bounce ${
            isDark ? 'bg-stone-400' : 'bg-stone-500'
          }`}
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  )
}
