#!/usr/bin/env bash
# Migra SQLite local (p. ej. copiada del servidor) → Neon.
# Útil si no puedes ejecutar scripts en el VPS pero sí descargaste arandano.db.
#
#   SSH_HOST=usuario@servidor npm run pull:server-db
#   npm run migrate:local-to-neon

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Backup local..."
bash scripts/backup-sqlite.sh
echo ""

npx tsx --env-file=.env.local --env-file=.env.remote scripts/init-neon-db.ts
npx tsx --env-file=.env.local --env-file=.env.remote scripts/migrate-sqlite-to-neon.ts

echo ""
echo "Para usar Neon en local, agrega a .env.local:"
echo "  DB_MODE=postgres"
echo "  (DATABASE_URL ya está en .env.remote)"
