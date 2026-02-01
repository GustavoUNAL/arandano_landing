# Categorías del inventario

Cada producto que se compra o se agrega al inventario debe tener **una** de estas categorías para poder consultarlo en la base de datos y en el resumen por categoría.

## Categorías oficiales (7)

| Categoría (valor en DB) | Uso |
|-------------------------|-----|
| `activos` | Equipos, mobiliario, activos fijos |
| `cigarrillos` | Tabaco |
| `aseo` | Limpieza, desechables, bioseguridad |
| `comestibles` | Acompañantes, snacks, alimentos |
| `bebidas alcoholicas` | Licores, cervezas, shots |
| `insumos para cocteles` | Siropes, bases, ingredientes para cócteles |
| `insumos para cafeteria` | Café, azúcar, leche, insumos de cafetería |

## Uso en scripts de compra

Al insertar ítems en `inventory` (por script o API), usar siempre una de estas categorías en el campo `category`:

```javascript
// Ejemplo
const item = {
  name: 'Papel higiénico 3H',
  category: 'aseo',  // una de las 7
  quantity: 1,
  unit: 'Paquete',
  unitPrice: 6700,
  totalValue: 6700,
  purchaseDate: '2026-01-31',
  supplier: 'Tiendas D1',
  // ...
}
```

Si se envía una categoría antigua (ej. `productos de aseo`, `cafeteria`), la API la normaliza automáticamente a `aseo` e `insumos para cafeteria`.
