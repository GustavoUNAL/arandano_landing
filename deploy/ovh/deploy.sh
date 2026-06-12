#!/bin/bash

###############################################################################
# Script de Despliegue Optimizado para OVH
# Arándano Café Bar
# 
# Este script despliega la aplicación de forma automática y optimizada
# Uso: bash deploy/ovh/deploy.sh
###############################################################################

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="${HOME}/arandano"
PM2_APP_NAME="arandano-app"
NODE_ENV="production"
PORT=3000

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 DESPLIEGUE AUTOMÁTICO - OVH${NC}"
echo -e "${BLUE}  Arándano Café Bar${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
        echo -e "${YELLOW}   📁 Cambiando al directorio: $PROJECT_DIR${NC}"
    else
        echo -e "${RED}❌ No se encontró package.json ni el directorio $PROJECT_DIR${NC}"
        exit 1
    fi
fi

CURRENT_DIR=$(pwd)
echo -e "${GREEN}📁 Directorio actual: $CURRENT_DIR${NC}"
echo ""

# 1. Verificar pre-requisitos
echo -e "${CYAN}1️⃣  Verificando pre-requisitos...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado. Ejecuta: bash deploy/ovh/setup-ovh.sh${NC}"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 no está instalado. Ejecuta: bash deploy/ovh/setup-ovh.sh${NC}"
    exit 1
fi

if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nginx no está instalado. Continuando sin Nginx...${NC}"
fi

echo -e "${GREEN}   ✅ Pre-requisitos verificados${NC}"
echo ""

# 2. Configurar variables de entorno
echo -e "${CYAN}2️⃣  Configurando variables de entorno...${NC}"

ENV_FILE=".env.local"

# Crear .env.local si no existe
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}   📄 Creando $ENV_FILE...${NC}"
    touch "$ENV_FILE"
fi

# Configurar DB_MODE si no existe (postgres si hay DATABASE_URL, si no sqlite)
if ! grep -q "^DB_MODE=" "$ENV_FILE"; then
    if grep -q "^DATABASE_URL=.\+" "$ENV_FILE" 2>/dev/null; then
        echo "DB_MODE=postgres" >> "$ENV_FILE"
        echo -e "${GREEN}   ✅ DB_MODE=postgres agregado (Neon)${NC}"
    else
        echo "DB_MODE=sqlite" >> "$ENV_FILE"
        echo -e "${GREEN}   ✅ DB_MODE=sqlite agregado${NC}"
    fi
elif grep -q "^DATABASE_URL=.\+" "$ENV_FILE" 2>/dev/null && grep -q "^DB_MODE=sqlite" "$ENV_FILE"; then
    echo -e "${YELLOW}   ⚠️  DATABASE_URL definido pero DB_MODE=sqlite — los datos nuevos NO van a Neon${NC}"
    if [ -f "data/arandano.db" ]; then
        SQLITE_USERS=$(sqlite3 data/arandano.db "SELECT COUNT(*) FROM sports_users;" 2>/dev/null || echo "0")
        if [ "$SQLITE_USERS" != "0" ]; then
            echo -e "${YELLOW}   ⚠️  Hay $SQLITE_USERS usuario(s) en SQLite sin migrar a Neon${NC}"
            echo -e "${CYAN}   → Ejecuta una vez: bash scripts/migrate-server-to-neon.sh${NC}"
        fi
    fi
fi

# Crear directorio data si no existe (sqlite / backups)
if [ ! -d "data" ]; then
    mkdir -p data
    echo -e "${GREEN}   ✅ Directorio data creado${NC}"
fi

if grep -q "^DB_MODE=postgres" "$ENV_FILE" 2>/dev/null; then
    if grep -q "^DATABASE_URL=.\+" "$ENV_FILE" 2>/dev/null; then
        echo -e "${GREEN}   ✅ Base de datos en la nube (PostgreSQL / Neon)${NC}"
    else
        echo -e "${RED}   ❌ DB_MODE=postgres pero falta DATABASE_URL en $ENV_FILE${NC}"
        exit 1
    fi
elif [ ! -f "data/arandano.db" ]; then
    echo -e "${YELLOW}   ⚠️  SQLite no encontrada en data/arandano.db — se creará al iniciar${NC}"
else
    echo -e "${GREEN}   ✅ Base de datos SQLite encontrada${NC}"
fi

echo ""

