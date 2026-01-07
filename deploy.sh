#!/bin/bash

# Script de despliegue automático para Arándano Café Bar
# Uso: bash deploy.sh
# Este script se ejecuta después de git pull en el servidor

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 DESPLIEGUE AUTOMÁTICO - ARÁNDANO CAFÉ BAR${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Detectar directorio del proyecto
if [ -f "package.json" ]; then
  PROJECT_DIR=$(pwd)
elif [ -d "$HOME/projects/arandano_landing" ]; then
  PROJECT_DIR="$HOME/projects/arandano_landing"
  cd "$PROJECT_DIR"
elif [ -d "/home/ubuntu/projects/arandano_landing" ]; then
  PROJECT_DIR="/home/ubuntu/projects/arandano_landing"
  cd "$PROJECT_DIR"
else
  echo -e "${RED}❌ No se encontró el directorio del proyecto${NC}"
  exit 1
fi

echo -e "${GREEN}📁 Directorio: $PROJECT_DIR${NC}"
echo ""

# 1. Configurar variables de entorno si no existen
echo -e "${BLUE}1️⃣  Configurando variables de entorno...${NC}"

ENV_FILE="$PROJECT_DIR/.env.local"

# Crear .env.local si no existe
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}   📄 Creando .env.local...${NC}"
  touch "$ENV_FILE"
fi

# Configurar DB_MODE si no existe
if ! grep -q "^DB_MODE=" "$ENV_FILE"; then
  echo "DB_MODE=firebase" >> "$ENV_FILE"
  echo -e "${GREEN}   ✅ DB_MODE=firebase agregado${NC}"
else
  # Asegurar que DB_MODE es firebase
  sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' "$ENV_FILE"
  echo -e "${GREEN}   ✅ DB_MODE configurado correctamente${NC}"
fi

# Verificar que firebase-service-account.json existe
if [ ! -f "$PROJECT_DIR/firebase-service-account.json" ]; then
  echo -e "${YELLOW}   ⚠️  firebase-service-account.json no encontrado${NC}"
  echo -e "${YELLOW}      Asegúrate de que el archivo existe en el directorio raíz${NC}"
else
  echo -e "${GREEN}   ✅ firebase-service-account.json encontrado${NC}"
  
  # Configurar FIREBASE_SERVICE_ACCOUNT si no existe y jq está disponible
  if ! grep -q "^FIREBASE_SERVICE_ACCOUNT=" "$ENV_FILE"; then
    if command -v jq &> /dev/null; then
      SERVICE_ACCOUNT_JSON=$(cat "$PROJECT_DIR/firebase-service-account.json" | jq -c .)
      SERVICE_ACCOUNT_ENV=$(echo "$SERVICE_ACCOUNT_JSON" | sed 's/"/\\"/g')
      echo "FIREBASE_SERVICE_ACCOUNT=\"$SERVICE_ACCOUNT_ENV\"" >> "$ENV_FILE"
      echo -e "${GREEN}   ✅ FIREBASE_SERVICE_ACCOUNT configurado${NC}"
    fi
  fi
fi

echo ""

# 2. Instalar dependencias
echo -e "${BLUE}2️⃣  Instalando dependencias...${NC}"

if [ -f "package-lock.json" ]; then
  npm ci --production=false
elif [ -f "yarn.lock" ]; then
  yarn install
else
  npm install
fi

echo -e "${GREEN}   ✅ Dependencias instaladas${NC}"
echo ""

# 3. Verificar configuración de Firebase
echo -e "${BLUE}3️⃣  Verificando configuración de Firebase...${NC}"

if npm run diagnose:firebase > /tmp/firebase-check.log 2>&1; then
  echo -e "${GREEN}   ✅ Firebase configurado correctamente${NC}"
else
  echo -e "${YELLOW}   ⚠️  Advertencias en configuración de Firebase (ver /tmp/firebase-check.log)${NC}"
fi

echo ""

# 4. Crear build
echo -e "${BLUE}4️⃣  Creando build de producción...${NC}"

if npm run build; then
  echo -e "${GREEN}   ✅ Build completado exitosamente${NC}"
else
  echo -e "${RED}   ❌ Error en el build${NC}"
  exit 1
fi

echo ""

# 5. Reiniciar PM2
echo -e "${BLUE}5️⃣  Reiniciando aplicación con PM2...${NC}"

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}   ⚠️  PM2 no está instalado. Instalando...${NC}"
  sudo npm install -g pm2
fi

# Verificar si la app ya está corriendo
if pm2 list | grep -q "arandano-app"; then
  echo -e "${YELLOW}   🔄 Reiniciando aplicación...${NC}"
  pm2 restart arandano-app --update-env
else
  echo -e "${YELLOW}   ▶️  Iniciando aplicación...${NC}"
  pm2 start npm --name "arandano-app" -- start --update-env
  pm2 save
fi

echo -e "${GREEN}   ✅ Aplicación reiniciada${NC}"
echo ""

# 6. Verificar que funciona
echo -e "${BLUE}6️⃣  Verificando que la aplicación funciona...${NC}"

# Esperar unos segundos para que inicie
sleep 3

# Verificar estado
if pm2 list | grep -q "arandano-app.*online"; then
  echo -e "${GREEN}   ✅ Aplicación está online${NC}"
else
  echo -e "${RED}   ❌ Aplicación no está online${NC}"
  echo -e "${YELLOW}   📋 Ver logs: pm2 logs arandano-app --lines 50${NC}"
fi

echo ""

# 7. Mostrar resumen
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ DESPLIEGUE COMPLETADO${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Estado de PM2:${NC}"
pm2 status
echo ""
echo -e "${BLUE}💡 Comandos útiles:${NC}"
echo "   - Ver logs: ${GREEN}pm2 logs arandano-app${NC}"
echo "   - Ver estado: ${GREEN}pm2 status${NC}"
echo "   - Reiniciar: ${GREEN}pm2 restart arandano-app${NC}"
echo "   - Monitoreo: ${GREEN}pm2 monit${NC}"
echo ""
echo -e "${BLUE}🔍 Verificar configuración:${NC}"
echo "   - Diagnóstico Firebase: ${GREEN}npm run diagnose:firebase${NC}"
echo "   - Probar APIs: ${GREEN}curl http://localhost:3000/api/products${NC}"
echo ""
