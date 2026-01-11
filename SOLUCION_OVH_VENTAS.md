# 🔧 Solución: Error de Dependencias en OVH

## Problema

Al ejecutar `node scripts/test-sales-ovh.js` o `npm run diagnose:firebase` en OVH, aparece el error:

```
❌ Error inicializando Firebase: Cannot find module '@opentelemetry/api'
DB_MODE actual: json
```

## Solución Rápida

### Paso 1: Instalar Dependencias Faltantes

```bash
cd ~/projects/arandano_landing

# Reinstalar todas las dependencias
npm install

# Verificar que @opentelemetry/api se instaló
npm list @opentelemetry/api
```

### Paso 2: Configurar DB_MODE=firebase

```bash
cd ~/projects/arandano_landing

# Actualizar DB_MODE en .env.local
sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local

# O si no existe la línea, agregarla
if ! grep -q "^DB_MODE=" .env.local 2>/dev/null; then
    echo "DB_MODE=firebase" >> .env.local
fi

# Verificar cambio
cat .env.local | grep DB_MODE
```

### Paso 3: Verificar que Todo Funciona

```bash
# Ejecutar diagnóstico
npm run diagnose:firebase

# Probar registro de ventas
node scripts/test-sales-ovh.js
```

## Solución Completa (Copy & Paste)

Ejecuta estos comandos en el servidor OVH:

```bash
cd ~/projects/arandano_landing && \
npm install && \
sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local || echo "DB_MODE=firebase" >> .env.local && \
cat .env.local | grep DB_MODE && \
npm run diagnose:firebase && \
echo "✅ Si el diagnóstico fue exitoso, ejecuta: node scripts/test-sales-ovh.js"
```

## Si Aún No Funciona

### Reinstalar Todo desde Cero

```bash
cd ~/projects/arandano_landing

# Limpiar node_modules y package-lock.json
rm -rf node_modules package-lock.json

# Reinstalar todas las dependencias
npm install

# Verificar instalación
npm list firebase-admin
npm list @opentelemetry/api

# Probar de nuevo
npm run diagnose:firebase
```

### Verificar Versión de Node.js

```bash
# Verificar versión
node -v
# Debe ser v18.x.x o superior

# Si es muy antigua, actualizar
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar nueva versión
node -v
npm -v

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## Checklist Final

- [ ] Dependencias instaladas: `npm install`
- [ ] `@opentelemetry/api` instalado: `npm list @opentelemetry/api` (debe mostrar versión)
- [ ] `DB_MODE=firebase` en `.env.local`: `cat .env.local | grep DB_MODE`
- [ ] `firebase-service-account.json` existe: `ls -la firebase-service-account.json`
- [ ] Diagnóstico exitoso: `npm run diagnose:firebase`
- [ ] Prueba de ventas exitosa: `node scripts/test-sales-ovh.js`

## Notas

1. **`@opentelemetry/api`** es una dependencia transitiva de `firebase-admin` - se instala automáticamente con `npm install`
2. **`DB_MODE=json`** usa archivos JSON locales, no Firebase
3. **`DB_MODE=firebase`** usa Firebase Firestore para almacenar datos
4. En producción en OVH, siempre usa `DB_MODE=firebase`

---

¡Después de seguir estos pasos, las ventas deberían funcionar correctamente! 🎉
