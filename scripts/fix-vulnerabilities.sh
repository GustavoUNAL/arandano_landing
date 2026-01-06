#!/bin/bash

# Script para resolver vulnerabilidades en el servidor EC2
# Uso: bash scripts/fix-vulnerabilities.sh

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  🔒 RESOLVIENDO VULNERABILIDADES"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json no encontrado${NC}"
    echo "   Asegúrate de estar en el directorio del proyecto"
    exit 1
fi

echo -e "${GREEN}📦 Actualizando dependencias...${NC}"

# Limpiar cache
echo "   Limpiando cache de npm..."
npm cache clean --force

# Actualizar dependencias de forma segura
echo ""
echo -e "${GREEN}1️⃣  Actualizando Firebase a versiones más recientes...${NC}"
npm install firebase@latest firebase-admin@latest --save

echo ""
echo -e "${GREEN}2️⃣  Actualizando otras dependencias...${NC}"
npm update

echo ""
echo -e "${GREEN}3️⃣  Intentando resolver vulnerabilidades automáticamente...${NC}"
npm audit fix || echo "   Algunas vulnerabilidades pueden requerir atención manual"

echo ""
echo -e "${YELLOW}4️⃣  Verificando vulnerabilidades restantes...${NC}"
npm audit

echo ""
echo -e "${GREEN}✅ Proceso completado${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Revisa las vulnerabilidades que quedan (si las hay)"
echo "   2. Prueba el build: npm run build"
echo "   3. Si el build funciona, las vulnerabilidades menores son aceptables"
echo ""

