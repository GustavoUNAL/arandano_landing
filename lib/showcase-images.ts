import fs from 'fs'
import path from 'path'
import { SHOWCASE_FALLBACK_IMAGES, type ShowcaseImage } from './showcase-config'

const SHOWCASE_DIR = path.join(process.cwd(), 'public', 'images', 'showcase')
const MANIFEST_PATH = path.join(process.cwd(), 'data', 'showcase-manifest.json')
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])

type ManifestEntry = { file: string; alt?: string }
type ManifestFile = { images: ManifestEntry[] } | ManifestEntry[]

function humanizeFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
  return base.charAt(0).toUpperCase() + base.slice(1)
}

function readManifest(): ManifestEntry[] {
  if (!fs.existsSync(MANIFEST_PATH)) return []
  try {
    const raw = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as ManifestFile
    const list = Array.isArray(raw) ? raw : raw.images
    if (!Array.isArray(list)) return []
    return list.filter((e) => e?.file && typeof e.file === 'string')
  } catch {
    return []
  }
}

function listImageFiles(): string[] {
  if (!fs.existsSync(SHOWCASE_DIR)) return []
  return fs
    .readdirSync(SHOWCASE_DIR)
    .filter((name) => {
      if (name.startsWith('.')) return false
      const ext = path.extname(name).toLowerCase()
      return ALLOWED_EXT.has(ext)
    })
    .sort((a, b) => a.localeCompare(b, 'es'))
}

/**
 * Imágenes del carrusel: lee public/images/showcase/ y opcionalmente data/showcase-manifest.json
 */
export function getShowcaseImages(): ShowcaseImage[] {
  const diskFiles = listImageFiles()
  const filesOnDisk = new Set(diskFiles)
  const manifest = readManifest()
  const used = new Set<string>()
  const result: ShowcaseImage[] = []

  for (const entry of manifest) {
    if (!filesOnDisk.has(entry.file)) continue
    used.add(entry.file)
    result.push({
      src: `/images/showcase/${entry.file}`,
      alt: entry.alt?.trim() || humanizeFilename(entry.file),
      filename: entry.file
    })
  }

  for (const file of diskFiles) {
    if (used.has(file)) continue
    result.push({
      src: `/images/showcase/${file}`,
      alt: humanizeFilename(file),
      filename: file
    })
  }

  if (result.length > 0) return result
  return SHOWCASE_FALLBACK_IMAGES
}
