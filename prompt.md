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
* price: Decimal
* drive_url: String

Tabla Orders:
* id: UUID (Primary Key)
* customer_email: String
* product_id: UUID (Foreign Key a Products)
* status: String (Valores: PENDIENTE o APROBADO)

## Flujo de Negocio y Casos de Uso
1. Iniciar Compra: El frontend envia el email del comprador y el ID del producto. El backend crea la orden en estado PENDIENTE y devuelve la informacion necesaria para cobrar.
2. Procesar Webhook: La pasarela de pagos envia la confirmacion del deposito. El backend procesa esta notificacion y cambia el estado de la orden a APROBADO.
3. Despachar Producto: Al aprobarse la orden, el sistema recupera el drive_url del producto y dispara la logica para enviar un correo al customer_email. (La integracion real con la API de correos se hara luego, por ahora dejar un servicio falso o un console log).

## Restricciones de Seguridad y Reglas Especiales
* Sistema sin registro: No implementar autenticacion para compradores ni base de datos de usuarios.
* Links directos: No implementar esquemas de expiracion de URLs. Es aceptado por el negocio que el cliente pueda compartir el link final.
* Desacoplamiento: Toda la logica principal debe estar en los Use Cases, separada del framework HTTP y de la base de datos.
* Regla estricta de sintaxis: No usar acentos en el codigo generado, nombres de variables o comentarios. Evitar el uso de comillas simples o dobles en el codigo cuando sea posible.