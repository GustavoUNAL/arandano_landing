#!/usr/bin/env bash
# Migración SEGURA servidor → Neon, ejecutada desde tu Mac.
# Hace backup en servidor + copia a tu Mac ANTES de tocar Neon.
#
# Uso:
#   bash scripts/remote-safe-migrate.sh
#   SSH_HOST=ubuntu@51.222.24.228 bash scripts/remote-safe-migrate.sh

set -euo pipefail

SSH_HOST="${SSH_HOST:-ubuntu@51.222.24.228}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_BACKUP_DIR="$ROOT/backups/off-server"
STAMP="$(date +%Y%m%d-%H%M%S)"

echo "══════════════════════════════════════════════════════════"
echo "  Migración segura: $SSH_HOST → Neon"
echo "  (backup remoto + copia local antes de migrar)"
echo "══════════════════════════════════════════════════════════"
echo ""

if ! ssh -o ConnectTimeout=20 -o BatchMode=yes "$SSH_HOST" 'echo ok' >/dev/null 2>&1; then
  echo "❌ No pude conectar por SSH a $SSH_HOST"
  echo "   Conéctate tú primero: ssh $SSH_HOST"
  echo "   Si usas contraseña, ejecuta en el servidor:"
  echo "   cd ~/arandano && bash scripts/migrate-server-to-neon.sh"
  exit 1
fi

REMOTE_DIR=$(ssh "$SSH_HOST" 'for d in ~/arandano ~/projects/arandano_landing ~/projects/arandano; do [ -d "$d" ] && echo "$d" && break; done')
if [[ -z "$REMOTE_DIR" ]]; then
  echo "❌ No encontré el proyecto en el servidor."
  exit 1
fi
echo "📁 Proyecto remoto: $REMOTE_DIR"

echo ""
echo "1️⃣  Conteo actual en SQLite del servidor..."
ssh "$SSH_HOST" "cd '$REMOTE_DIR' && sqlite3 data/arandano.db \"SELECT 'users='||(SELECT COUNT(*) FROM sports_users), ' preds='||(SELECT COUNT(*) FROM match_predictions);\" 2>/dev/null || echo 'sin sqlite'"

echo ""
echo "2️⃣  Backup en el servidor..."
ssh "$SSH_HOST" "cd '$REMOTE_DIR' && bash scripts/backup-sqlite.sh 2>/dev/null || (mkdir -p backups/sqlite data && cp data/arandano.db backups/sqlite/arandano-manual-$STAMP.db)"

echo ""
echo "3️⃣  Copiando backup a tu Mac (respaldo extra)..."
mkdir -p "$LOCAL_BACKUP_DIR"
scp "$SSH_HOST:$REMOTE_DIR/data/arandano.db" "$LOCAL_BACKUP_DIR/arandano-server-$STAMP.db"
echo "   ✅ Guardado en $LOCAL_BACKUP_DIR/arandano-server-$STAMP.db"

LATEST_REMOTE_BACKUP=$(ssh "$SSH_HOST" "ls -1t '$REMOTE_DIR'/backups/sqlite/arandano-*.db 2>/dev/null | head -1" || true)
if [[ -n "$LATEST_REMOTE_BACKUP" ]]; then
  scp "$SSH_HOST:$LATEST_REMOTE_BACKUP" "$LOCAL_BACKUP_DIR/" 2>/dev/null || true
fi

echo ""
echo "4️⃣  Asegurando DATABASE_URL en el servidor..."
REMOTE_HAS_URL=$(ssh "$SSH_HOST" "cd '$REMOTE_DIR' && grep -c '^DATABASE_URL=.' .env.local 2>/dev/null || echo 0")
if [[ "$REMOTE_HAS_URL" == "0" ]]; then
  if [[ -f "$ROOT/.env.remote" ]]; then
    scp "$ROOT/.env.remote" "$SSH_HOST:/tmp/arandano-env.remote"
    ssh "$SSH_HOST" "cd '$REMOTE_DIR' && touch .env.local && grep -q '^DATABASE_URL=.' .env.local || grep '^DATABASE_URL=' /tmp/arandano-env.remote >> .env.local; rm -f /tmp/arandano-env.remote"
    echo "   ✅ DATABASE_URL agregada desde .env.remote local"
  else
    echo "❌ Falta DATABASE_URL en servidor y no hay .env.remote local."
    exit 1
  fi
else
  echo "   ✅ DATABASE_URL ya configurada en servidor"
fi

echo ""
echo "5️⃣  Actualizando código en servidor..."
ssh "$SSH_HOST" "cd '$REMOTE_DIR' && git pull origin main 2>/dev/null || echo '(git pull omitido — usa scripts ya presentes)'"

echo ""
echo "6️⃣  Migrando SQLite → Neon (NO borra SQLite)..."
ssh "$SSH_HOST" "cd '$REMOTE_DIR' && NONINTERACTIVE=1 bash scripts/migrate-server-to-neon.sh"

echo ""
echo "7️⃣  Reiniciando app..."
ssh "$SSH_HOST" "cd '$REMOTE_DIR' && pm2 restart arandano-app 2>/dev/null || pm2 restart all 2>/dev/null || echo 'Reinicia PM2 manualmente'"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "✅ Migración completada"
echo "   · SQLite del servidor intacto en data/arandano.db"
echo "   · Backup en servidor: backups/sqlite/"
echo "   · Copia en tu Mac: $LOCAL_BACKUP_DIR/"
echo "   · App en modo DB_MODE=postgres → Neon"
echo "══════════════════════════════════════════════════════════"
