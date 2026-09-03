# Refactor del frontend

Actuá como arquitecto/a frontend senior. Refactorizá únicamente el directorio `frontend/` de este proyecto, sin cambiar el comportamiento visual ni funcional actual de la tienda y el panel de administración.

El backend está organizado con una arquitectura por capas (`dominio`, `aplicacion`, `infraestructura`). Quiero una estructura frontend equivalente, escalable y clara, usando TypeScript vanilla + Vite, sin incorporar React, Vue ni dependencias nuevas salvo que sean estrictamente necesarias.

## Objetivos

- Dividir los archivos monolíticos actuales `src/main.ts` y `src/admin.ts` en módulos pequeños y cohesivos.
- Mantener compatibles las páginas actuales: `index.html` y `admin.html`.
- Preservar todos los flujos existentes: catálogo, búsqueda, filtros, promociones, carrito, checkout, newsletter, solicitudes de libros y administración.
- No modificar contratos de la API ni rutas del backend.
- Mantener el diseño actual y separar el CSS por responsabilidad sin introducir regresiones visuales.
- Evitar estado global mutable disperso; centralizarlo en stores o módulos de estado bien definidos.
- Añadir tipos compartidos y manejo consistente de errores de API.

## Estructura propuesta

```text
frontend/
└── src/
    ├── dominio/
    │   ├── entidades/
    │   │   ├── producto.ts
    │   │   ├── promocion.ts
    │   │   ├── orden.ts
    │   │   └── solicitud.ts
    │   └── contratos/
    │       └── api.ts
    │
    ├── aplicacion/
    │   ├── catalogo/
    │   │   ├── cargar-productos.ts
    │   │   ├── filtrar-productos.ts
    │   │   └── paginar-productos.ts
    │   ├── carrito/
    │   │   ├── agregar-producto.ts
    │   │   ├── actualizar-cantidad.ts
    │   │   └── calcular-total.ts
    │   ├── checkout/
    │   │   └── iniciar-compra.ts
    │   ├── suscripciones/
    │   │   └── suscribirse-catalogo.ts
    │   └── admin/
    │       ├── gestionar-productos.ts
    │       ├── gestionar-ordenes.ts
    │       ├── gestionar-promociones.ts
    │       └── gestionar-solicitudes.ts
    │
    ├── infraestructura/
    │   ├── http/
    │   │   ├── cliente-api.ts
    │   │   ├── productos-api.ts
    │   │   ├── ordenes-api.ts
    │   │   ├── promociones-api.ts
    │   │   ├── suscripciones-api.ts
    │   │   └── solicitudes-api.ts
    │   ├── storage/
    │   │   └── session-storage.ts
    │   └── configuracion/
    │       └── entorno.ts
    │
    ├── presentacion/
    │   ├── tienda/
    │   │   ├── main.ts
    │   │   ├── store.ts
    │   │   ├── inicializar-tienda.ts
    │   │   ├── componentes/
    │   │   │   ├── catalogo.ts
    │   │   │   ├── filtros.ts
    │   │   │   ├── carrito.ts
    │   │   │   ├── checkout.ts
    │   │   │   ├── promociones.ts
    │   │   │   ├── newsletter.ts
    │   │   │   └── toast.ts
    │   │   └── estilos/
    │   │       ├── base.css
    │   │       ├── layout.css
    │   │       ├── catalogo.css
    │   │       ├── carrito.css
    │   │       └── responsive.css
    │   │
    │   └── admin/
    │       ├── main.ts
    │       ├── store.ts
    │       ├── inicializar-admin.ts
    │       ├── componentes/
    │       │   ├── autenticacion.ts
    │       │   ├── productos.ts
    │       │   ├── ordenes.ts
    │       │   ├── promociones.ts
    │       │   ├── solicitudes.ts
    │       │   └── novedades.ts
    │       └── estilos/
    │           ├── base.css
    │           ├── layout.css
    │           ├── tablas.css
    │           └── responsive.css
    │
    └── shared/
        ├── dom.ts
        ├── formatters.ts
        ├── errores.ts
        └── validaciones.ts
```

## Criterios técnicos

- Cada módulo debe tener una sola responsabilidad.
- Los componentes de presentación no deben llamar directamente a `fetch`; deben usar casos de uso o adaptadores API.
- Definí tipos de request/response y entidades en archivos reutilizables.
- Centralizá `VITE_API_URL` en `infraestructura/configuracion/entorno.ts`.
- Usá funciones de render e inicialización explícitas; evitá listeners duplicados.
- Conservá las clases CSS y los `id` del HTML cuando sea posible, para no alterar el diseño.
- Si hay lógica compartida entre tienda y admin, moverla a `shared/`, `dominio/` o `infraestructura/`, según corresponda.
- No eliminar funcionalidades ni simplificar flujos para “hacer más fácil” el refactor.
- Verificá al final que `npm run build` en `frontend/` compile sin errores.

Antes de editar, inspeccioná el flujo actual y entregá un breve plan de migración. Después implementá el refactor por etapas y resumí los archivos creados, movidos y las decisiones relevantes.
