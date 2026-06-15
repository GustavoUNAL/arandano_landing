#!/usr/bin/env node
/** Verifica VAPID en .env.local (ejecutar en el servidor antes del build) */
const path = require('path')
const { loadEnvFile } = require('./load-env-local')

const root = path.join(__dirname, '..')
const env = loadEnvFile(path.join(root, '.env.local'))

const publicKey = env.VAPID_PUBLIC_KEY || env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateKey = env.VAPID_PRIVATE_KEY
const subject = env.VAPID_SUBJECT

let ok = true

if (!publicKey) {
  console.error('❌ Falta VAPID_PUBLIC_KEY en .env.local')
  ok = false
}
if (!privateKey) {
  console.error('❌ Falta VAPID_PRIVATE_KEY en .env.local')
  ok = false
}
if (!subject) {
  console.error('❌ Falta VAPID_SUBJECT en .env.local (ej: mailto:tu@email.com)')
  ok = false
}

if (ok) {
  console.log('✅ Push VAPID configurado en .env.local')
  console.log('   Public:', publicKey.slice(0, 20) + '…')
  process.exit(0)
}

console.error('\nGenera claves: npx web-push generate-vapid-keys')
process.exit(1)
