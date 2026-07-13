import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../base-datos/prisma-cliente.js';
import { RepositorioProductosPrisma } from '../base-datos/repositorio-productos-prisma.js';
import { RepositorioOrdenesPrisma } from '../base-datos/repositorio-ordenes-prisma.js';
import { ServicioEmailNodemailer } from '../servicios/servicio-email-nodemailer.js';
import { ServicioEmailDummy } from '../servicios/servicio-email-dummy.js';
import { IniciarCompraUseCase } from '../../aplicacion/casos-uso/iniciar-compra.js';
import { AprobarOrdenUseCase } from '../../aplicacion/casos-uso/aprobar-orden.js';
import { DespacharProductoUseCase } from '../../aplicacion/casos-uso/despachar-producto.js';
import { CrearProductoUseCase } from '../../aplicacion/casos-uso/crear-producto.js';
import { EliminarProductoUseCase } from '../../aplicacion/casos-uso/eliminar-producto.js';
import { ActualizarProductoUseCase } from '../../aplicacion/casos-uso/actualizar-producto.js';

// Esquemas de validación Zod
const EsquemaIniciarCompra = z.object({
  emailCliente: z.string().email('Debe ser un correo electrónico válido'),
  productoIds: z.array(z.string().uuid('IDs de productos inválidos')).min(1, 'El carrito debe tener al menos un producto'),
});

const EsquemaAprobarOrden = z.object({
  ordenId: z.string().uuid('ID de orden inválido'),
});

const EsquemaCrearProducto = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  precio: z.number().positive('El precio debe ser positivo'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  categoria: z.string().optional().transform(val => (!val || val.trim() === '') ? 'General' : val.trim()),
  imagenUrl: z.string().url('Debe ser una URL válida'),
  driveUrl: z.string().url('Debe ser una URL válida'),
});

const EsquemaActualizarProducto = z.object({
  titulo: z.string().min(1, 'El título no puede estar vacío').optional(),
  precio: z.number().positive('El precio debe ser positivo').optional(),
  descripcion: z.string().min(1, 'La descripción no puede estar vacía').optional(),
  categoria: z.string().optional().transform(val => val === undefined ? undefined : (val.trim() === '' ? 'General' : val.trim())),
  imagenUrl: z.string().url('Debe ser una URL válida').optional(),
  driveUrl: z.string().url('Debe ser una URL válida').optional(),
}).refine(data => Object.keys(data).length > 0, 'Se requiere al menos un campo para actualizar');

