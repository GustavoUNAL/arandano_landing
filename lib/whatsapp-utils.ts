/** Normaliza un número móvil colombiano a formato internacional sin + (ej. 573001234567). */
export function normalizeColombianWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('57') && digits.length === 12) return digits
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`
  if (digits.length === 11 && digits.startsWith('0') && digits[1] === '3') return `57${digits.slice(1)}`
  throw new Error('Ingresa un celular colombiano válido (10 dígitos, empieza por 3).')
}

export function formatWhatsAppForDisplay(normalized: string): string {
  if (normalized.length === 12 && normalized.startsWith('57')) {
    return `+57 ${normalized.slice(2, 5)} ${normalized.slice(5, 8)} ${normalized.slice(8)}`
  }
  return normalized
}
