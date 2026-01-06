# 🔍 Cómo Verificar Datos en Firebase

## 📊 Método 1: Script Automático (Recomendado)

Ejecuta el script que compara datos locales con Firebase:

```bash
npm run verify:firebase
```

Este script muestra:
- ✅ Cantidad de documentos en cada colección
- ✅ Comparación con archivos JSON locales
- ✅ Ejemplos de documentos
- ✅ Diferencias entre local y Firebase

## 🌐 Método 2: Firebase Console (Interfaz Web)

### Acceder a Firestore

1. Ve a Firebase Console:
   ```
   https://console.firebase.google.com/project/arandanocafe/firestore
   ```

2. Verás todas las colecciones:
   - `products` - Productos a la venta
   - `inventory` - Inventario interno
   - `sales` - Ventas registradas
   - `expenses` - Gastos
   - `tasks` - Tareas

3. Haz clic en cualquier colección para ver los documentos

### Ver Detalles de un Documento

1. Haz clic en una colección (ej: `products`)
2. Verás una lista de todos los documentos
3. Haz clic en un documento para ver sus campos
4. Puedes editar directamente desde la consola

### Filtrar y Buscar

- Usa la barra de búsqueda para filtrar documentos
- Ordena por cualquier campo
- Exporta datos si es necesario

## 📈 Método 3: Verificar desde la Aplicación

### En Desarrollo

1. Cambia `DB_MODE=hybrid` en `.env.local`
2. Reinicia el servidor: `npm run dev`
3. Ve a `/admin` o `/inventory`
4. Los datos deberían cargarse desde Firebase

### Verificar en Código

Puedes crear una página temporal para verificar:

```typescript
// app/test-firebase/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function TestFirebase() {
  const [data, setData] = useState<any>({})

  useEffect(() => {
    async function fetchData() {
      const collections = ['products', 'inventory', 'sales']
      const result: any = {}
      
      for (const col of collections) {
        const snapshot = await getDocs(collection(db, col))
        result[col] = snapshot.size
      }
      
      setData(result)
    }
    fetchData()
  }, [])

  return (
    <div className="p-8">
      <h1>Datos en Firebase:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
```

## 🔄 Método 4: Comparar con Backup Local

```bash
# 1. Hacer backup de Firebase
npm run backup:firebase

# 2. Comparar con datos locales
# Los backups se guardan en backups/firebase/
```

## ✅ Checklist de Verificación

- [ ] Ejecutar `npm run verify:firebase`
- [ ] Revisar en Firebase Console
- [ ] Verificar que todas las colecciones tengan datos
- [ ] Comparar conteos con archivos JSON locales
- [ ] Probar lectura desde la aplicación

## 🚨 Problemas Comunes

### "No se encuentran documentos"
- Verifica que la migración se completó: `npm run migrate:firebase`
- Revisa las reglas de Firestore (deben permitir lectura)
- Verifica que estés en el proyecto correcto

### "Diferencia en conteos"
- Algunos documentos pueden tener IDs diferentes
- Verifica que la migración se completó sin errores
- Compara documentos específicos en Firebase Console

### "Error de permisos"
- Verifica que el Service Account tenga permisos
- Revisa las reglas de seguridad en Firestore
- Asegúrate de que Firestore esté habilitado

## 📞 Siguiente Paso

Una vez verificado que los datos están en Firebase:
1. Cambia `DB_MODE=hybrid` para probar
2. Prueba la aplicación en desarrollo
3. Cuando esté todo validado, cambia a `DB_MODE=firebase`

