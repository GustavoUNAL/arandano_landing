#!/bin/bash

# Script para configurar variables de entorno en el servidor
# Uso: bash scripts/configure-server-env.sh

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
ENV_FILE="$PROJECT_DIR/.env.local"

echo "═══════════════════════════════════════════════════════════"
echo "  🔧 CONFIGURAR VARIABLES DE ENTORNO DEL SERVIDOR"
echo "═══════════════════════════════════════════════════════════"
echo ""

cd "$PROJECT_DIR"

# Verificar si .env.local existe
if [ ! -f "$ENV_FILE" ]; then
  echo "📄 Creando .env.local..."
  touch "$ENV_FILE"
fi

echo "📝 Configurando variables de entorno..."
echo ""

# Configurar DB_MODE si no existe
if ! grep -q "^DB_MODE=" "$ENV_FILE"; then
  echo "DB_MODE=firebase" >> "$ENV_FILE"
  echo "✅ DB_MODE=firebase agregado"
else
  # Actualizar si existe pero con valor diferente
  sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' "$ENV_FILE"
  echo "✅ DB_MODE actualizado a firebase"
fi

# Configurar Firebase Service Account si no existe y el archivo está disponible
SERVICE_ACCOUNT_FILE="$PROJECT_DIR/firebase-service-account.json"
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
  echo ""
  echo "⚠️  firebase-service-account.json no encontrado"
  echo "   Ubicación esperada: $SERVICE_ACCOUNT_FILE"
  echo ""
  echo "💡 Opciones:"
  echo "   1. Descargar desde Firebase Console"
  echo "   2. Subir el archivo al servidor"
  echo "   3. O configurar FIREBASE_SERVICE_ACCOUNT manualmente en .env.local"
else
  if ! grep -q "^FIREBASE_SERVICE_ACCOUNT=" "$ENV_FILE"; then
    echo ""
    echo "📝 Configurando FIREBASE_SERVICE_ACCOUNT..."
    
    if command -v jq &> /dev/null; then
      SERVICE_ACCOUNT_JSON=$(cat "$SERVICE_ACCOUNT_FILE" | jq -c .)
      SERVICE_ACCOUNT_ENV=$(echo "$SERVICE_ACCOUNT_JSON" | sed 's/"/\\"/g')
      echo "FIREBASE_SERVICE_ACCOUNT=\"$SERVICE_ACCOUNT_ENV\"" >> "$ENV_FILE"
      echo "✅ FIREBASE_SERVICE_ACCOUNT configurado"
    else
      echo "⚠️  jq no está instalado. Instálalo con: sudo apt-get install jq"
      echo "   O configura FIREBASE_SERVICE_ACCOUNT manualmente en .env.local"
    fi
  else
    echo "✅ FIREBASE_SERVICE_ACCOUNT ya está configurado"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ CONFIGURACIÓN COMPLETADA"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Variables configuradas en .env.local:"
grep -E "^DB_MODE=|^FIREBASE_SERVICE_ACCOUNT=" "$ENV_FILE" | sed 's/FIREBASE_SERVICE_ACCOUNT=.*/FIREBASE_SERVICE_ACCOUNT=[configurado]/'
echo ""
echo "💡 Próximos pasos:"
echo "   1. Reiniciar aplicación: pm2 restart all --update-env"
echo "   2. Verificar logs: pm2 logs arandano-app --lines 20"
echo "   3. Verificar configuración: npm run diagnose:firebase"
echo ""

