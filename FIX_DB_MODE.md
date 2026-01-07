# 🔧 Solución Rápida: Configurar DB_MODE

## 🚨 Problema

El diagnóstico muestra:
```
DB_MODE actual: no configurado
❌ DB_MODE no está configurado para usar Firebase
```

## ⚡ Solución en 3 Pasos

### Paso 1: Agregar DB_MODE al .env.local

**En el servidor, ejecuta:**

```bash
cd ~/projects/arandano_landing

# Agregar DB_MODE=firebase al .env.local
echo "DB_MODE=firebase" >> .env.local

# Verificar que se agregó
cat .env.local | grep DB_MODE
```

**Debe mostrar:**
```
DB_MODE=firebase
```

### Paso 2: Reiniciar PM2

```bash
# Reiniciar con variables actualizadas
pm2 restart all --update-env

# O si prefieres eliminar y reiniciar
pm2 delete arandano-app
pm2 start npm --name "arandano-app" -- start --update-env
pm2 save
```

### Paso 3: Verificar

```bash
# Verificar configuración
npm run diagnose:firebase

# Debe mostrar:
# ✅ DB_MODE está configurado como 'firebase' ✓
```

## 🧪 Probar que Funciona

### 1. Ver logs al iniciar
```bash
pm2 logs arandano-app --lines 20
```

**Debe mostrar:**
```
[DB] Firebase Service Account encontrado en: ...
[DB] Firebase conectado a proyecto: arandanocafe
```

### 2. Probar API directamente
```bash
curl http://localhost:3000/api/products
```

**Debe devolver JSON con productos (no error 500)**

### 3. Probar crear venta desde /waiter
1. Abre `/waiter` en el navegador
2. Agrega productos al carrito
3. Intenta crear una venta
4. **No debe mostrar error 500**

## 🎯 Comandos Completos (Copia y Pega)

```bash
# En el servidor
cd ~/projects/arandano_landing

# 1. Configurar DB_MODE
echo "DB_MODE=firebase" >> .env.local
cat .env.local | grep DB_MODE

# 2. Reiniciar
pm2 restart all --update-env

# 3. Verificar
npm run diagnose:firebase

# 4. Ver logs
pm2 logs arandano-app --lines 20 | grep -E "\[DB\]|Firebase"
```

## ✅ Checklist

- [ ] `.env.local` tiene `DB_MODE=firebase`
- [ ] PM2 se reinició con `--update-env`
- [ ] `npm run diagnose:firebase` muestra DB_MODE configurado
- [ ] Logs muestran: `[DB] Firebase conectado a proyecto: arandanocafe`
- [ ] `/api/products` funciona sin error 500
- [ ] Crear venta desde `/waiter` funciona

## 🚨 Si Aún No Funciona

### Ver el error exacto:
```bash
# Ver logs de errores
pm2 logs arandano-app --err --lines 50 | tail -30

# O ver logs en tiempo real
pm2 logs arandano-app | grep -i "error\|firebase"
```

Copia y pega el error aquí para diagnóstico adicional.