# 3. Instalar dependencias
echo -e "${CYAN}3️⃣  Instalando dependencias...${NC}"

if [ -f "package-lock.json" ]; then
    npm ci --production=false
    echo -e "${GREEN}   ✅ Dependencias instaladas (npm ci)${NC}"
elif [ -f "yarn.lock" ]; then
    yarn install --frozen-lockfile
    echo -e "${GREEN}   ✅ Dependencias instaladas (yarn)${NC}"
else
    npm install
    echo -e "${GREEN}   ✅ Dependencias instaladas (npm install)${NC}"
fi

echo ""

# 4. Verificar base de datos
echo -e "${CYAN}4️⃣  Verificando base de datos...${NC}"

if grep -q "^DB_MODE=postgres" "$ENV_FILE" 2>/dev/null; then
    if npm run check:neon 2>/dev/null; then
        echo -e "${GREEN}   ✅ Neon (PostgreSQL) accesible${NC}"
    else
        echo -e "${YELLOW}   ⚠️  No se pudo verificar Neon — revisa DATABASE_URL en .env.local${NC}"
    fi
elif [ -f "data/arandano.db" ]; then
    echo -e "${GREEN}   ✅ Base de datos SQLite encontrada${NC}"
    if command -v sqlite3 &> /dev/null; then
        bash scripts/backup-sqlite.sh 2>/dev/null && echo -e "${GREEN}   ✅ Backup SQLite creado${NC}" || true
    fi
else
    echo -e "${YELLOW}   ⚠️  Base de datos SQLite no existe — se creará al iniciar${NC}"
fi

echo ""

# 5. Crear build de producción
echo -e "${CYAN}5️⃣  Creando build de producción...${NC}"

# Limpiar build anterior
if [ -d ".next" ]; then
    rm -rf .next
    echo -e "${YELLOW}   🧹 Build anterior eliminado${NC}"
fi

# Crear nuevo build
export NODE_ENV=production
if npm run build; then
    echo -e "${GREEN}   ✅ Build completado exitosamente${NC}"
    
    # Verificar que el servidor standalone existe
    if [ -f ".next/standalone/server.js" ]; then
        echo -e "${GREEN}   ✅ Servidor standalone generado correctamente${NC}"
        
        # public/, .next/static y .env.local → standalone (también corre en npm postbuild)
        bash scripts/post-build-standalone.sh
        echo -e "${GREEN}   ✅ Assets standalone sincronizados (public + chunks JS)${NC}"

        echo -e "${GREEN}   ✅ Build standalone listo${NC}"
        if grep -q "^DB_MODE=postgres" "$ENV_FILE" 2>/dev/null; then
            echo -e "${GREEN}   ✅ BD remota: Neon (DATABASE_URL en .env.local)${NC}"
        else
            echo -e "${GREEN}   ✅ BD local: data/arandano.db (PROJECT_ROOT en ecosystem.config.js)${NC}"
        fi
    else
        echo -e "${RED}   ❌ Error: Servidor standalone no encontrado${NC}"
        echo -e "${YELLOW}   Verifica la configuración de next.config.js${NC}"
        exit 1
    fi
else
    echo -e "${RED}   ❌ Error en el build${NC}"
    echo -e "${YELLOW}   Ver logs para más detalles${NC}"
    exit 1
fi

echo ""

# 6. Gestionar aplicación con PM2
echo -e "${CYAN}6️⃣  Gestionando aplicación con PM2...${NC}"

# Detener aplicación si está corriendo
if pm2 list | grep -q "$PM2_APP_NAME"; then
    echo -e "${YELLOW}   🔄 Deteniendo aplicación anterior...${NC}"
    pm2 delete "$PM2_APP_NAME" || true
fi

# Crear directorio de logs si no existe
mkdir -p logs

# Verificar que el servidor standalone existe antes de iniciar
if [ ! -f ".next/standalone/server.js" ]; then
    echo -e "${RED}   ❌ Error: Servidor standalone no encontrado${NC}"
    echo -e "${YELLOW}   Ejecuta 'npm run build' primero${NC}"
    exit 1
fi

# Iniciar aplicación con PM2 usando ecosystem.config.js
echo -e "${YELLOW}   ▶️  Iniciando aplicación...${NC}"
if pm2 start ecosystem.config.js; then
    echo -e "${GREEN}   ✅ Aplicación iniciada con PM2${NC}"
