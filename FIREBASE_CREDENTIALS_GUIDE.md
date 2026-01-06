# 🔑 Guía para Obtener Credenciales de Firebase

## 📋 Información que Necesitamos

Para conectar tu aplicación a Firebase, necesitamos **2 tipos de credenciales**:

### 1. Credenciales del Cliente (para Next.js)
Estas van en `.env.local` y son públicas (seguras para el frontend)

### 2. Credenciales del Servidor (Admin SDK)
Este es un archivo JSON privado para operaciones del servidor

---

## 🚀 Paso a Paso

### PASO 1: Crear Proyecto en Firebase

1. Ve a https://console.firebase.google.com/
2. Haz clic en **"Agregar proyecto"** o **"Crear un proyecto"**
3. Ingresa el nombre: **"Arándano Café Bar"** (o el que prefieras)
4. Si te pregunta por Google Analytics, puedes desactivarlo por ahora
5. Haz clic en **"Crear proyecto"**
6. Espera a que se cree (puede tardar unos segundos)
7. Haz clic en **"Continuar"**

### PASO 2: Habilitar Firestore Database

1. En el menú lateral izquierdo, busca **"Firestore Database"**
2. Haz clic en **"Crear base de datos"**
3. Selecciona **"Comenzar en modo de prueba"** (podemos cambiar las reglas después)
4. Elige la ubicación: **"us-central"** (o la más cercana a Colombia)
5. Haz clic en **"Habilitar"**

### PASO 3: Obtener Credenciales del Cliente (Web App)

1. Haz clic en el ícono de **⚙️ Configuración del proyecto** (arriba a la izquierda)
2. Desplázate hacia abajo hasta **"Tus aplicaciones"**
3. Haz clic en el ícono **`</>`** (Web - HTML)
4. Registra la app:
   - **Apodo de la app**: "Arándano Web"
   - Marca **"También configura Firebase Hosting"** (opcional)
   - Haz clic en **"Registrar app"**
5. **¡IMPORTANTE!** Copia las credenciales que aparecen. Deberías ver algo como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "arandano-cafe.firebaseapp.com",
  projectId: "arandano-cafe",
  storageBucket: "arandano-cafe.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

6. **Guarda esta información** - la necesitaremos para `.env.local`

### PASO 4: Obtener Credenciales del Servidor (Service Account)

1. En **Configuración del proyecto**, ve a la pestaña **"Cuentas de servicio"**
2. Haz clic en **"Generar nueva clave privada"**
3. Se descargará un archivo JSON (algo como `arandano-cafe-firebase-adminsdk-xxxxx.json`)
4. **Renombra este archivo** a: `firebase-service-account.json`
5. **Muévelo a la raíz de tu proyecto** (misma carpeta que `package.json`)

---

## ✅ Verificación

Una vez que tengas todo, deberías tener:

1. ✅ Proyecto creado en Firebase
2. ✅ Firestore Database habilitado
3. ✅ Credenciales del cliente (las 6 variables)
4. ✅ Archivo `firebase-service-account.json` en la raíz del proyecto

---

## 📝 Siguiente Paso

Una vez que tengas las credenciales, dímelo y te ayudo a:
1. Crear el archivo `.env.local` con las credenciales
2. Verificar que el archivo `firebase-service-account.json` esté correcto
3. Probar la conexión
4. Migrar los datos

---

## 🔒 Seguridad

**IMPORTANTE:**
- ❌ **NUNCA** subas `firebase-service-account.json` a Git
- ❌ **NUNCA** subas `.env.local` a Git
- ✅ Ya están en `.gitignore` para protegerlos

