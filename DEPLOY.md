# Despliegue — Arándano Café Bar

Aplicación **Next.js 14** con **SQLite** (`better-sqlite3`) y polla mundialista.  
**Hosting recomendado:** VPS (OVH, EC2, etc.) con **Node 20+** y **PM2**. No usar Vercel/serverless (SQLite requiere disco persistente).

## Requisitos

- Node.js 20+
- PM2 (`npm i -g pm2`)
- Nginx (opcional, reverse proxy)
- Dominio con HTTPS (obligatorio para Google OAuth en producción)

## Variables de entorno

Copia `.env.example` → `.env.local` y completa:

| Variable | Descripción |
|----------|-------------|
| `DB_MODE` | `sqlite` en producción |
| `ADMIN_PASSWORD` | Panel admin interno |
| `NEXTAUTH_URL` | URL pública (`https://tudominio.com`) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `FOOTBALL_DATA_API_TOKEN` | API Mundial 2026 |

### Google OAuth (producción)

En [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Tipo: **Aplicación web**
2. URI de redirección: `https://TU-DOMINIO.com/api/auth/callback/google`
3. Orígenes autorizados: `https://TU-DOMINIO.com`

## Base de datos

- Archivo: `data/arandano.db`
- PM2 define `PROJECT_ROOT`, `DATA_DIR` y `DATABASE_PATH` en `ecosystem.config.js`
- La app **no** debe usar la copia dentro de `.next/standalone/data` — siempre la ruta del proyecto

### Backup antes de desplegar

```bash
bash scripts/backup-sqlite.sh
```

## Despliegue rápido (OVH)

```bash
# En el servidor
git pull
cp deploy/ovh/env.example .env.local   # solo la primera vez; editar valores
npm run pre-deploy                     # verifica env, BD y APIs
npm run deploy:ovh
```

## Despliegue manual

```bash
npm ci
npm run build   # postbuild copia public/ y .next/static → .next/standalone/
pm2 start ecosystem.config.js
pm2 save
```

Tras cada `npm run build`, el script `postbuild` ejecuta `scripts/post-build-standalone.sh` (copia `public/`, `.next/static` y `.env.local` al standalone). Sin esto, verás **ChunkLoadError 404** e imágenes rotas.

## Verificación

```bash
pm2 status
pm2 logs arandano-app
curl -s http://localhost:3000/api/sports/leaderboard | head
curl -s http://localhost:3000/api/football/world-cup | head
```

## Estructura de datos (polla)

Ver [`data/README.md`](data/README.md).

- Usuarios: `sports_users` (alias animal oculto, créditos, puntos)
- Pronósticos: `match_predictions` (liquidación automática al terminar partidos)
- Tabla en vivo: `GET /api/sports/leaderboard`

## Troubleshooting

| Problema | Solución |
|----------|----------|
| BD vacía tras deploy | Verificar `DATABASE_PATH` en PM2; no borrar `data/arandano.db` |
| Google login falla | `NEXTAUTH_URL` debe coincidir con el dominio; revisar redirect URI |
| `better-sqlite3` error | `npm rebuild better-sqlite3` en el servidor |
| Mundial sin datos | Revisar `FOOTBALL_DATA_API_TOKEN` |

## Scripts útiles

| Comando | Acción |
|---------|--------|
| `npm run pre-deploy` | Chequeo pre-producción |
| `npm run deploy:ovh` | Deploy automatizado OVH |
| `bash scripts/backup-sqlite.sh` | Backup de SQLite |