else
    echo -e "${RED}   ❌ Error al iniciar con ecosystem.config.js${NC}"
    echo -e "${YELLOW}   Intentando método alternativo...${NC}"
    # Método alternativo: iniciar directamente el servidor standalone
    pm2 start .next/standalone/server.js --name "$PM2_APP_NAME" \
        --cwd "$(pwd)" \
        --env-file .env.local \
        --log-date-format "YYYY-MM-DD HH:mm:ss Z" \
        --error ./logs/pm2-error.log \
        --output ./logs/pm2-out.log \
        --merge-logs \
        --max-memory-restart 500M \
        --instances 1 \
        --exec-mode fork \
        --autorestart \
        --update-env
fi

# Guardar configuración de PM2
pm2 save

# Configurar PM2 para iniciar al arranque del sistema
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

echo -e "${GREEN}   ✅ Aplicación iniciada con PM2${NC}"
echo ""

# 7. Verificar que la aplicación funciona
echo -e "${CYAN}7️⃣  Verificando que la aplicación funciona...${NC}"

# Esperar unos segundos para que inicie
sleep 3

# Verificar estado
if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
    echo -e "${GREEN}   ✅ Aplicación está online${NC}"
    
    # Probar conexión local
    if curl -f http://localhost:$PORT > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Aplicación responde en el puerto $PORT${NC}"
    else
        echo -e "${YELLOW}   ⚠️  La aplicación no responde en el puerto $PORT${NC}"
        echo -e "${YELLOW}      Verifica los logs: pm2 logs $PM2_APP_NAME${NC}"
    fi
else
    echo -e "${RED}   ❌ Aplicación no está online${NC}"
    echo -e "${YELLOW}   📋 Ver logs: pm2 logs $PM2_APP_NAME --lines 50${NC}"
fi

echo ""

# 8. Configurar Nginx (si está instalado)
if command -v nginx &> /dev/null; then
    echo -e "${CYAN}8️⃣  Configurando Nginx...${NC}"
    
    NGINX_CONFIG="/etc/nginx/sites-available/$PM2_APP_NAME"
    
    # Verificar si el archivo de configuración ya existe
    if [ ! -f "$NGINX_CONFIG" ]; then
        echo -e "${YELLOW}   📄 Configuración de Nginx no encontrada${NC}"
        echo -e "${YELLOW}      Usa: deploy/ovh/configure-nginx.sh para configurar Nginx${NC}"
    else
        # Verificar configuración
        if sudo nginx -t; then
            # Recargar Nginx
            sudo systemctl reload nginx
            echo -e "${GREEN}   ✅ Nginx configurado y recargado${NC}"
        else
            echo -e "${RED}   ❌ Error en la configuración de Nginx${NC}"
        fi
    fi
    echo ""
fi

# Resumen final
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ DESPLIEGUE COMPLETADO${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📊 Estado de PM2:${NC}"
pm2 status
echo ""
echo -e "${CYAN}📋 Comandos útiles:${NC}"
echo "   - Ver logs:        ${GREEN}pm2 logs $PM2_APP_NAME${NC}"
echo "   - Ver logs en vivo: ${GREEN}pm2 logs $PM2_APP_NAME --lines 50 --raw${NC}"
echo "   - Ver estado:      ${GREEN}pm2 status${NC}"
echo "   - Reiniciar:       ${GREEN}pm2 restart $PM2_APP_NAME${NC}"
echo "   - Monitoreo:       ${GREEN}pm2 monit${NC}"
echo "   - Información:     ${GREEN}pm2 info $PM2_APP_NAME${NC}"
echo ""
echo -e "${CYAN}🔍 Verificar aplicación:${NC}"
echo "   - Local:           ${GREEN}curl http://localhost:$PORT${NC}"
if command -v nginx &> /dev/null; then
    echo "   - Nginx status:     ${GREEN}sudo systemctl status nginx${NC}"
fi
echo ""
echo -e "${CYAN}🔧 Diagnóstico:${NC}"
if grep -q "^DB_MODE=postgres" "$ENV_FILE" 2>/dev/null; then
    echo "   - Verificar Neon:   ${GREEN}npm run check:neon${NC}"
else
    echo "   - Verificar BD:     ${GREEN}ls -la data/arandano.db${NC}"
fi
echo "   - Test API:        ${GREEN}npm run test:api${NC}"
echo ""

