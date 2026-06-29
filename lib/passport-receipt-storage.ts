import fs from 'fs'
import path from 'path'
import { ensureDataDir } from '@/lib/db-path'

const RECEIPTS_DIR = 'passport-receipts'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

function receiptsDir(): string {
  const dir = path.join(ensureDataDir(), RECEIPTS_DIR)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function extForMime(mime: string): string {
  if (mime === 'image/jpeg') return '.jpg'
  if (mime === 'image/png') return '.png'
  if (mime === 'image/webp') return '.webp'
  if (mime === 'application/pdf') return '.pdf'
  return '.bin'
}

export function validatePassportReceiptFile(file: File): void {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Adjunta una imagen (JPG, PNG, WebP) o PDF del comprobante.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('El comprobante no puede superar 5 MB.')
  }
}

export async function savePassportReceipt(
  requestId: string,
  file: File
): Promise<string> {
  validatePassportReceiptFile(file)
  const ext = extForMime(file.type)
  const filename = `${requestId}${ext}`
  const fullPath = path.join(receiptsDir(), filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(fullPath, buffer)
  return path.join(RECEIPTS_DIR, filename)
}

export function resolvePassportReceiptPath(relativePath: string): string | null {
  if (!relativePath || relativePath.includes('..')) return null
  const full = path.join(ensureDataDir(), relativePath)
  if (!fs.existsSync(full)) return null
  return full
}
