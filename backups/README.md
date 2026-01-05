# Copias de Seguridad - Arándano Café Bar

Este directorio contiene copias de seguridad de los archivos de datos antes de despliegues a producción.

## Estructura

Cada copia de seguridad se guarda en un directorio con el formato:
```
production_backup_YYYYMMDD_HHMMSS/
```

## Archivos incluidos

- `products.json` - Catálogo de productos a la venta
- `inventory.json` - Inventario interno (licores, insumos, activos, etc.)
- `sales.json` - Registro de ventas
- `expenses.json` - Registro de gastos
- `tasks.json` - Tareas pendientes

## Uso

Para restaurar una copia de seguridad:

```bash
# 1. Identificar la copia a restaurar
ls -la backups/

# 2. Copiar los archivos de vuelta a data/
cp backups/production_backup_YYYYMMDD_HHMMSS/*.json data/
```

## Notas

- Las copias de seguridad se crean manualmente antes de despliegues importantes
- Se recomienda crear una copia antes de cada actualización mayor
- Los archivos están en formato JSON y pueden ser editados manualmente si es necesario

