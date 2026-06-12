#!/usr/bin/env bash
# Descarga data/arandano.db del servidor → Mac (copia consistente, sin error WAL).
#
# Uso:
#   npm run pull:server-db
#   REMOTE_DIR=~/projects/arandano_landing npm run pull:server-db

set -euo pipefail

SSH_HOST="${SSH_HOST:-ubuntu@51.222.24.228}"
REMOTE_DIR="${REMOTE_DIR:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_DB="$ROOT/data/arandano.db"
REMOTE_EXPORT="backups/sqlite/arandano-export-clean.db"
BACKUP="$ROOT/backups/sqlite/arandano-before-pull-$(date +%Y%m%d-%H%M%S).db"
OFF_SERVER="$ROOT/backups/off-server/arandano-server-$(date +%Y%m%d-%H%M%S).db"

mkdir -p "$ROOT/data" "$ROOT/backups/sqlite" "$ROOT/backups/off-server"

echo "══════════════════════════════════════════════════"
echo "  Traer base del servidor → Mac (copia limpia)"
echo "  Servidor: $SSH_HOST"
echo "══════════════════════════════════════════════════"
echo ""

if [[ -z "$REMOTE_DIR" ]]; then
  for candidate in ~/projects/arandano_landing ~/arandano ~/projects/arandano; do
    if ssh -o ConnectTimeout=20 "$SSH_HOST" "test -f $candidate/data/arandano.db" 2>/dev/null; then
      REMOTE_DIR="$candidate"
      break
    fi
  done
fi

if [[ -z "$REMOTE_DIR" ]]; then
  echo "❌ No encontré data/arandano.db en el servidor."
  exit 1
fi

echo "📁 Proyecto remoto: $REMOTE_DIR"
echo ""

echo "1️⃣  Export en caliente (PM2 puede seguir corriendo)..."
EXPORT_JSON=$(ssh "$SSH_HOST" "cd '$REMOTE_DIR' && node scripts/export-sqlite-live.js '$REMOTE_EXPORT' 2>&1") || {
  echo "$EXPORT_JSON"
  echo ""
  echo "   Si falla, en el servidor instala sqlite3 y usa:"
  echo "   sqlite3 data/arandano.db \".backup backups/sqlite/arandano-export-clean.db\""
  exit 1
}
echo "   $EXPORT_JSON"

echo ""
echo "2️⃣  Descargando..."
if [[ -f "$LOCAL_DB" ]]; then
  cp "$LOCAL_DB" "$BACKUP"
  echo "   Backup local anterior: $BACKUP"
fi
rm -f "$LOCAL_DB" "$LOCAL_DB-wal" "$LOCAL_DB-shm"

scp "$SSH_HOST:$REMOTE_DIR/$REMOTE_EXPORT" "$LOCAL_DB"
cp "$LOCAL_DB" "$OFF_SERVER"

USERS=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM sports_users;")
PREDS=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM match_predictions;")

echo ""
echo "✅ Base copiada a data/arandano.db"
echo "   sports_users: $USERS"
echo "   match_predictions: $PREDS"
echo ""
echo "   DB_MODE=sqlite en .env.local → npm run dev"

if [[ "$USERS" != "0" ]]; then
  echo ""
  echo "   Usuarios:"
  sqlite3 "$LOCAL_DB" "SELECT '   · '||email||COALESCE(' ('||displayAlias||')','') FROM sports_users LIMIT 20;"
fi
