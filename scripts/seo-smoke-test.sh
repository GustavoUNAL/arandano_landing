#!/usr/bin/env bash
# Verificación rápida del módulo SEO y APIs relacionadas
set -e
BASE="${1:-http://localhost:3000}"

echo "=== SEO smoke test ($BASE) ==="

# 1. Home page
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
echo "GET / -> $code"
[ "$code" = "200" ] || { echo "FAIL: home"; exit 1; }

# 2. Register visit
visit=$(curl -s -X POST "$BASE/api/visits" -H "Content-Type: application/json" -d '{"path":"/test-seo"}')
echo "POST visit -> $visit"
echo "$visit" | grep -q '"pageVisits"' || { echo "FAIL: visit response"; exit 1; }

# 3. Register click
click=$(curl -s -X POST "$BASE/api/visits" -H "Content-Type: application/json" -d '{"type":"click","path":"/test-seo","label":"Botón test","target":"/carta"}')
echo "POST click -> $click"
[ "$click" = '{"ok":true}' ] || { echo "FAIL: click"; exit 1; }

# 4. Register engagement (>= 3s)
engage=$(curl -s -X POST "$BASE/api/visits" -H "Content-Type: application/json" -d '{"type":"engagement","path":"/test-seo","durationSeconds":42}')
echo "POST engagement -> $engage"
[ "$engage" = '{"ok":true}' ] || { echo "FAIL: engagement"; exit 1; }

# 5. sendBeacon-style body (raw JSON text)
beacon=$(curl -s -X POST "$BASE/api/visits" -H "Content-Type: application/json" --data-binary '{"type":"engagement","path":"/test-seo","durationSeconds":60}')
echo "POST beacon-style -> $beacon"
[ "$beacon" = '{"ok":true}' ] || { echo "FAIL: beacon body"; exit 1; }

# 6. SEO dashboard
seo=$(curl -s "$BASE/api/seo?days=30")
echo "GET /api/seo -> $(echo "$seo" | head -c 120)..."
echo "$seo" | grep -q '"totalVisits"' || { echo "FAIL: seo dashboard"; exit 1; }
echo "$seo" | grep -q '"topClicks"' || { echo "FAIL: seo topClicks"; exit 1; }

# 7. SEO page loads
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/seo")
echo "GET /seo -> $code"
[ "$code" = "200" ] || { echo "FAIL: seo page"; exit 1; }

# 8. Other key pages
for path in /carrito /carta /admin /api/products; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  echo "GET $path -> $code"
  case "$path" in
    /api/products) [ "$code" = "200" ] || { echo "FAIL: $path"; exit 1; } ;;
    *) [ "$code" = "200" ] || { echo "FAIL: $path"; exit 1; } ;;
  esac
done

# 9. Icon
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/icon.svg")
echo "GET /icon.svg -> $code"
[ "$code" = "200" ] || { echo "FAIL: icon"; exit 1; }

echo ""
echo "=== All SEO smoke tests passed ==="
