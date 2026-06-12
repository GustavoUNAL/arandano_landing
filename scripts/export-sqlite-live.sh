#!/usr/bin/env bash
# Export en caliente vía sqlite3 CLI (funciona con PM2 activo).
# Uso en servidor: bash scripts/export-sqlite-live.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB="${DATABASE_PATH:-$ROOT/data/arandano.db}"
OUT="$ROOT/backups/sqlite/arandano-export-clean.db"

mkdir -p "$(dirname "$OUT")"
rm -f "$OUT"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "Instalando sqlite3..."
  sudo apt-get update -qq && sudo apt-get install -y sqlite3
fi

echo "Origen: $DB"
sqlite3 "$DB" "SELECT 'Usuarios: '||COUNT(*) FROM sports_users;"
sqlite3 "$DB" "SELECT 'Pronósticos: '||COUNT(*) FROM match_predictions;"

echo "Exportando (backup en caliente)..."
sqlite3 "$DB" ".backup '$OUT'"

sqlite3 "$OUT" "SELECT 'Copia usuarios: '||COUNT(*) FROM sports_users;"
sqlite3 "$OUT" "SELECT 'Copia pronósticos: '||COUNT(*) FROM match_predictions;"
echo "OK: $OUT"
