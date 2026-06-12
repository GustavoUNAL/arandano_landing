#!/bin/bash
# Configura .env.local en el VPS para PostgreSQL (Neon) + OAuth producción.
# Uso en el servidor: bash scripts/configure-server-env.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env.local"
EXAMPLE="$PROJECT_DIR/deploy/ovh/env.example"

echo "═══════════════════════════════════════════════════════════"
echo "  Configurar .env.local (Neon + producción)"
echo "═══════════════════════════════════════════════════════════"
echo ""

cd "$PROJECT_DIR"

if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$EXAMPLE" ]; then
    cp "$EXAMPLE" "$ENV_FILE"
    echo "✅ Creado $ENV_FILE desde deploy/ovh/env.example"
    echo "   Edita DATABASE_URL, NEXTAUTH_SECRET y credenciales Google."
  else
    touch "$ENV_FILE"
    echo "✅ Creado $ENV_FILE vacío"
  fi
fi

set_kv() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i.bak "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

# Base de datos remota
if ! grep -q "^DATABASE_URL=.\+" "$ENV_FILE" 2>/dev/null; then
  echo "⚠️  Falta DATABASE_URL — pégalo en $ENV_FILE (Neon → Connection string)"
else
  set_kv "DB_MODE" "postgres"
  echo "✅ DB_MODE=postgres"
fi

# URLs producción
set_kv "SITE_URL" "https://arandanocafe.com"
set_kv "NEXT_PUBLIC_SITE_URL" "https://arandanocafe.com"
set_kv "NEXTAUTH_URL" "https://arandanocafe.com"
set_kv "AUTH_TRUST_HOST" "true"
set_kv "NODE_ENV" "production"
set_kv "PORT" "3000"

echo "✅ URLs de producción y AUTH_TRUST_HOST"
echo ""
echo "Verifica manualmente en $ENV_FILE:"
echo "  DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,"
echo "  FOOTBALL_DATA_API_TOKEN, ADMIN_PASSWORD"
echo ""
echo "Luego:"
echo "  npm run check:neon"
echo "  npm run pre-deploy"
echo "  npm run deploy:ovh"
echo ""
