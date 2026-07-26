# Pasculi

Marketplace de servicios locales para Barranquilla y Soledad. Registro de
clientes y proveedores, verificación de identidad con foto de perfil, selfie
y cédula, categorías/especialidades de servicio, y un panel de administrador
con dashboard, filtros y aprobación de proveedores.

## Cómo correrlo

Necesitas [Node.js](https://nodejs.org) 18 o superior instalado y un proyecto de
[Supabase](https://supabase.com) (gratis).

1. Copia `.env.example` a `.env` y completa `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` (Project Settings → API en tu proyecto de Supabase).
2. Corre el contenido de `supabase/schema.sql` en el SQL Editor de tu proyecto
   (crea las tablas, las políticas de seguridad y el bucket de fotos).
3. Crea el usuario administrador en Authentication → Users → Add user (correo +
   contraseña) — con eso entras al panel admin.

```bash
npm install
npm run dev
```

Abre la URL que te muestre la terminal (normalmente `http://localhost:5173`).
Funciona igual en celular, tablet o computador: el diseño es responsive.

Para generar la versión de producción:

```bash
npm run build
npm run preview
```

## Estructura del proyecto

```
src/
  data/categories.js        Ciudades disponibles (las categorías viven en Supabase)
  lib/supabaseClient.js     Cliente de Supabase (lee las variables de entorno)
  lib/storage.js            Toda la persistencia: consultas a Postgres y Storage
  lib/image.js               Utilidades: redimensionar fotos, validar campos, etc.
  components/
    Header.jsx, BottomNav.jsx, Icons.jsx
    Home.jsx                Landing con las dos rutas (cliente / proveedor)
    RegisterClient.jsx      Formulario de registro de cliente
    RegisterProvider.jsx    Formulario de registro de proveedor (fotos, categoría, ubicación)
    PhotoSlot.jsx            Input de foto reutilizable (galería / cámara)
    ProviderSuccess.jsx     Pantalla de éxito con el "carné" de proveedor
    admin/
      AdminLogin.jsx         Login real (Supabase Auth: correo + contraseña)
      AdminPanel.jsx         Dashboard, tabla de proveedores, clientes y categorías
      ProviderModal.jsx      Detalle de un proveedor con sus 3 fotos (URLs firmadas)
supabase/
  schema.sql                 Tablas, políticas de seguridad (RLS) y bucket de fotos
```

## Puntos importantes a saber

- **Backend real**: los datos viven en Postgres (tablas `providers`, `clients`,
  `categories`) y las fotos en un bucket privado de Supabase Storage. Cualquier
  dispositivo que abra la app ve los mismos datos — el admin sí ve desde su
  computador lo que un proveedor registró desde su celular.
- **Seguridad (RLS)**: cualquiera puede registrarse como cliente o proveedor
  (siempre queda en estado "pendiente"), pero solo el usuario admin autenticado
  puede leer la lista completa, aprobar/rechazar proveedores y editar
  categorías. Las fotos de verificación (selfie, cédula) solo las puede ver el
  admin autenticado, vía URLs firmadas que expiran a los 5 minutos.
- **Admin**: se autentica con Supabase Auth (correo + contraseña real), no con
  una clave fija en el código. Créalo desde el dashboard de Supabase en
  Authentication → Users.
- **Fotos**: se comprimen automáticamente en el navegador antes de subirlas
  (máx. 480px, calidad 60%) para que no pesen demasiado.

## Próximos pasos sugeridos

- Login real de proveedores y clientes con su celular (código por SMS o
  contraseña), en vez de solo un formulario de registro.
- Solicitud de servicio: que un cliente pueda contactar directamente a un
  proveedor aprobado.
- Calificaciones y reseñas de proveedores.
- Mapa real con las ubicaciones de los proveedores (Google Maps o
  Mapbox).
- Notificaciones cuando un proveedor es aprobado o rechazado.
