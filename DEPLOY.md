# Guía de Despliegue - Arándano Café Bar

## Preparación para Producción

### 1. Verificar Variables de Entorno

No se requieren variables de entorno para este proyecto, pero asegúrate de que:
- El número de WhatsApp (`573207909835`) esté correcto en todos los componentes
- Las rutas de imágenes estén correctas (`/images/logo.png`)

### 2. Build de Producción

```bash
# Instalar dependencias
npm install

# Crear build de producción
npm run build

# Verificar que el build sea exitoso
npm run start
```

### 3. Opciones de Despliegue

#### Vercel (Recomendado para Next.js)

1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Desplegar:**
```bash
vercel
```

3. **O conectar GitHub:**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu repositorio de GitHub
   - Vercel detectará automáticamente Next.js y desplegará

#### Netlify

1. **Instalar Netlify CLI:**
```bash
npm i -g netlify-cli
```

2. **Desplegar:**
```bash
npm run build
netlify deploy --prod --dir=.next
```

#### Otros Servicios

- **Railway:** Conecta el repositorio directamente
- **Render:** Selecciona Next.js como framework
- **AWS Amplify:** Conecta el repositorio

### 4. Checklist Pre-Despliegue

- [ ] Verificar que todas las imágenes están en `/public/images/`
- [ ] Probar todos los enlaces de navegación
- [ ] Verificar que el carrito funciona correctamente
- [ ] Probar el envío de pedidos por WhatsApp
- [ ] Revisar responsive en mobile y desktop
- [ ] Verificar que el logo se muestra correctamente
- [ ] Probar todas las páginas: Home, Tienda Virtual, Menús, Contacto

### 5. Optimizaciones de Producción

El proyecto ya incluye:
- ✅ Optimización de imágenes con `next/image`
- ✅ Code splitting automático
- ✅ CSS optimizado con Tailwind
- ✅ TypeScript para type safety
- ✅ Componentes optimizados

### 6. Monitoreo Post-Despliegue

- Revisar analytics (opcional: agregar Google Analytics)
- Monitorear errores en consola
- Verificar velocidad de carga
- Probar en diferentes dispositivos

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar servidor de producción
npm run start

# Linting
npm run lint
```

## Estructura del Proyecto

```
ARANDANO/
├── app/                    # App Router de Next.js
│   ├── page.tsx           # Página principal
│   ├── menu-cafes/        # Menú de cafés
│   ├── menu-bebidas/      # Menú de bebidas
│   ├── tienda-virtual/    # Tienda virtual
│   ├── contacto/          # Página de contacto
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
├── public/               # Archivos estáticos
│   └── images/           # Imágenes
└── package.json          # Dependencias
```

