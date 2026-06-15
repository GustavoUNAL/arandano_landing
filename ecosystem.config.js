/**
 * PM2 — Arándano Café Bar
 * Uso: npm run build && pm2 start ecosystem.config.js
 *
 * Carga .env.local de la raíz del repo en process.env (VAPID, DATABASE_URL, etc.).
 * El standalone también recibe copia en postbuild, pero PM2 inyecta las vars aquí.
 */

const path = require('path')
const { loadEnvFile } = require('./scripts/load-env-local')

const projectRoot = __dirname
const rootEnv = loadEnvFile(path.join(projectRoot, '.env.local'))
const standaloneEnv = loadEnvFile(path.join(projectRoot, '.next', 'standalone', '.env.local'))
const localEnv = { ...standaloneEnv, ...rootEnv }

module.exports = {
  apps: [
    {
      name: 'arandano-app',
      script: path.join(projectRoot, '.next', 'standalone', 'server.js'),
      cwd: path.join(projectRoot, '.next', 'standalone'),
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: path.join(projectRoot, 'logs', 'pm2-error.log'),
      out_file: path.join(projectRoot, 'logs', 'pm2-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        SITE_URL: 'https://arandanocafe.com',
        NEXT_PUBLIC_SITE_URL: 'https://arandanocafe.com',
        NEXTAUTH_URL: 'https://arandanocafe.com',
        AUTH_TRUST_HOST: 'true',
        PROJECT_ROOT: projectRoot,
        DATA_DIR: path.join(projectRoot, 'data'),
        DATABASE_PATH: path.join(projectRoot, 'data', 'arandano.db'),
        NEXT_PUBLIC_LIVE_WS: 'false',
        ...localEnv,
      },
    },
  ],
}
