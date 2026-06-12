# Despliegue — Arándano Café Bar

Aplicación **Next.js 14** con polla mundialista.  
**Base de datos recomendada:** **PostgreSQL (Neon)** — misma URL en local y VPS.  
**Hosting:** VPS (OVH) con **Node 20+**, **PM2** y **Nginx**.

## Requisitos

- Node.js 20+
- PM2 (`npm i -g pm2`)
- Nginx (reverse proxy + HTTPS)
- Cuenta [Neon](https://neon.tech) con `DATABASE_URL`
- Dominio con HTTPS (obligatorio para Google OAuth)

## Variables de entorno (`.env.local`)

Copia `deploy/ovh/env.example` → `.env.local` y completa:

| Variable | Descripción |
|----------|-------------|
| `DB_MODE` | `postgres` (producción y local sincronizados) |
| `DATABASE_URL` | Connection string de Neon (`?sslmode=require`) |
| `SITE_URL` / `NEXTAUTH_URL` | `https://arandanocafe.com` |
| `AUTH_TRUST_HOST` | `true` (detrás de Nginx) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `FOOTBALL_DATA_API_TOKEN` | API Mundial 2026 |
| `ADMIN_PASSWORD` | Panel admin interno |

### Google OAuth (producción)

En [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. URI de redirección: `https://arandanocafe.com/api/auth/callback/google`
2. Orígenes: `https://arandanocafe.com`

## Base de datos Neon

La app usa **PostgreSQL**. Las columnas en Neon se crean en **minúsculas** (`updatedat`, `displayalias`).  
En código Node la capa `lib/db.ts` las normaliza a camelCase; en el **SQL Editor de Neon** usa minúsculas:

```sql
SELECT email, displayalias, credits, totalpoints, updatedat
FROM sports_users
ORDER BY updatedat DESC
LIMIT 10;

SELECT COUNT(*) AS usuarios FROM sports_users;
SELECT COUNT(*) AS pronosticos FROM match_predictions;
```

### Verificar conexión (local o VPS)

```bash
npm run check:neon
```

### Migrar SQLite del VPS → Neon (una vez)

```bash
npm run pull:server-db      # descarga BD del servidor (opcional)
npm run migrate:local-to-neon
npm run sync:sports-football
```

### Catálogo Mundial (equipos/partidos)

```bash
npm run sync:sports-football
```

## Despliegue en el VPS (OVH)

```bash
ssh ubuntu@TU_SERVIDOR
cd ~/projects/arandano_landing   # o ~/arandano según tu instalación

git pull
bash scripts/configure-server-env.sh   # primera vez: revisa .env.local
npm run check:neon                     # debe mostrar usuarios y picks
npm run pre-deploy
npm run deploy:ovh
pm2 restart arandano-app --update-env
```

## Despliegue manual

```bash
npm ci
npm run build   # postbuild copia public/, static y .env.local → standalone
pm2 start ecosystem.config.js
pm2 save
```

Tras cada `npm run build`, `scripts/post-build-standalone.sh` copia assets al standalone. Sin esto: **ChunkLoadError 404**.

## Verificación post-deploy

```bash
pm2 status
pm2 logs arandano-app --lines 30
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" http://localhost:3000/api/football/world-cup
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" http://localhost:3000/api/sports/leaderboard
npm run check:neon
```

## Estructura de datos (polla)

- Usuarios: `sports_users`
- Pronósticos: `match_predictions`
- Catálogo: `sports_teams`, `sports_matches`
- Ranking: `GET /api/sports/leaderboard`

## Troubleshooting

| Problema | Solución |
|----------|----------|
| APIs tardan minutos / no cargan | Reiniciar PM2 tras actualizar código (`lib/db.ts` deadlock fix). `npm run check:neon` debe responder en &lt;15 s |
| Usuario no aparece tras login | `DB_MODE=postgres` + misma `DATABASE_URL` en VPS y local |
| Google login falla | `NEXTAUTH_URL=https://arandanocafe.com`, `AUTH_TRUST_HOST=true` |
| Error SQL `column "updatedAt" does not exist` | En Neon usar `updatedat` (minúsculas), ver arriba |
| Mundial sin equipos | `npm run sync:sports-football` |
| Fallback SQLite en VPS | Solo si `DB_MODE=sqlite`; datos **no** se sincronizan con Neon |

## Scripts útiles

| Comando | Acción |
|---------|--------|
| `npm run check:neon` | Verifica Neon y muestra SQL correcto |
| `npm run pre-deploy` | Chequeo pre-producción |
| `npm run deploy:ovh` | Deploy automatizado OVH |
| `npm run sync:sports-football` | Sincroniza catálogo Mundial → Neon |
| `bash scripts/backup-sqlite.sh` | Backup SQLite (solo modo sqlite) |
