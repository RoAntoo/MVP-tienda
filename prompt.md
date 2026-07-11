# Prompt de Arquitectura Backend - Tienda de Productos Digitales

## Contexto del Proyecto
Necesito desarrollar el backend para un MVP de una tienda de productos digitales (enfocada en libros y mangas). El sistema debe ser simple, automatizado y no requiere registro de usuarios ni login. La entrega del producto final (un link directo de almacenamiento) se hara exclusivamente a traves de correo electronico una vez que el pago se apruebe de forma automatica.

## Stack Tecnologico
* Entorno: Node.js con TypeScript
* Framework HTTP: Fastify o Express
* Base de Datos: PostgreSQL
* ORM: Prisma o Drizzle ORM
* Arquitectura: Clean Architecture (Capas: Domain, Application, Infrastructure)

## Entidades y Modelo de Datos
Solo necesitamos dos tablas principales con IDs seguros para evitar iteraciones maliciosas.

Tabla Products:
* id: UUID (Primary Key)
* title: String
* Products: id, titulo, precio, driveUrl
- Orders: id, emailCliente, total, estado ('PENDIENTE', 'APROBADO', 'DESPACHADO'), productoIds (Relación N:M con Productos)

## Flujo de Negocio y Casos de Uso
1. El usuario envía un POST a `/compras` con su email y `productoIds`.
2. Se crea la orden con estado `'PENDIENTE'` y se responden los datos de transferencia.
3. El administrador envía un POST a `/admin/ordenes/aprobar` (protegido por `ADMIN_API_KEY`). Este paso ejecuta dos casos de uso de manera independiente e idempotente:
   - **Aprobar Orden:** Realiza la transición atómica de la orden de `'PENDIENTE'` a `'APROBADO'`.
   - **Despachar Producto:** Como paso posterior, envía un correo simulado con los links de drive al cliente y realiza la transición de `'APROBADO'` a `'DESPACHADO'`.

## Restricciones de Seguridad y Reglas Especiales
* Sistema sin registro: No implementar autenticacion para compradores ni base de datos de usuarios.
* Links directos: No implementar esquemas de expiracion de URLs. Es aceptado por el negocio que el cliente pueda compartir el link final.
* Desacoplamiento: Toda la logica principal debe estar en los Use Cases, separada del framework HTTP y de la base de datos.
* Regla estricta de sintaxis: No usar acentos en el codigo generado, nombres de variables o comentarios. Evitar el uso de comillas simples o dobles en el codigo cuando sea posible.