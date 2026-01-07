/**
 * Configuración de PM2 para Arándano Café Bar
 * 
 * Uso: pm2 start ecosystem.config.js
 * 
 * Nota: Con `output: 'standalone'`, Next.js genera un servidor en `.next/standalone/server.js`
 * pero podemos usar `npm start` si el archivo firebase-service-account.json está disponible.
 */

module.exports = {
  apps: [
    {
      name: 'arandano-app',
      script: 'npm',
      args: 'start',
      cwd: process.cwd(),
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      // Cargar variables de entorno
      env_file: '.env.local',
      // Logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Variables de entorno (se pueden sobrescribir con .env.local)
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}

