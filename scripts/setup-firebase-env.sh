#!/bin/bash

# Script para configurar FIREBASE_SERVICE_ACCOUNT como variable de entorno
# Uso: bash scripts/setup-firebase-env.sh

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
ENV_FILE="$PROJECT_DIR/.env.local"
SERVICE_ACCOUNT_FILE="$PROJECT_DIR/firebase-service-account.json"

echo "═══════════════════════════════════════════════════════════"
echo "  🔧 CONFIGURAR FIREBASE SERVICE ACCOUNT EN .env.local"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Verificar que el archivo existe
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
  echo "❌ Error: firebase-service-account.json no encontrado en:"
  echo "   $SERVICE_ACCOUNT_FILE"
  echo ""
  echo "💡 Soluciones:"
  echo "   1. Descarga el archivo desde Firebase Console"
  echo "   2. Colócalo en: $PROJECT_DIR/"
  exit 1
fi

echo "✅ Archivo encontrado: $SERVICE_ACCOUNT_FILE"
echo ""

# Verificar si jq está instalado
if ! command -v jq &> /dev/null; then
  echo "⚠️  jq no está instalado. Instalando..."
  sudo apt-get update && sudo apt-get install -y jq
fi

# Leer y convertir el JSON a una línea
echo "📝 Leyendo archivo y convirtiendo a formato de variable..."
SERVICE_ACCOUNT_JSON=$(cat "$SERVICE_ACCOUNT_FILE" | jq -c .)

# Verificar que se leyó correctamente
if [ -z "$SERVICE_ACCOUNT_JSON" ]; then
  echo "❌ Error: No se pudo leer el archivo JSON"
  exit 1
fi

# Escapar comillas dobles para .env
SERVICE_ACCOUNT_ENV=$(echo "$SERVICE_ACCOUNT_JSON" | sed 's/"/\\"/g')

# Crear o actualizar .env.local
if [ ! -f "$ENV_FILE" ]; then
  echo "📄 Creando .env.local..."
  touch "$ENV_FILE"
fi

# Eliminar línea antigua de FIREBASE_SERVICE_ACCOUNT si existe
sed -i '/^FIREBASE_SERVICE_ACCOUNT=/d' "$ENV_FILE"

# Agregar nueva línea
echo "FIREBASE_SERVICE_ACCOUNT=\"$SERVICE_ACCOUNT_ENV\"" >> "$ENV_FILE"

# Asegurar que DB_MODE esté configurado
if ! grep -q "^DB_MODE=" "$ENV_FILE"; then
  echo "DB_MODE=firebase" >> "$ENV_FILE"
  echo "✅ DB_MODE=firebase agregado"
fi

echo ""
echo "✅ Configuración completada!"
echo ""
echo "📋 Archivo .env.local actualizado:"
echo "   - FIREBASE_SERVICE_ACCOUNT configurado"
echo "   - DB_MODE=firebase configurado"
echo ""
echo "💡 Próximos pasos:"
echo "   1. Reiniciar aplicación: pm2 restart all --update-env"
echo "   2. Verificar logs: pm2 logs | grep '\[DB\]'"
echo ""

