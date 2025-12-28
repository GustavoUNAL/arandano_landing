# GitHub Actions - Despliegue Automático

Este workflow despliega automáticamente la aplicación a EC2 cuando se hace push a la rama `main`.

## Configuración Requerida

Para que el despliegue automático funcione, necesitas configurar los siguientes secrets en GitHub:

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **New repository secret** y agrega:

### Secrets Necesarios:

- **`EC2_HOST`**: La IP pública o dominio de tu instancia EC2
  - Ejemplo: `54.123.45.67` o `arandanocafe.com`

- **`EC2_USER`**: El usuario SSH de tu instancia EC2
  - Generalmente: `ubuntu` (para Ubuntu)
  - O `ec2-user` (para Amazon Linux)

- **`EC2_SSH_KEY`**: La clave privada SSH (.pem) completa
  - Copia todo el contenido de tu archivo `.pem`
  - Incluye las líneas `-----BEGIN RSA PRIVATE KEY-----` y `-----END RSA PRIVATE KEY-----`
  - **Importante**: No uses espacios adicionales o saltos de línea incorrectos

## Cómo Obtener la Clave SSH Privada

1. Localiza tu archivo `.pem` en tu máquina local
2. Abre el archivo con un editor de texto
3. Copia TODO el contenido (incluyendo las líneas BEGIN/END)
4. Pega el contenido completo en el secret `EC2_SSH_KEY`

## Cómo Funciona

1. Cuando haces `git push origin main`, GitHub Actions se activa automáticamente
2. El workflow:
   - Hace checkout del código
   - Se conecta a EC2 vía SSH
   - Actualiza el código con `git pull`
   - Instala dependencias con `npm ci`
   - Crea el build de producción con `npm run build`
   - Reinicia la aplicación con PM2

## Ejecución Manual

También puedes ejecutar el workflow manualmente:
1. Ve a la pestaña **Actions** en GitHub
2. Selecciona el workflow "Deploy to EC2"
3. Haz clic en **Run workflow**

## Troubleshooting

### Error: "Permission denied (publickey)"
- Verifica que la clave SSH esté correctamente configurada en los secrets
- Asegúrate de que la clave sea la privada (.pem), no la pública

### Error: "Host key verification failed"
- Si es la primera conexión, GitHub Actions puede mostrar esta advertencia
- Puede resolverse automáticamente, pero si persiste, verifica la configuración SSH

### Error: "npm: command not found"
- Asegúrate de que Node.js y npm estén instalados en EC2
- El script asume que están en el PATH

### La aplicación no se reinicia
- Verifica que PM2 esté instalado: `pm2 --version`
- Si no está instalado, instálalo manualmente en EC2: `sudo npm install -g pm2`

## Seguridad

- Nunca commitees tu clave SSH privada al repositorio
- Usa siempre GitHub Secrets para información sensible
- Considera usar claves SSH temporales o con permisos limitados
- Revisa regularmente los logs de GitHub Actions para detectar problemas

