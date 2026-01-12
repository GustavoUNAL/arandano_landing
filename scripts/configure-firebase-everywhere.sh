#!/bin/bash

# Script para configurar Firebase en ambos entornos (local y OVH)
# Este script asegura que DB_MODE=firebase esté configurado

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.local"

echo "═══════════════════════════════════════════════════════════"
echo "  🔧 CONFIGURANDO FIREBASE EN TODOS LOS ENTORNOS"
echo "═══════════════════════════════════════════════════════════"
echo ""

cd "$PROJECT_ROOT"

# Verificar que firebase-service-account.json existe
if [ ! -f "$PROJECT_ROOT/firebase-service-account.json" ]; then
  echo "❌ ERROR: No se encontró firebase-service-account.json"
  echo "   Por favor, coloca el archivo en la raíz del proyecto"
  exit 1
fi

echo "✅ firebase-service-account.json encontrado"
echo ""

# Crear .env.local si no existe
if [ ! -f "$ENV_FILE" ]; then
  echo "📝 Creando .env.local..."
  touch "$ENV_FILE"
fi

# Configurar DB_MODE=firebase
if grep -q "^DB_MODE=" "$ENV_FILE"; then
  # Si ya existe, actualizar
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' 's/^DB_MODE=.*/DB_MODE=firebase/' "$ENV_FILE"
  else
    # Linux
    sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' "$ENV_FILE"
  fi
  echo "✅ DB_MODE actualizado a 'firebase'"
else
  # Si no existe, agregar
  echo "DB_MODE=firebase" >> "$ENV_FILE"
  echo "✅ DB_MODE=firebase agregado"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📋 CONFIGURACIÓN ACTUAL"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "DB_MODE configurado:"
grep "^DB_MODE=" "$ENV_FILE" || echo "  (no encontrado - esto no debería pasar)"
echo ""
echo "Firebase Service Account:"
if [ -f "$PROJECT_ROOT/firebase-service-account.json" ]; then
  PROJECT_ID=$(node -e "const sa = require('./firebase-service-account.json'); console.log(sa.project_id);" 2>/dev/null || echo "error")
  echo "  ✅ Encontrado (proyecto: $PROJECT_ID)"
else
  echo "  ❌ No encontrado"
fi
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ CONFIGURACIÓN COMPLETA"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. LOCAL (tu Mac):"
echo "   - Ya está configurado con DB_MODE=firebase"
echo "   - Reinicia 'npm run dev' si está corriendo"
echo "   - Las ventas nuevas se guardarán en Firebase"
echo ""
echo "2. OVH (servidor):"
echo "   - Ejecuta este script en el servidor OVH también"
echo "   - O manualmente:"
echo "     echo 'DB_MODE=firebase' >> .env.local"
echo "   - Asegúrate de tener firebase-service-account.json en el servidor"
echo "   - Reinicia la aplicación con PM2"
echo ""
echo "3. Verificar:"
echo "   npm run diagnose:firebase"
echo ""
