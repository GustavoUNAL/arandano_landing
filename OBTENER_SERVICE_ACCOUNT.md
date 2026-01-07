# 🔑 Cómo Obtener firebase-service-account.json

## 📋 Pasos para Descargar el Archivo Real

### 1. Ve a Firebase Console

Abre: https://console.firebase.google.com/project/arandanocafe/settings/serviceaccounts/adminsdk

O manualmente:
1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto: **arandanocafe**
3. Haz clic en el ⚙️ (Configuración) > **Configuración del proyecto**
4. Ve a la pestaña **Cuentas de servicio**

### 2. Genera una Nueva Clave Privada

1. En la sección "Firebase Admin SDK"
2. Haz clic en **"Generar nueva clave privada"**
3. Confirma haciendo clic en **"Generar clave"**
4. Se descargará automáticamente un archivo JSON

### 3. Renombra el Archivo

El archivo descargado tendrá un nombre como:
```
arandanocafe-firebase-adminsdk-xxxxx-xxxxx.json
```

**Renómbralo a:**
```
firebase-service-account.json
```

### 4. Colócalo en la Raíz del Proyecto

```bash
# En tu máquina local
mv ~/Downloads/arandanocafe-firebase-adminsdk-*.json ~/Documents/Projects/ARANDANO/firebase-service-account.json
```

### 5. Verifica que Está Correcto

```bash
# Ver el contenido (sin mostrar la clave privada completa)
cat firebase-service-account.json | jq '{type, project_id, client_email}'
```

Deberías ver algo como:
```json
{
  "type": "service_account",
  "project_id": "arandanocafe",
  "client_email": "firebase-adminsdk-xxxxx@arandanocafe.iam.gserviceaccount.com"
}
```

## 🚀 Subir al Servidor

### Opción 1: Usando Git (ahora que está permitido)

```bash
# En tu máquina local
git add firebase-service-account.json
git commit -m "Add Firebase service account"
git push

# En el servidor
git pull
```

### Opción 2: Usando SCP (más directo)

```bash
# Desde tu máquina local
scp -i tu-clave.pem firebase-service-account.json ubuntu@tu-ip-servidor:~/projects/arandano_landing/
```

## ✅ Verificar en el Servidor

```bash
# En el servidor
ls -la firebase-service-account.json
npm run diagnose:firebase
```

## 🔒 Seguridad

- ⚠️ **NUNCA** compartas este archivo públicamente
- ✅ El archivo ya está en `.gitignore` por defecto
- ✅ Si usas Git privado, está bien subirlo
- ✅ Alternativa más segura: usar variable de entorno `FIREBASE_SERVICE_ACCOUNT`

## 💡 Usar Variable de Entorno (Más Seguro)

En lugar de subir el archivo, puedes usar una variable de entorno:

```bash
# En el servidor
nano .env.local
```

Agrega:
```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"arandanocafe","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"...","universe_domain":"googleapis.com"}'
```

(Pega TODO el contenido del JSON en una sola línea)

