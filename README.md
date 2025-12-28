# Arándano Café Bar

Landing page y tienda virtual para Arándano Café Bar en Pasto, Colombia.

Landing page profesional para Arándano Café Bar, un café y servicio de bebidas 24/7 ubicado en Pasto, Colombia, cerca de la zona universitaria.

## 🚀 Tecnologías

- **Next.js 14** - Framework React con App Router
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utility-first
- **Mobile-first** - Diseño responsive optimizado

## 📋 Características

- ✅ Hero section con CTA principal a WhatsApp
- ✅ Sección de servicios
- ✅ Sección "Cómo funciona" (paso a paso)
- ✅ Aviso legal visible
- ✅ Ubicación y horarios destacados
- ✅ Footer con enlaces sociales
- ✅ Botón flotante de WhatsApp
- ✅ Diseño oscuro con acentos berry (arándano)
- ✅ Optimizado para carga rápida
- ✅ SEO friendly

## 🛠️ Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Inicia el servidor de desarrollo:
```bash
npm run dev
```

3. Abre tu navegador en `http://localhost:3000`

## 📦 Build para producción

```bash
npm run build
npm start
```

## ⚙️ Personalización

### Agregar el Logo

1. Coloca tu logo en `/public/images/logo.png` (PNG o JPG)
2. Recomendado: Mínimo 800x800px para mejor calidad
3. El logo se mostrará automáticamente en la sección Hero
4. Si no existe el archivo, el logo se ocultará automáticamente

### Cambiar número de WhatsApp

Busca `573001234567` en los siguientes archivos y reemplázalo con tu número real:
- `components/Hero.tsx`
- `components/FloatingWhatsApp.tsx`
- `components/Footer.tsx`

**Formato del número:** Incluye código de país sin el símbolo `+` (ejemplo: `573001234567` para Colombia)

### Cambiar enlaces sociales

Edita los valores en `components/Footer.tsx`:
- `instagramUrl` - Tu perfil de Instagram
- `mapsUrl` - Tu ubicación en Google Maps

### Mensaje pre-llenado de WhatsApp

El mensaje se encuentra en `components/Hero.tsx` y `components/FloatingWhatsApp.tsx`:
```typescript
const whatsappMessage = encodeURIComponent('Hola, quiero hacer un pedido en Arándano Café Bar.')
```

## 🎨 Personalización de Colores

Los colores están definidos en `tailwind.config.js`. El color principal es `berry` con diferentes tonos:
- `berry-950` - Fondo oscuro principal
- `berry-900` - Fondo secundario
- `berry-800` - Cards y elementos
- `berry-700` - Bordes
- `berry-600` - Acentos
- `berry-300` - Texto destacado

## 📱 Responsive

La página está optimizada para:
- Móviles (320px+)
- Tablets (768px+)
- Desktop (1024px+)
- Large screens (1280px+)

## 📄 Estructura del Proyecto

```
├── app/
│   ├── layout.tsx       # Layout principal con metadata
│   ├── page.tsx         # Página principal
│   └── globals.css      # Estilos globales y Tailwind
├── components/
│   ├── Hero.tsx         # Sección hero con CTA y logo
│   ├── Services.tsx     # Servicios ofrecidos
│   ├── HowItWorks.tsx   # Proceso paso a paso
│   ├── LegalNotice.tsx  # Aviso legal
│   ├── LocationSchedule.tsx  # Ubicación y horarios
│   ├── Footer.tsx       # Footer con enlaces
│   ├── FloatingWhatsApp.tsx  # Botón flotante
│   └── WhatsAppIcon.tsx # Icono SVG de WhatsApp
├── public/
│   └── images/
│       └── logo.png     # Logo de Arándano Café Bar
├── tailwind.config.js   # Configuración de Tailwind
└── package.json
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Haz push de tu código a GitHub
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Vercel detectará automáticamente Next.js
4. ¡Deploy automático!

### Otras plataformas

Next.js se puede deployar en cualquier plataforma que soporte Node.js:
- Netlify
- AWS
- Railway
- DigitalOcean

## 📝 Licencia

© 2024 Arándano Café Bar. Todos los derechos reservados.
