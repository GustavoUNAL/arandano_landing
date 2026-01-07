/**
 * Configuración de PM2 para Arándano Café Bar
 * 
 * Uso: pm2 start ecosystem.config.js
 * 
 * Nota: Con `output: 'standalone'`, Next.js genera un servidor en `.next/standalone/server.js`
 * que debe ejecutarse directamente con Node.js.
 */

const path = require('path');

module.exports = {
  apps: [
    {
      name: 'arandano-app',
      // Usar el servidor standalone generado por Next.js
      script: path.join(__dirname, '.next', 'standalone', 'server.js'),
      // El cwd debe ser el directorio standalone para que encuentre los módulos correctamente
      cwd: path.join(__dirname, '.next', 'standalone'),
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      // Logs
      error_file: path.join(__dirname, 'logs', 'pm2-error.log'),
      out_file: path.join(__dirname, 'logs', 'pm2-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Variables de entorno
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // El directorio raíz del proyecto (para encontrar .env.local y otros archivos)
        PROJECT_ROOT: __dirname,
      },
    },
  ],
}

