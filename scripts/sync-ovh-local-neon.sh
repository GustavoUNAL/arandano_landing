#!/usr/bin/env bash
# Ruta completa: servidor OVH → Mac → Neon (nube)
# No borra SQLite en ningún lado; hace backups en cada paso.
#
# Uso (en tu Mac, con ssh ubuntu@51.222.24.228 funcionando):
#   npm run sync:ovh-neon

set -euo pipefail

SSH_HOST="${SSH_HOST:-ubuntu@51.222.24.228}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_LOCAL="$ROOT/.env.local"
ENV_REMOTE="$ROOT/.env.remote"
STAMP="$(date +%Y%m%d-%H%M%S)"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  SYNC: OVH → Mac → Neon (sin perder datos)                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── 0. DATABASE_URL ─────────────────────────────────────────────
if [[ ! -f "$ENV_REMOTE" ]] || ! grep -q '^DATABASE_URL=.' "$ENV_REMOTE"; then
  echo "❌ Crea .env.remote con DATABASE_URL=postgresql://..."
  exit 1
fi
DB_URL=$(grep '^DATABASE_URL=' "$ENV_REMOTE" | head -1 | cut -d= -f2-)
echo "✓ DATABASE_URL (Neon) configurada en .env.remote"

# ── 1. Backup + traer SQLite del servidor ─────────────────────
echo ""
echo "━━ Paso 1/4: Traer base del servidor OVH → Mac ━━"
bash "$ROOT/scripts/pull-server-db.sh"

LOCAL_DB="$ROOT/data/arandano.db"
USERS=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM sports_users;" 2>/dev/null || echo "0")
PREDS=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM match_predictions;" 2>/dev/null || echo "0")

if [[ "$USERS" == "0" && "$PREDS" == "0" ]]; then
  echo ""
  echo "⚠️  La copia del servidor no tiene usuarios."
  echo "   ¿Ruta distinta? REMOTE_DIR=~/projects/arandano_landing npm run sync:ovh-neon"
  exit 1
fi

# ── 2. Subir a Neon (upsert, no borra origen) ─────────────────
echo ""
echo "━━ Paso 2/4: Copiar SQLite → Neon (nube) ━━"
bash "$ROOT/scripts/backup-sqlite.sh"
npx tsx --env-file="$ENV_LOCAL" --env-file="$ENV_REMOTE" "$ROOT/scripts/init-neon-db.ts"
npx tsx --env-file="$ENV_LOCAL" --env-file="$ENV_REMOTE" "$ROOT/scripts/migrate-sqlite-to-neon.ts"

# ── 3. Activar postgres en local ────────────────────────────────
echo ""
echo "━━ Paso 3/4: Configurar Mac para usar Neon ━━"
if grep -q '^DB_MODE=' "$ENV_LOCAL"; then
  sed -i.bak 's/^DB_MODE=.*/DB_MODE=postgres/' "$ENV_LOCAL"
else
  echo "DB_MODE=postgres" >> "$ENV_LOCAL"
fi
if grep -q '^DATABASE_URL=' "$ENV_LOCAL"; then
  sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=$DB_URL|" "$ENV_LOCAL"
else
  echo "DATABASE_URL=$DB_URL" >> "$ENV_LOCAL"
fi
rm -f "$ENV_LOCAL.bak"
echo "   ✓ .env.local → DB_MODE=postgres + DATABASE_URL"

# ── 4. Instrucciones servidor ───────────────────────────────────
echo ""
echo "━━ Paso 4/4: Activar Neon en el servidor OVH ━━"
echo ""
echo "   Los datos ya están en Neon (paso 2). En el servidor solo cambia el modo:"
echo ""
echo "   ssh $SSH_HOST"
echo "   cd ~/arandano || cd ~/projects/arandano_landing"
echo "   bash scripts/backup-sqlite.sh"
echo "   # Agrega DATABASE_URL a .env.local si falta (misma que en .env.remote)"
echo "   sed -i.bak 's/^DB_MODE=.*/DB_MODE=postgres/' .env.local || echo DB_MODE=postgres >> .env.local"
echo "   cp .env.local .next/standalone/.env.local 2>/dev/null || true"
echo "   pm2 restart arandano-app"
echo ""
echo "   (Opcional en servidor: npm run migrate:remote-safe — backup + migración automática)"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Mac listo — local y nube usan la misma Neon              ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Respaldo Mac SQLite:  data/arandano.db                      ║"
echo "║  Respaldo extra:       backups/off-server/                  ║"
echo "║  Respaldo local:       backups/sqlite/                       ║"
echo "║  Reinicia dev:         npm run dev                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