export async function rutas(servidor: FastifyInstance) {
  // 1. Inicializar Repositorios y Servicios
  const repositorioProductos = new RepositorioProductosPrisma(prisma);
  const repositorioOrdenes = new RepositorioOrdenesPrisma(prisma);

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const adminEmail = process.env.ADMIN_EMAIL || emailUser;
  const apiKeyEnv = process.env.ADMIN_API_KEY || '';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  const servicioEmail = (emailUser && emailPass)
    ? new ServicioEmailNodemailer(emailUser, emailPass, apiKeyEnv, backendUrl)
    : new ServicioEmailDummy();

  if (!emailUser || !emailPass) {
    console.warn('⚠️ No se encontraron EMAIL_USER o EMAIL_PASS. Los correos no se enviarán de forma real.');
  }

  // 2. Inicializar Casos de Uso
  const iniciarCompraUseCase = new IniciarCompraUseCase(repositorioOrdenes, repositorioProductos, servicioEmail, adminEmail);
  const aprobarOrdenUseCase = new AprobarOrdenUseCase(repositorioOrdenes, repositorioProductos, servicioEmail);
  const despacharProductoUseCase = new DespacharProductoUseCase(repositorioOrdenes);
  const crearProductoUseCase = new CrearProductoUseCase(repositorioProductos);
  const eliminarProductoUseCase = new EliminarProductoUseCase(repositorioProductos);
  const actualizarProductoUseCase = new ActualizarProductoUseCase(repositorioProductos);

  // Endpoint 1: Iniciar Compra (Carrito)
  servidor.post('/compras', async (peticion, respuesta) => {
    try {
      // Validar estrictamente el cuerpo con Zod
      const cuerpo = EsquemaIniciarCompra.parse(peticion.body);

      const resultado = await iniciarCompraUseCase.ejecutar(cuerpo);
      return respuesta.status(201).send(resultado);
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: error.issues });
      }
      if (error.message.includes('no existe') || error.message.includes('vacío')) {
        return respuesta.status(400).send({ error: error.message });
      }
      return respuesta.status(500).send({ error: 'Ocurrió un error interno en el servidor.' });
    }
  });

  // Endpoint 1.5: Obtener Catálogo Público
  servidor.get('/productos', async (peticion, respuesta) => {
    try {
      const productos = await repositorioProductos.obtenerTodos();
      return respuesta.status(200).send(productos);
    } catch (error) {
      servidor.log.error(error);
      return respuesta.status(500).send({ error: 'Error al obtener el catálogo.' });
    }
  });

  // Endpoint 2: Aprobar Orden Manual (Admin)
  servidor.post('/admin/ordenes/aprobar', async (peticion, respuesta) => {
    try {
      // Validar API_KEY
      const rawKey = peticion.headers['x-api-key'];
      const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
      const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

      if (!ADMIN_API_KEY) {
        return respuesta.status(500).send({ error: 'Falta configurar ADMIN_API_KEY en el servidor' });
      }

      if (apiKey !== ADMIN_API_KEY) {
        return respuesta.status(401).send({ error: 'No autorizado. API_KEY inválida' });
      }

      // Validar estrictamente el cuerpo con Zod
      const cuerpo = EsquemaAprobarOrden.parse(peticion.body);

      // Procesamos el pago (aprobamos la orden)
      const resultadoAprobacion = await aprobarOrdenUseCase.ejecutar({ ordenId: cuerpo.ordenId });

      // Intentamos despachar el producto si la orden está aprobada (idempotente)
      if (resultadoAprobacion.orden.estado === 'APROBADO') {
        await despacharProductoUseCase.ejecutar({ ordenId: resultadoAprobacion.orden.id });
      }

      return respuesta.status(200).send({
        mensaje: resultadoAprobacion.yaAprobada ? 'Orden ya estaba aprobada' : 'Orden aprobada y productos despachados',
        orden: resultadoAprobacion.orden
      });
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: error.issues });
      }
      if (error.message.includes('no existe') || error.message.includes('vacío')) {
        return respuesta.status(400).send({ error: error.message });
      }
      return respuesta.status(500).send({ error: 'Ocurrió un error interno en el servidor.' });
    }
  });

  // Endpoint 2.5: Aprobar Orden (Magic Link por GET)
  servidor.get('/admin/ordenes/aprobar-magico', async (peticion, respuesta) => {
    try {
      const { ordenId, key } = peticion.query as { ordenId?: string, key?: string };
      const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

      if (!ADMIN_API_KEY || key !== ADMIN_API_KEY) {
        return respuesta.type('text/html').send('<h1>Acceso Denegado</h1><p>Enlace mágico inválido o expirado.</p>');
      }

      if (!ordenId) {
        return respuesta.type('text/html').send('<h1>Error</h1><p>ID de orden faltante.</p>');
      }

      // Procesamos el pago (aprobamos la orden)
      const resultadoAprobacion = await aprobarOrdenUseCase.ejecutar({ ordenId });

      // Intentamos despachar el producto si la orden está aprobada
      if (resultadoAprobacion.orden.estado === 'APROBADO') {
        await despacharProductoUseCase.ejecutar({ ordenId: resultadoAprobacion.orden.id });
      }

      const html = `
        <div style="font-family: monospace; padding: 40px; text-align: center; background: #0d0d12; color: #00f0ff; height: 100vh;">
          <h1 style="color: #ff2a85;">> CONFIRMACION_EXITOSA_</h1>
          <h2>¡La orden #${ordenId.substring(0, 8)} ha sido APROBADA!</h2>
          <p>Los libros fueron liberados y enviados al cliente ${resultadoAprobacion.orden.emailCliente}.</p>
          <a href="http://localhost:5173" style="color: white; margin-top: 20px; display: inline-block;">Cerrar ventana</a>
        </div>
      `;
      return respuesta.type('text/html').send(html);
    } catch (error: any) {
      servidor.log.error(error);
      return respuesta.type('text/html').send(`<h1>Error</h1><p>${error.message}</p>`);
    }
  });

  // Endpoint 3: Obtener Todas las Órdenes (Admin)
  servidor.get('/admin/ordenes', async (peticion, respuesta) => {
    try {
      const rawKey = peticion.headers['x-api-key'];
      const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
      const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

      if (!ADMIN_API_KEY) {
        return respuesta.status(500).send({ error: 'Falta configurar ADMIN_API_KEY en el servidor' });
      }

      if (apiKey !== ADMIN_API_KEY) {
        return respuesta.status(401).send({ error: 'No autorizado. API_KEY inválida' });
      }

      const ordenes = await repositorioOrdenes.obtenerTodas();
      return respuesta.status(200).send(ordenes);
    } catch (error: any) {
      servidor.log.error(error);
      return respuesta.status(500).send({ error: 'Error al obtener las órdenes.' });
    }
  });

  // Endpoint 4: Obtener Todos los Productos (Admin)
  servidor.get('/admin/productos', async (peticion, respuesta) => {
    try {
      const rawKey = peticion.headers['x-api-key'];
      const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
      const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

      if (!ADMIN_API_KEY) {
        return respuesta.status(500).send({ error: 'Falta configurar ADMIN_API_KEY en el servidor' });
      }

      if (apiKey !== ADMIN_API_KEY) {
        return respuesta.status(401).send({ error: 'No autorizado. API_KEY inválida' });
      }

      const productos = await repositorioProductos.obtenerTodos();
      return respuesta.status(200).send(productos);
    } catch (error: any) {
      servidor.log.error(error);
      return respuesta.status(500).send({ error: 'Error al obtener los productos.' });
    }
  });
  // Endpoint 5: Crear Producto (Admin)
  servidor.post('/admin/productos', async (peticion, respuesta) => {
    try {
      const rawKey = peticion.headers['x-api-key'];
      const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
      const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

      if (!ADMIN_API_KEY) {
        return respuesta.status(500).send({ error: 'Falta configurar ADMIN_API_KEY en el servidor' });
      }

      if (apiKey !== ADMIN_API_KEY) {
        return respuesta.status(401).send({ error: 'No autorizado. API_KEY inválida' });
      }

      const cuerpo = EsquemaCrearProducto.parse(peticion.body);
      const nuevoProducto = await crearProductoUseCase.ejecutar(cuerpo);

      return respuesta.status(201).send(nuevoProducto);
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: error.issues });
      }
      return respuesta.status(500).send({ error: 'Error al crear el producto.' });
    }
  });
  // Endpoint 6: Eliminar Producto (Admin)
  servidor.delete('/admin/productos/:id', async (peticion, respuesta) => {
    try {
      const rawKey = peticion.headers['x-api-key'];
      const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
      const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

      if (!ADMIN_API_KEY) {
        return respuesta.status(500).send({ error: 'Falta configurar ADMIN_API_KEY en el servidor' });
      }

      if (apiKey !== ADMIN_API_KEY) {
        return respuesta.status(401).send({ error: 'No autorizado. API_KEY inválida' });
      }

      const EsquemaParams = z.object({
        id: z.string().trim().min(1, 'El ID del producto es requerido')
      });

      const { id } = EsquemaParams.parse(peticion.params);

      await eliminarProductoUseCase.ejecutar(id);
      return respuesta.status(204).send(); // 204 No Content
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: 'ID de producto inválido' });
      }
      if (error.code === 'P2025') {
        return respuesta.status(404).send({ error: 'Producto no encontrado' });
      }
      if (error.message === 'Producto no encontrado') {
        return respuesta.status(404).send({ error: error.message });
      }
      return respuesta.status(500).send({ error: 'Error al eliminar el producto.' });
    }
  });

  // Endpoint 7: Actualizar Producto (Admin)
  servidor.put('/admin/productos/:id', async (peticion, respuesta) => {
    try {
      const rawKey = peticion.headers['x-api-key'];
      const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
      const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

      if (!ADMIN_API_KEY) {
        return respuesta.status(500).send({ error: 'Falta configurar ADMIN_API_KEY en el servidor' });
      }

      if (apiKey !== ADMIN_API_KEY) {
        return respuesta.status(401).send({ error: 'No autorizado. API_KEY inválida' });
      }

      const EsquemaParams = z.object({
        id: z.string().trim().min(1, 'El ID del producto es requerido')
      });
      const { id } = EsquemaParams.parse(peticion.params);
      const cuerpo = EsquemaActualizarProducto.parse(peticion.body);

      const productoActualizado = await actualizarProductoUseCase.ejecutar({ id, ...cuerpo });

      return respuesta.status(200).send(productoActualizado);
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: error.issues });
      }
      if (error.message === 'Producto no encontrado' || error.code === 'P2025') {
        return respuesta.status(404).send({ error: 'Producto no encontrado' });
      }
      return respuesta.status(500).send({ error: 'Error al actualizar el producto.' });
    }
  });
}
