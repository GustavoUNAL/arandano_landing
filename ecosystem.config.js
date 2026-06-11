/**
 * PM2 — Arándano Café Bar
 * Uso: npm run build && pm2 start ecosystem.config.js
 *
 * DB_MODE y DATABASE_URL vienen de .env.local (copiado a .next/standalone/.env.local).
 * Para polla sincronizada local ↔ servidor, usa DB_MODE=postgres + Neon.
 * SQLite local: PROJECT_ROOT/DATA_DIR/DATABASE_PATH apuntan al repo.
 */

const path = require('path')

const projectRoot = __dirname

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
        // Solo necesario si DB_MODE=sqlite (fallback local en el VPS)
        DATA_DIR: path.join(projectRoot, 'data'),
        DATABASE_PATH: path.join(projectRoot, 'data', 'arandano.db'),
      },
    },
  ],
}
