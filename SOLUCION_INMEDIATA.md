# ⚡ Solución Inmediata: Configurar DB_MODE

## 🔍 Problema

El diagnóstico muestra:
```
DB_MODE actual: no configurado
❌ DB_MODE no está configurado para usar Firebase
```

## ✅ Solución Rápida (1 minuto)

### En el Servidor, Ejecuta:

```bash
cd ~/projects/arandano_landing

# Opción 1: Usar script automático
npm run configure:env

# O Opción 2: Manual
echo "DB_MODE=firebase" >> .env.local

# Verificar
cat .env.local | grep DB_MODE
```

### Reiniciar PM2

```bash
# Reiniciar cargando variables de .env.local
pm2 restart all --update-env

# Verificar
npm run diagnose:firebase
```

**Debe mostrar:**
```
✅ DB_MODE está configurado como 'firebase' ✓
```

## 🎯 Verificar que Funciona

### 1. Ver logs al iniciar
```bash
pm2 logs arandano-app --lines 20
```

Debe mostrar:
```
[DB] Firebase Service Account encontrado en: ...
[DB] Firebase conectado a proyecto: arandanocafe
```

### 2. Probar creación de venta
1. Ve a `/waiter` en el navegador
2. Agrega productos al carrito
3. Intenta crear una venta
4. Debe funcionar sin error 500

### 3. Verificar logs durante la creación
```bash
# En otra terminal, ver logs en tiempo real
pm2 logs arandano-app | grep -E "\[API\]|\[DB\]"
```

Debe mostrar:
```
[API] Creando venta con items: X
[API] Venta creada exitosamente: sale-xxxxx
```

## 📋 Checklist Final

- [ ] `.env.local` existe y tiene `DB_MODE=firebase`
- [ ] `firebase-service-account.json` existe en `~/projects/arandano_landing/`
- [ ] PM2 se reinició con `--update-env`
- [ ] `npm run diagnose:firebase` muestra DB_MODE configurado
- [ ] Los logs muestran: `[DB] Firebase conectado a proyecto: arandanocafe`
- [ ] Crear venta desde `/waiter` funciona sin error 500

## 🚨 Si Aún Falla

### Ver el error exacto:
```bash
# Ver últimos errores
pm2 logs arandano-app --err --lines 50 | tail -30

# O ver logs en tiempo real
pm2 logs arandano-app | grep -i "error"
```

Copia y pega el error aquí para diagnóstico adicional.

