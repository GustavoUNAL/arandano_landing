# 🗄️ Migración a SQLite - Base de Datos Local

## ✅ Migración Completada

El proyecto ahora usa **SQLite** como base de datos local por defecto, eliminando la dependencia de Firebase y sus cuotas.

## 📊 Datos Migrados

- ✅ **43 productos** migrados
- ✅ **169 items de inventario** migrados
- ✅ **36 recetas** migradas
- ✅ **12 ventas** migradas

## 🚀 Configuración

### 1. Configurar DB_MODE

En tu archivo `.env.local` (o crear uno nuevo):

```bash
DB_MODE=sqlite
```

**Nota:** Si no existe `.env.local`, SQLite será el modo por defecto.

### 2. Ubicación de la Base de Datos

La base de datos SQLite se encuentra en:
```
data/arandano.db
```

Este archivo contiene todas tus tablas y datos.

## 🔄 Migrar Datos

Si necesitas migrar datos desde Firebase o JSON:

```bash
npm run migrate:sqlite
```

Este script:
- Intenta cargar desde Firebase (si está disponible)
- Si no, carga desde archivos JSON locales
- Crea/actualiza la base de datos SQLite

## 📦 Ventajas de SQLite

1. **Sin cuotas**: No hay límites de lectura/escritura
2. **Rápido**: Consultas locales instantáneas
3. **Portable**: Un solo archivo `.db` con todos los datos
4. **Fácil backup**: Solo copiar el archivo `arandano.db`
5. **Migración fácil**: Fácil de migrar a PostgreSQL/MySQL después

## 🔧 Migración a Servidor Cloud

Cuando quieras migrar a un servidor cloud, puedes:

### Opción 1: Mantener SQLite
- Copiar `data/arandano.db` al servidor
- Funciona igual que localmente

### Opción 2: Migrar a PostgreSQL/MySQL
- Exportar datos desde SQLite
- Importar a PostgreSQL/MySQL
- Actualizar código para usar el nuevo motor

## 📝 Estructura de Tablas

- `products` - Productos a la venta
- `inventory` - Inventario/insumos
- `sales` - Ventas registradas
- `recipes` - Recetas de cócteles/cafés
- `stock_movements` - Movimientos de stock (kardex)
- `tasks` - Tareas pendientes
- `expenses` - Gastos

## 🔍 Verificar Base de Datos

Puedes inspeccionar la base de datos usando herramientas como:
- DB Browser for SQLite (GUI)
- `sqlite3` (línea de comandos)

```bash
sqlite3 data/arandano.db
.tables
SELECT COUNT(*) FROM products;
```

## ⚠️ Backup

**IMPORTANTE:** Haz backup regular del archivo `data/arandano.db`:

```bash
# Backup manual
cp data/arandano.db backups/arandano-$(date +%Y%m%d).db
```

## 🎯 Próximos Pasos

1. ✅ Configurar `DB_MODE=sqlite` en `.env.local`
2. ✅ Reiniciar la aplicación
3. ✅ Verificar que todo funciona correctamente
4. ✅ Hacer backup del archivo `arandano.db`
