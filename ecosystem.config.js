/**
 * PM2 — Arándano Café Bar
 * Uso: npm run build && pm2 start ecosystem.config.js
 *
 * DATABASE_PATH y PROJECT_ROOT apuntan al repo (no a .next/standalone)
 * para que SQLite y backups usen siempre data/arandano.db del proyecto.
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
        PROJECT_ROOT: projectRoot,
        DATA_DIR: path.join(projectRoot, 'data'),
        DATABASE_PATH: path.join(projectRoot, 'data', 'arandano.db'),
      },
    },
  ],
}
