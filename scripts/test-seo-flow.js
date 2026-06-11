#!/usr/bin/env node
/**
 * Verifica el flujo SEO: visitas, clics, engagement y dashboard.
 * Uso: node scripts/test-seo-flow.js [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3000'

async function post(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text.slice(0, 200) }
  }
  return { status: res.status, json }
}

async function get(path) {
  const res = await fetch(`${base}${path}`)
  const json = await res.json()
  return { status: res.status, json }
}

async function main() {
  const failures = []
  const ok = (name, cond, detail = '') => {
    if (cond) console.log(`  ✓ ${name}`)
    else {
      console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
      failures.push(name)
    }
  }

  console.log(`\nSEO flow test @ ${base}\n`)

  const visit = await post('/api/visits', { path: '/test-seo-page' })
  ok('POST visita', visit.status === 200 && typeof visit.json.pageVisits === 'number', JSON.stringify(visit.json))

  const click = await post('/api/visits', {
    type: 'click',
    path: '/test-seo-page',
    label: 'Botón prueba',
    target: '/carta'
  })
  ok('POST click', click.status === 200 && click.json.ok === true, JSON.stringify(click.json))

  const engagement = await post('/api/visits', {
    type: 'engagement',
    path: '/test-seo-page',
    durationSeconds: 42
  })
  ok('POST engagement', engagement.status === 200 && engagement.json.ok === true, JSON.stringify(engagement.json))

  const shortEng = await post('/api/visits', {
    type: 'engagement',
    path: '/test-seo-page',
    durationSeconds: 1
  })
  ok('Engagement <3s ignorado (API ok)', shortEng.status === 200)

  const seo = await get('/api/seo?days=30')
  ok('GET dashboard SEO', seo.status === 200 && typeof seo.json.totalVisits === 'number')
  ok('Dashboard incluye clics', seo.json.totalClicks >= 1)
  ok('Dashboard incluye páginas', Array.isArray(seo.json.pageStats))
  ok('Dashboard incluye topClicks', Array.isArray(seo.json.topClicks))

  const testPage = seo.json.pageStats?.find((p) => p.path === '/test-seo-page')
  ok('Página de prueba en stats', !!testPage, 'no encontrada en pageStats')
  if (testPage) {
    ok('Tiempo avg. correcto', testPage.avgTimeSeconds === 42, `got ${testPage.avgTimeSeconds}`)
  }

  const products = await get('/api/products')
  ok('API productos', products.status === 200 && Array.isArray(products.json))

  const showcase = await get('/api/showcase')
  ok('API showcase', showcase.status === 200)

  const auth = await get('/api/auth/login')
  ok('API auth', auth.status === 200 && typeof auth.json.authenticated === 'boolean')

  console.log('')
  if (failures.length) {
    console.log(`FALLÓ: ${failures.length} prueba(s)\n`)
    process.exit(1)
  }
  console.log('Todo OK\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
