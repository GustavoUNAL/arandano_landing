const FORBIDDEN_PATTERNS = [
  /estoy\s+segur[oa]/i,
  /es\s+garantizad[oa]/i,
  /apuesta\s+todo/i,
  /seguro\s+que\s+ganará/i,
  /100\s*%\s+seguro/i,
]

const DISCLAIMER_PATTERNS = [
  /\*?\s*análisis informativo para la polla\.?\s*no garantiza resultados\.?\s*\*?/gi,
  /\*?\s*no garantiza resultados\.?\s*\*?/gi,
]

export function sanitizeAriResponse(text: string): string {
  let out = text.trim()
  for (const pattern of FORBIDDEN_PATTERNS) {
    out = out.replace(pattern, 'los datos sugieren')
  }
  for (const pattern of DISCLAIMER_PATTERNS) {
    out = out.replace(pattern, '')
  }
  return out.replace(/\n{3,}/g, '\n\n').trim()
}
