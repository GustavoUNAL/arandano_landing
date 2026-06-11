#!/usr/bin/env bash
# Backup de SQLite (incluye polla mundialista)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB="${DATABASE_PATH:-$ROOT/data/arandano.db}"
BACKUP_DIR="$ROOT/backups/sqlite"
STAMP="$(date +%Y%m%d-%H%M%S)"

if [[ ! -f "$DB" ]]; then
  echo "No se encontró la base de datos: $DB"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
DEST="$BACKUP_DIR/arandano-$STAMP.db"

sqlite3 "$DB" ".backup '$DEST'"
echo "Backup creado: $DEST"

# Mantener últimos 14 backups
ls -1t "$BACKUP_DIR"/arandano-*.db 2>/dev/null | tail -n +15 | xargs -r rm -f
