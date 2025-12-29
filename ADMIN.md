# Panel de Administración - Arándano Café Bar

## Acceso al Panel

1. Navega a `/admin` en tu sitio web
2. Ingresa la contraseña (por defecto: `gusoni`)
3. Para cambiar la contraseña, crea un archivo `.env.local` con:
   ```
   ADMIN_PASSWORD=tu_contraseña_segura
   ```

## Gestión de Productos

### Crear un Producto

1. Completa el formulario en la parte superior del panel
2. Campos requeridos:
   - **Nombre**: Nombre del producto
   - **Precio**: Precio en pesos colombianos (COP)
   - **Tipo**: Cafetería o Bebida
   - **Categoría**: Selecciona según el tipo
3. Campos opcionales:
   - **Stock**: Cantidad disponible (por defecto: 999)
   - **Tamaño**: Ej: "Copa 150ml", "Botella 750ml"
   - **URL de Imagen**: URL completa de la imagen del producto
   - **Descripción**: Descripción del producto
4. Haz clic en "Crear Producto"

### Editar un Producto

1. En la tabla de productos, haz clic en "Editar"
2. El formulario se llenará con los datos del producto
3. Modifica los campos necesarios
4. Haz clic en "Actualizar Producto"

### Eliminar un Producto

1. En la tabla de productos, haz clic en "Eliminar"
2. Confirma la eliminación

## Categorías Disponibles

### Cafetería
- Cafés Calientes
- Cafés Fríos
- Pastelería
- Combos

### Bebidas
- Cócteles
- Vinos
- Vodka
- Ginebra
- Tequila
- Whisky

## Notas Importantes

- Los productos con stock 0 o menor no se mostrarán en el sitio público
- Las imágenes deben ser URLs válidas (puedes usar servicios como Imgur, Cloudinary, etc.)
- Los cambios se guardan inmediatamente en el archivo `data/products.json`
- La sesión de administración dura 7 días

## Seguridad

- Cambia la contraseña por defecto en producción
- El panel solo es accesible con la contraseña correcta
- Considera usar variables de entorno para la contraseña en producción

