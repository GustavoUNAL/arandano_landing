#!/usr/bin/env bash
# Activa Neon (PostgreSQL) en el servidor OVH — misma BD que local.
# Ejecutar desde tu Mac (con SSH configurado):
#
#   npm run server:enable-neon
#   SSH_HOST=ubuntu@51.222.24.228 npm run server:enable-neon
#
# No re-migra SQLite si Neon ya tiene los datos (recomendado tras migrate desde Mac).
# Opcional: MIGRATE_SERVER_SQLITE=1 para fusionar SQLite del VPS → Neon antes de activar.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SSH_HOST="${SSH_HOST:-ubuntu@51.222.24.228}"
ENV_LOCAL="$ROOT/.env.local"

echo "══════════════════════════════════════════════════════════"
echo "  Activar base remota (Neon) en el servidor"
echo "  Host: $SSH_HOST"
echo "══════════════════════════════════════════════════════════"
echo ""

if [[ ! -f "$ENV_LOCAL" ]]; then
  echo "❌ Falta .env.local en tu Mac (con DATABASE_URL de Neon)."
  exit 1
fi

DATABASE_URL=$(grep '^DATABASE_URL=' "$ENV_LOCAL" | head -1 | cut -d= -f2- || true)
if [[ -z "$DATABASE_URL" ]]; then
  echo "❌ DATABASE_URL no encontrado en .env.local"
  exit 1
fi

if ! ssh -o ConnectTimeout=20 "$SSH_HOST" 'echo ok' >/dev/null 2>&1; then
  echo "❌ No hay conexión SSH a $SSH_HOST"
  echo ""
  echo "Conéctate manualmente y ejecuta en el servidor:"
  echo "  cd ~/projects/arandano_landing"
  echo "  git pull origin main"
  echo "  bash scripts/configure-server-env.sh"
  echo "  # Edita .env.local: pega DATABASE_URL y secretos de Google/NextAuth"
  echo "  npm run check:neon"
  echo "  npm run deploy:ovh"
  exit 1
fi

REMOTE_DIR=$(ssh "$SSH_HOST" 'for d in ~/projects/arandano_landing ~/arandano ~/projects/arandano; do [ -d "$d/.git" ] && echo "$d" && break; done')
if [[ -z "$REMOTE_DIR" ]]; then
  REMOTE_DIR=$(ssh "$SSH_HOST" 'for d in ~/projects/arandano_landing ~/arandano; do [ -d "$d" ] && echo "$d" && break; done')
fi
if [[ -z "$REMOTE_DIR" ]]; then
  echo "❌ No encontré el proyecto en el servidor."
  exit 1
fi
echo "📁 Proyecto: $REMOTE_DIR"

# Secretos de producción (desde .env.local local si existen)
NEXTAUTH_SECRET=$(grep '^NEXTAUTH_SECRET=' "$ENV_LOCAL" | head -1 | cut -d= -f2- || true)
GOOGLE_CLIENT_ID=$(grep '^GOOGLE_CLIENT_ID=' "$ENV_LOCAL" | head -1 | cut -d= -f2- || true)
GOOGLE_CLIENT_SECRET=$(grep '^GOOGLE_CLIENT_SECRET=' "$ENV_LOCAL" | head -1 | cut -d= -f2- || true)
FOOTBALL_TOKEN=$(grep '^FOOTBALL_DATA_API_TOKEN=' "$ENV_LOCAL" | head -1 | cut -d= -f2- || true)
ADMIN_PASSWORD=$(grep '^ADMIN_PASSWORD=' "$ENV_LOCAL" | head -1 | cut -d= -f2- || true)
POLL_ADMIN=$(grep '^POLL_ADMIN_EMAIL=' "$ENV_LOCAL" | head -1 | cut -d= -f2- || true)

echo ""
echo "1️⃣  git pull..."
ssh "$SSH_HOST" "cd '$REMOTE_DIR' && git pull origin main"

