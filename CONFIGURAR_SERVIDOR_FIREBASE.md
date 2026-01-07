# ⚡ Configuración Rápida de Firebase en el Servidor

## 🎯 Problemas Detectados

1. ❌ `DB_MODE` no está configurado
2. ❌ Credenciales de Firebase no encontradas
3. ✅ Datos locales disponibles (39 productos, 120 inventario, etc.)

## 🚀 Solución Paso a Paso

### Paso 1: Configurar DB_MODE

**En tu servidor, ejecuta:**

```bash
cd ~/projects/arandano_landing

# Crear o editar .env.local
nano .env.local
```

**Agrega esta línea:**

```env
DB_MODE=firebase
```

Guarda con `Ctrl+X`, luego `Y`, luego `Enter`.

**O si prefieres modo híbrido (lee de Firebase, escribe en ambos):**

```env
DB_MODE=hybrid
```

### Paso 2: Subir Credenciales de Firebase

**Opción A: Subir archivo JSON (Más fácil)**

Desde tu máquina local:

```bash
# Desde tu máquina local
scp -i tu-clave.pem firebase-service-account.json ubuntu@tu-ip-servidor:~/projects/arandano_landing/
```

**Opción B: Variable de entorno (Más seguro para producción)**

1. En tu máquina local, lee el contenido del archivo:
   ```bash
   cat firebase-service-account.json | jq -c
   ```

2. En el servidor, agrega a `.env.local`:
   ```bash
   nano .env.local
   ```

3. Agrega (todo en una línea):
   ```env
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...",...}
   ```

### Paso 3: Migrar Datos Locales a Firebase

Ya que tienes datos en los archivos JSON locales, necesitas migrarlos a Firebase:

```bash
# En el servidor
cd ~/projects/arandano_landing

# Restaurar desde los archivos locales (que ya están en data/)
npm run migrate:firebase
```

Esto migrará:
- ✅ 39 productos
- ✅ 120 items de inventario
- ✅ 7 tareas
- ✅ 1 gasto

### Paso 4: Verificar Configuración

```bash
# Verificar que todo está bien
npm run diagnose:firebase
```

Deberías ver:
- ✅ `DB_MODE` configurado
- ✅ Credenciales encontradas
- ✅ Conexión a Firebase exitosa
- ✅ Datos en Firebase

### Paso 5: Reiniciar la Aplicación

```bash
# Si usas PM2
pm2 restart all
pm2 logs

# O si usas systemd
sudo systemctl restart nextjs-app
sudo systemctl status nextjs-app
```

## 🔍 Verificación Rápida

Después de configurar, ejecuta:

```bash
npm run diagnose:firebase
```

**Deberías ver:**
```
✅ DB_MODE está configurado como 'firebase' ✓
✅ Archivo firebase-service-account.json encontrado (proyecto: ...) ✓
✅ Conexión a Firebase establecida correctamente ✓
✅ products: 39 documentos encontrados ✓
✅ inventory: 120 documentos encontrados ✓
```

## ⚠️ Si No Tienes firebase-service-account.json

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a Configuración del proyecto > Cuentas de servicio
4. Haz clic en "Generar nueva clave privada"
5. Descarga el archivo JSON
6. Súbelo al servidor (Paso 2)

## 💡 Tips

- **Modo híbrido**: Si quieres usar `DB_MODE=hybrid`, los datos se escribirán en ambos (Firebase + JSON local) como backup automático
- **Logs**: Si hay problemas, revisa los logs: `pm2 logs` o `sudo journalctl -u nextjs-app -f`
- **Backup**: Después de migrar, haz un backup de Firebase: `npm run backup:firebase`

## 🚨 Solución de Problemas

### Error: "Permission denied" al leer credenciales

```bash
chmod 600 firebase-service-account.json
```

### Error: "DB_MODE still not working"

Asegúrate de reiniciar la aplicación:
```bash
pm2 restart all --update-env
```

### Los datos no aparecen después de migrar

Verifica en Firebase Console:
1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto
3. Ve a Firestore Database
4. Verifica que las colecciones tienen datos

