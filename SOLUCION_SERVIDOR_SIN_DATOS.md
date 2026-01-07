# 🔧 Solución: Servidor sin Datos (Firebase no conectado)

## 🎯 Problema

Tu servidor no muestra datos porque no está configurado para usar Firebase o Firebase no tiene datos.

## 🔍 Diagnóstico Rápido

Ejecuta en tu servidor:

```bash
npm run diagnose:firebase
```

Esto te mostrará exactamente qué está mal configurado.

## ✅ Solución Paso a Paso

### Paso 1: Conectarse al Servidor

```bash
ssh -i tu-clave.pem ubuntu@tu-ip-ec2
cd ~/ARANDANO  # o donde esté tu proyecto
```

### Paso 2: Verificar Configuración Actual

```bash
# Ver si DB_MODE está configurado
echo $DB_MODE

# Ver si existe el archivo .env.local
cat .env.local | grep DB_MODE

# Ver si existe firebase-service-account.json
ls -la firebase-service-account.json
```

### Paso 3: Configurar DB_MODE

**Opción A: En archivo .env.local (Recomendado)**

```bash
nano .env.local
```

Agrega o actualiza esta línea:

```env
DB_MODE=firebase
```

O si quieres modo híbrido (lee de Firebase, escribe en ambos):

```env
DB_MODE=hybrid
```

Guarda con `Ctrl+X`, luego `Y`, luego `Enter`.

**Opción B: Variable de entorno del sistema**

```bash
export DB_MODE=firebase
echo 'export DB_MODE=firebase' >> ~/.bashrc
source ~/.bashrc
```

### Paso 4: Verificar Credenciales de Firebase

**Si usas archivo JSON:**

```bash
# Verificar que existe
ls -la firebase-service-account.json

# Si no existe, subirlo desde tu máquina local:
# (Desde tu máquina local)
scp -i tu-clave.pem firebase-service-account.json ubuntu@tu-ip-ec2:~/ARANDANO/
```

**Si usas variable de entorno (más seguro):**

```bash
nano .env.local
```

Agrega:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"arandanocafe",...}
```

(Pega todo el contenido del JSON en una sola línea)

### Paso 5: Verificar que Firebase tiene Datos

```bash
# Verificar conexión y datos
npm run diagnose:firebase
```

Si no hay datos en Firebase, restaura desde backup:

```bash
# Restaurar datos desde backup local al servidor
npm run restore:firebase
```

**O si los datos están en tu máquina local:**

1. En tu máquina local, verifica que tienes datos:
   ```bash
   npm run diagnose:firebase
   ```

2. Si tienes datos localmente pero no en el servidor, sube los archivos JSON y restaura:
   ```bash
   # Desde tu máquina local
   scp -i tu-clave.pem data/*.json ubuntu@tu-ip-ec2:~/ARANDANO/data/
   
   # Luego en el servidor
   ssh -i tu-clave.pem ubuntu@tu-ip-ec2
   cd ~/ARANDANO
   npm run restore:firebase
   ```

### Paso 6: Reiniciar la Aplicación

```bash
# Si usas PM2
pm2 restart all
pm2 logs

# O si usas systemd
sudo systemctl restart nextjs-app
sudo systemctl status nextjs-app

# O si estás en desarrollo
npm run dev
```

## 🔍 Verificación Final

Después de configurar, verifica:

```bash
# 1. Diagnóstico completo
npm run diagnose:firebase

# 2. Verificar que DB_MODE está activo
node -e "console.log('DB_MODE:', process.env.DB_MODE)"

# 3. Verificar logs de la aplicación
pm2 logs
# o
sudo journalctl -u nextjs-app -f
```

## 📋 Checklist de Configuración

- [ ] `DB_MODE=firebase` o `DB_MODE=hybrid` configurado
- [ ] `firebase-service-account.json` existe o `FIREBASE_SERVICE_ACCOUNT` está configurada
- [ ] Firebase tiene datos (verificar con `diagnose:firebase`)
- [ ] Aplicación reiniciada después de cambios
- [ ] Logs no muestran errores de conexión

## 🚨 Errores Comunes

### Error: "DB_MODE is json"

**Solución:** Configura `DB_MODE=firebase` en `.env.local` y reinicia la app.

### Error: "No se encontró firebase-service-account.json"

**Solución:** 
- Sube el archivo al servidor, o
- Configura `FIREBASE_SERVICE_ACCOUNT` como variable de entorno

### Error: "Firebase no tiene datos"

**Solución:** 
```bash
npm run restore:firebase
```

### Error: "Permission denied" al leer credenciales

**Solución:**
```bash
chmod 600 firebase-service-account.json
```

### La app sigue mostrando datos vacíos después de configurar

**Solución:**
1. Verifica que reiniciaste la app: `pm2 restart all`
2. Verifica los logs: `pm2 logs`
3. Limpia la caché: `pm2 restart all --update-env`
4. Reconstruye: `npm run build && pm2 restart all`

## 💡 Tips

- **Modo híbrido**: Usa `DB_MODE=hybrid` inicialmente para validar que funciona
- **Logs**: Siempre revisa los logs cuando hay problemas
- **Backups**: Haz backup antes de cambios importantes: `npm run backup:firebase`
- **Variables de entorno**: Prefiere `.env.local` sobre variables del sistema para Next.js

## 📞 Si nada funciona

1. Ejecuta diagnóstico completo:
   ```bash
   npm run diagnose:firebase > diagnostico.txt
   cat diagnostico.txt
   ```

2. Verifica logs detallados:
   ```bash
   pm2 logs --lines 100
   ```

3. Verifica que Firebase Console tiene datos:
   - Ve a https://console.firebase.google.com/
   - Selecciona tu proyecto
   - Ve a Firestore Database
   - Verifica que hay colecciones con datos

4. Restaura desde backup manualmente:
   ```bash
   npm run restore:firebase
   ```

