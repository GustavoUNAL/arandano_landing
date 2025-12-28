# Despliegue Automático con GitHub Actions

Esta guía te ayudará a configurar el despliegue automático desde GitHub a tu instancia EC2.

## 📋 Requisitos Previos

- ✅ Repositorio en GitHub
- ✅ Instancia EC2 configurada y funcionando
- ✅ Acceso SSH a EC2 funcionando desde tu máquina local
- ✅ Node.js, npm y PM2 instalados en EC2
- ✅ Aplicación ya desplegada al menos una vez manualmente

## 🔧 Paso 1: Configurar GitHub Secrets

1. Ve a tu repositorio en GitHub
2. Navega a **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **New repository secret**

### Agregar los siguientes secrets:

#### 1. EC2_HOST
- **Nombre**: `EC2_HOST`
- **Valor**: La IP pública o dominio de tu EC2
  - Ejemplo: `54.123.45.67` o `arandanocafe.com`

#### 2. EC2_USER
- **Nombre**: `EC2_USER`
- **Valor**: El usuario SSH (generalmente `ubuntu`)

#### 3. EC2_SSH_KEY
- **Nombre**: `EC2_SSH_KEY`
- **Valor**: Todo el contenido de tu archivo `.pem` (clave privada SSH)
  - Abre tu archivo `.pem` en un editor de texto
  - Copia TODO el contenido, incluyendo:
    ```
    -----BEGIN RSA PRIVATE KEY-----
    [contenido de la clave]
    -----END RSA PRIVATE KEY-----
    ```
  - Pega todo el contenido en el campo del secret

## 📍 Paso 2: Verificar Ruta del Proyecto en EC2

El script busca el proyecto en estas ubicaciones (en orden):
1. `~/projects/arandano_landing`
2. `~/ARANDANO`
3. `/home/ubuntu/ARANDANO`
4. `/home/ubuntu/projects/arandano_landing`

Si tu proyecto está en otra ubicación, edita el workflow `.github/workflows/deploy.yml` y actualiza las rutas.

## ✅ Paso 3: Probar el Despliegue

1. Haz un pequeño cambio en tu código
2. Commitea y haz push a `main`:
   ```bash
   git add .
   git commit -m "Test: probar despliegue automático"
   git push origin main
   ```
3. Ve a la pestaña **Actions** en GitHub
4. Observa el workflow ejecutándose
5. Si hay errores, revisa los logs

## 🎯 Cómo Funciona

Cuando haces push a `main`:

1. **GitHub Actions se activa** automáticamente
2. **Se conecta a EC2** usando SSH con las credenciales configuradas
3. **Actualiza el código** con `git fetch` y `git reset --hard origin/main`
4. **Instala dependencias** con `npm ci`
5. **Crea el build** con `npm run build`
6. **Reinicia la app** con `pm2 restart arandano-app`

## 🔍 Verificar el Despliegue

Después de que el workflow termine:

```bash
# Conéctate a EC2
ssh -i tu-clave.pem ubuntu@tu-ip

# Ver estado de PM2
pm2 status arandano-app

# Ver logs
pm2 logs arandano-app
```

## ⚠️ Solución de Problemas

### Error: "Permission denied (publickey)"

**Solución:**
- Verifica que copiaste TODO el contenido de tu `.pem` al secret `EC2_SSH_KEY`
- Asegúrate de incluir las líneas `-----BEGIN RSA PRIVATE KEY-----` y `-----END RSA PRIVATE KEY-----`
- No agregues saltos de línea adicionales

### Error: "Host key verification failed"

**Solución:**
- Esto puede pasar en la primera conexión
- El workflow debería manejarlo automáticamente
- Si persiste, verifica la configuración SSH en EC2

### Error: "npm: command not found" o "pm2: command not found"

**Solución:**
- Conéctate a EC2 y verifica las instalaciones:
  ```bash
  node --version
  npm --version
  pm2 --version
  ```
- Si falta algo, instálalo:
  ```bash
  # Node.js
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
  
  # PM2
  sudo npm install -g pm2
  ```

### Error: "Directory not found"

**Solución:**
- Verifica en qué directorio está tu proyecto en EC2:
  ```bash
  # En EC2
  find ~ -name "package.json" -type f 2>/dev/null
  ```
- Actualiza las rutas en `.github/workflows/deploy.yml` si es necesario

### El build falla en GitHub Actions pero funciona localmente

**Solución:**
- Verifica que no haya errores de TypeScript o linting
- Ejecuta localmente: `npm run build`
- Corrige cualquier error antes de hacer push

## 🚀 Ejecutar Manualmente

Puedes ejecutar el workflow manualmente desde GitHub:

1. Ve a **Actions** en tu repositorio
2. Selecciona **Deploy to EC2**
3. Haz clic en **Run workflow**
4. Selecciona la rama (generalmente `main`)
5. Haz clic en **Run workflow**

## 📝 Notas Importantes

- El workflow ejecuta `npm ci` (no `npm install`) para instalaciones más rápidas y reproducibles
- Usa `git reset --hard` para asegurar que el código en EC2 coincida exactamente con `main`
- PM2 reinicia automáticamente la aplicación sin perder el estado de otras apps
- Los logs del despliegue están disponibles en la pestaña **Actions** de GitHub

## 🔒 Seguridad

- ✅ Nunca commitees tu clave SSH privada
- ✅ Usa siempre GitHub Secrets para información sensible
- ✅ Considera rotar las claves SSH periódicamente
- ✅ Limita el acceso SSH a solo lo necesario
- ✅ Revisa regularmente los logs de GitHub Actions

