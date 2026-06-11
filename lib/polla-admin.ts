/** Admin de la polla mundialista (gestión de pasaportes). */

const DEFAULT_ADMIN_EMAILS = ['gustavoarteaga0508@gmail.com']

export function getPollAdminEmails(): string[] {
  const raw = process.env.POLL_ADMIN_EMAILS ?? process.env.POLL_ADMIN_EMAIL
  if (raw?.trim()) {
    return raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  }
  return DEFAULT_ADMIN_EMAILS
}

export function isPollAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return getPollAdminEmails().includes(email.toLowerCase())
}
