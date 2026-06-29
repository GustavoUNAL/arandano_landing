#!/bin/bash
# Next.js standalone no incluye public/ ni .next/static — hay que copiarlos.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STANDALONE="$ROOT/.next/standalone"

if [ ! -f "$STANDALONE/server.js" ]; then
  echo "post-build-standalone: sin .next/standalone/server.js (¿output: standalone en next.config?)"
  exit 0
fi

echo "post-build-standalone: sincronizando assets al build standalone..."

if [ -d "$ROOT/.next/static" ]; then
  mkdir -p "$STANDALONE/.next"
  rm -rf "$STANDALONE/.next/static"
  cp -r "$ROOT/.next/static" "$STANDALONE/.next/static"
  echo "  ✓ .next/static"
else
  echo "  ⚠ .next/static no encontrado"
fi

if [ -d "$ROOT/public" ]; then
  rm -rf "$STANDALONE/public"
  cp -r "$ROOT/public" "$STANDALONE/public"
  echo "  ✓ public/"
else
  echo "  ⚠ public/ no encontrado"
fi

if [ -f "$ROOT/.env.local" ]; then
  cp "$ROOT/.env.local" "$STANDALONE/.env.local"
  echo "  ✓ .env.local"
fi

if [ -f "$ROOT/.env.production" ]; then
  cp "$ROOT/.env.production" "$STANDALONE/.env.production"
  echo "  ✓ .env.production"
fi

echo "post-build-standalone: listo"
