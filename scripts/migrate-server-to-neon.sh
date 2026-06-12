#!/usr/bin/env bash
# Migra data/arandano.db (SQLite) → Neon sin perder datos.
# Ejecutar EN EL SERVIDOR donde están los usuarios registrados.
#
# Uso:
#   bash scripts/migrate-server-to-neon.sh
#
# Requiere DATABASE_URL en .env.local (misma URL de Neon en local y servidor).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE=".env.local"
DB="data/arandano.db"

echo "══════════════════════════════════════════════════"
echo "  Migración SQLite → Neon (sin borrar origen)"
echo "══════════════════════════════════════════════════"
echo ""

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Falta $ENV_FILE"
  exit 1
fi

if ! grep -q "^DATABASE_URL=.\+" "$ENV_FILE" 2>/dev/null; then
  echo "❌ Falta DATABASE_URL en $ENV_FILE"
  echo "   Agrega la URL de Neon (console.neon.tech → Connection string)"
  exit 1
fi

if [[ ! -f "$DB" ]]; then
  echo "❌ No hay SQLite en $DB — no hay datos locales que migrar."
  exit 1
fi

USERS=$(sqlite3 "$DB" "SELECT COUNT(*) FROM sports_users;" 2>/dev/null || echo "0")
PREDS=$(sqlite3 "$DB" "SELECT COUNT(*) FROM match_predictions;" 2>/dev/null || echo "0")

echo "📊 Datos en SQLite del servidor:"
echo "   sports_users: $USERS"
echo "   match_predictions: $PREDS"
echo ""

if [[ "$USERS" == "0" && "$PREDS" == "0" ]]; then
  echo "⚠️  SQLite sin usuarios de la polla."
  if [[ "${NONINTERACTIVE:-}" != "1" ]]; then
    read -r -p "¿Continuar igual (solo esquema Neon)? [y/N] " ans
    [[ "${ans,,}" == "y" ]] || exit 0
  fi
fi

echo "1️⃣  Backup de SQLite (1/2)..."
bash scripts/backup-sqlite.sh
PRE_BACKUP="data/arandano.db.pre-neon-${STAMP:-$(date +%Y%m%d-%H%M%S)}.db"
cp "$DB" "$PRE_BACKUP"
echo "   ✅ Copia extra: $PRE_BACKUP"
echo ""

echo "2️⃣  Creando/actualizando esquema en Neon..."
npx tsx --env-file="$ENV_FILE" scripts/init-neon-db.ts
echo ""

echo "3️⃣  Copiando datos SQLite → Neon..."
npx tsx --env-file="$ENV_FILE" scripts/migrate-sqlite-to-neon.ts
echo ""

echo "4️⃣  Activando DB_MODE=postgres..."
if grep -q "^DB_MODE=" "$ENV_FILE"; then
  sed -i.bak 's/^DB_MODE=.*/DB_MODE=postgres/' "$ENV_FILE"
else
  echo "DB_MODE=postgres" >> "$ENV_FILE"
fi
echo "   ✅ DB_MODE=postgres"
echo ""

if [[ -f .next/standalone/.env.local ]]; then
  cp "$ENV_FILE" .next/standalone/.env.local
  echo "   ✅ .env.local copiado a standalone"
fi

echo "5️⃣  Reinicia la app:"
echo "   pm2 restart arandano-app"
echo ""
echo "✅ Listo. La app usará Neon; SQLite queda en data/ y backups/sqlite/ como respaldo."
echo "   En local usa la misma DATABASE_URL + DB_MODE=postgres para ver los mismos datos."