echo ""
echo "2️⃣  Configurando .env.local en servidor (Neon + URLs producción)..."
ssh "$SSH_HOST" "cd '$REMOTE_DIR' && touch .env.local"

set_remote_kv() {
  local key="$1"
  local value="$2"
  ssh "$SSH_HOST" "cd '$REMOTE_DIR' && if grep -q '^${key}=' .env.local; then sed -i.bak 's|^${key}=.*|${key}=${value}|' .env.local; else echo '${key}=${value}' >> .env.local; fi"
}

# Escapar & para sed en DATABASE_URL
DB_ESCAPED=$(printf '%s' "$DATABASE_URL" | sed 's/[&|]/\\&/g')
ssh "$SSH_HOST" "cd '$REMOTE_DIR' && if grep -q '^DATABASE_URL=' .env.local; then sed -i.bak 's|^DATABASE_URL=.*|DATABASE_URL=${DB_ESCAPED}|' .env.local; else echo 'DATABASE_URL=${DB_ESCAPED}' >> .env.local; fi"

set_remote_kv "DB_MODE" "postgres"
set_remote_kv "SITE_URL" "https://arandanocafe.com"
set_remote_kv "NEXT_PUBLIC_SITE_URL" "https://arandanocafe.com"
set_remote_kv "NEXTAUTH_URL" "https://arandanocafe.com"
set_remote_kv "AUTH_TRUST_HOST" "true"
set_remote_kv "NODE_ENV" "production"
set_remote_kv "PORT" "3000"

[[ -n "$NEXTAUTH_SECRET" ]] && set_remote_kv "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"
[[ -n "$GOOGLE_CLIENT_ID" ]] && set_remote_kv "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
[[ -n "$GOOGLE_CLIENT_SECRET" ]] && set_remote_kv "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"
[[ -n "$FOOTBALL_TOKEN" ]] && set_remote_kv "FOOTBALL_DATA_API_TOKEN" "$FOOTBALL_TOKEN"
[[ -n "$ADMIN_PASSWORD" ]] && set_remote_kv "ADMIN_PASSWORD" "$ADMIN_PASSWORD"
[[ -n "$POLL_ADMIN" ]] && set_remote_kv "POLL_ADMIN_EMAIL" "$POLL_ADMIN"

echo "   ✅ DB_MODE=postgres + DATABASE_URL (Neon)"

if [[ "${MIGRATE_SERVER_SQLITE:-}" == "1" ]]; then
  echo ""
  echo "3️⃣  Migrando SQLite del servidor → Neon (opcional)..."
  ssh "$SSH_HOST" "cd '$REMOTE_DIR' && NONINTERACTIVE=1 bash scripts/migrate-server-to-neon.sh"
else
  echo ""
  echo "3️⃣  Omitiendo migración SQLite (Neon ya tiene datos desde local)."
  echo "   Para fusionar SQLite del VPS: MIGRATE_SERVER_SQLITE=1 npm run server:enable-neon"
fi

echo ""
echo "4️⃣  Sincronizando catálogo Mundial → Neon..."
ssh "$SSH_HOST" "cd '$REMOTE_DIR' && npm run sync:sports-football" || echo "   ⚠️  sync:sports-football falló (revisa FOOTBALL_DATA_API_TOKEN)"

echo ""
echo "5️⃣  Verificando Neon desde el servidor..."
ssh "$SSH_HOST" "cd '$REMOTE_DIR' && npm run check:neon" || true

echo ""
echo "6️⃣  Build + PM2..."
ssh "$SSH_HOST" "cd '$REMOTE_DIR' && npm run deploy:ovh"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "✅ Servidor configurado con Neon"
echo "   Verifica: https://arandanocafe.com/perfil"
echo "   Logs: ssh $SSH_HOST 'pm2 logs arandano-app --lines 30'"
echo "══════════════════════════════════════════════════════════"
