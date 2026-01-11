# 📋 Prompt Template: Agregar Productos a un Lote

Usa este template cuando necesites agregar nuevos productos asociados a un lote de compra.

## Formato del Prompt

```
Agrega los siguientes productos al inventario asociados al lote:

**Proveedor:** [Nombre del proveedor]
**Fecha de compra:** [YYYY-MM-DD]
**Número de lote (opcional):** [Si tienes un número específico, si no déjalo vacío y se generará automáticamente]

**Productos:**
1. [Nombre del producto]
   - Categoría: [categoría]
   - Cantidad: [número]
   - Unidad: [Unidad/Lata/Botella/Kilogramo/etc]
   - Precio unitario: $[precio]
   - Código (opcional): [código]
   - Notas (opcional): [notas adicionales]

2. [Nombre del producto]
   - Categoría: [categoría]
   - Cantidad: [número]
   - Unidad: [Unidad/Lata/Botella/Kilogramo/etc]
   - Precio unitario: $[precio]
   - Código (opcional): [código]
   - Notas (opcional): [notas adicionales]

[... más productos ...]
```

## Ejemplo

```
Agrega los siguientes productos al inventario asociados al lote:

**Proveedor:** Éxito
**Fecha de compra:** 2026-01-10

**Productos:**
1. Café Premium Juan Valdez
   - Categoría: insumos para café
   - Cantidad: 2
   - Unidad: Unidad
   - Precio unitario: $25000
   - Notas: Comprado en Éxito el 10 de enero de 2026

2. Leche Alquería entera
   - Categoría: insumos para café
   - Cantidad: 6
   - Unidad: Unidad
   - Precio unitario: $4200
   - Notas: Comprado en Éxito el 10 de enero de 2026

3. Pan de molde Bimbo
   - Categoría: acompañantes
   - Cantidad: 1
   - Unidad: Unidad
   - Precio unitario: $8900
   - Notas: Comprado en Éxito el 10 de enero de 2026
```

## Categorías Disponibles

- `licores`
- `licores para shots`
- `siropes y bases`
- `productos de limpieza`
- `insumos para café`
- `desechables`
- `acompañantes`
- `activos`
- `productos regulados`
- `cervezas`
- `acompañantes`

## Notas Importantes

- El número de lote se genera automáticamente si no lo proporcionas (formato: `[PROVEEDOR]-[FECHA]-001`)
- La fecha debe estar en formato YYYY-MM-DD
- El precio unitario debe estar en pesos colombianos (sin puntos ni comas, solo números)
- Si el producto ya existe, se actualizará el stock y se agregará la entrada al lote correspondiente
