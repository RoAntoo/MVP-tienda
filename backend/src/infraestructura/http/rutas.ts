import { FastifyInstance } from 'fastify';
import * as crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../base-datos/prisma-cliente.js';
import { RepositorioProductosPrisma } from '../base-datos/repositorio-productos-prisma.js';
import { RepositorioOrdenesPrisma } from '../base-datos/repositorio-ordenes-prisma.js';
import { RepositorioPromocionesPrisma } from '../base-datos/repositorio-promociones-prisma.js';
import { RepositorioSolicitudesPrisma } from '../base-datos/repositorio-solicitudes-prisma.js';
import { RepositorioSuscriptoresPrisma } from '../base-datos/repositorio-suscriptores-prisma.js';
import { ServicioEmailNodemailer } from '../servicios/servicio-email-nodemailer.js';
import { ServicioEmailDummy } from '../servicios/servicio-email-dummy.js';
import { IniciarCompraUseCase } from '../../aplicacion/casos-uso/iniciar-compra.js';
import { AprobarOrdenUseCase } from '../../aplicacion/casos-uso/aprobar-orden.js';
import { EliminarOrdenUseCase } from '../../aplicacion/casos-uso/eliminar-orden.js';
import { GestionarPromocionesUseCase } from '../../aplicacion/casos-uso/gestionar-promociones.js';
import { DespacharProductoUseCase } from '../../aplicacion/casos-uso/despachar-producto.js';
import { CrearProductoUseCase } from '../../aplicacion/casos-uso/crear-producto.js';
import { EliminarProductoUseCase } from '../../aplicacion/casos-uso/eliminar-producto.js';
import { ActualizarProductoUseCase } from '../../aplicacion/casos-uso/actualizar-producto.js';
import { ObtenerProductosUseCase } from '../../aplicacion/casos-uso/obtener-productos.js';
import { SolicitarLibrosUseCase } from '../../aplicacion/casos-uso/solicitar-libros.js';
import { ResponderSolicitudUseCase } from '../../aplicacion/casos-uso/responder-solicitud.js';
import { ObtenerSolicitudesUseCase } from '../../aplicacion/casos-uso/obtener-solicitudes.js';
import { NotificarSubidaUseCase } from '../../aplicacion/casos-uso/notificar-subida.js';
import { SuscribirseCatalogoUseCase } from '../../aplicacion/casos-uso/suscribirse-catalogo.js';
import { OutboxProcessor } from '../trabajos/outbox-processor.js';
import { validarTokenAprobacion } from '../seguridad/tokens.js';
import escapeHtml from 'escape-html';

// Helpers
function verificarApiKeyAdmin(peticion: any, respuesta: any, adminApiKey: string): boolean {
  const rawKey = peticion.headers['x-api-key'];
  const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;

  // Comparación en tiempo constante para no filtrar la clave por timing
  const recibida = Buffer.from(apiKey || '', 'utf8');
  const esperada = Buffer.from(adminApiKey, 'utf8');
  const esValida = recibida.length === esperada.length && crypto.timingSafeEqual(recibida, esperada);

  if (!esValida) {
    respuesta.status(401).send({ error: 'No autorizado. API_KEY inválida' });
    return false;
  }

  return true;
}

// Límites de rate limiting por tipo de endpoint (anti-spam / anti-fuerza-bruta)
const limiteCompras = { rateLimit: { max: 10, timeWindow: '1 minute' } };
const limiteSolicitudesPublico = { rateLimit: { max: 5, timeWindow: '1 minute' } };
const limiteAdmin = { rateLimit: { max: 30, timeWindow: '1 minute' } };

// Esquemas de validación Zod
const EsquemaIniciarCompra = z.object({
  emailCliente: z.string().email('Debe ser un correo electrónico válido'),
  productoIds: z.array(z.string().uuid('IDs de productos inválidos')).min(1, 'El carrito debe tener al menos un producto'),
});

const EsquemaAprobarOrden = z.object({
  ordenId: z.string().uuid('ID de orden inválido'),
});

const EsquemaEliminarOrdenes = z.object({
  ids: z.array(z.string().uuid('IDs de orden inválidos')).min(1).max(100),
});

const EsquemaCrearProducto = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  precio: z.number().positive('El precio debe ser positivo'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  categoria: z.string().optional().transform(val => (!val || val.trim() === '') ? 'General' : val.trim()),
  imagenUrl: z.string().url('Debe ser una URL válida'),
  driveUrl: z.string().url('Debe ser una URL válida'),
  cantidad: z.number().int().positive('La cantidad debe ser un entero positivo').optional().default(1),
});

const EsquemaActualizarProducto = z.object({
  titulo: z.string().min(1, 'El título no puede estar vacío').optional(),
  precio: z.number().positive('El precio debe ser positivo').optional(),
  descripcion: z.string().min(1, 'La descripción no puede estar vacía').optional(),
  categoria: z.string().optional().transform(val => val === undefined ? undefined : (val.trim() === '' ? 'General' : val.trim())),
  imagenUrl: z.string().url('Debe ser una URL válida').optional(),
  driveUrl: z.string().url('Debe ser una URL válida').optional(),
  cantidad: z.number().int().positive('La cantidad debe ser un entero positivo').optional(),
}).refine(data => Object.keys(data).length > 0, 'Se requiere al menos un campo para actualizar');

const EsquemaConsultarProductosQuery = z.object({
  campo: z.enum(['precio', 'titulo', 'createdAt', 'cantidad']).optional(),
  direccion: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
  page: z.coerce.number().int().positive().max(10000).optional(),
  busqueda: z.string().trim().max(100).optional(),
  soloPromociones: z.preprocess(value => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }, z.boolean().optional()),
  categorias: z.string().optional().transform(val => {
    if (!val) return undefined;
    const cats = val.split(',').map(s => s.trim()).filter(Boolean);
    return cats.slice(0, 20);
  })
});

const EsquemaConsultarOrdenesQuery = z.object({
  campo: z.enum(['email', 'total', 'id']).optional(),
  direccion: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
  page: z.coerce.number().int().positive().max(10000).default(1),
});

const EsquemaCrearPromocion = z.object({
  nombre: z.string().trim().min(1).max(100),
  tipo: z.enum(['PRECIO_UNITARIO', 'PORCENTAJE']),
  valor: z.number().positive(),
  productoIds: z.array(z.string().uuid()).min(1).max(100),
  fechaFin: z.coerce.date().nullable().optional(),
});

const EsquemaActualizarPromocion = EsquemaCrearPromocion.partial().extend({
  activa: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, 'Debe indicar al menos un campo');

const EsquemaSolicitudLibro = z.object({
  emailCliente: z.string().email('Debe ser un correo electrónico válido'),
  mensaje: z.string().min(5, 'El mensaje debe tener al menos 5 caracteres').max(1000, 'Mensaje muy largo')
});

const EsquemaSuscripcion = z.object({
  email: z.string().trim().email('Debe ser un correo electrónico válido'),
});

export async function rutas(servidor: FastifyInstance) {
  // --- VALIDACIÓN DE VARIABLES CRÍTICAS (FAIL-FAST) ---
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
  if (!ADMIN_API_KEY) {
    servidor.log.error('CRITICAL: ADMIN_API_KEY no está configurada.');
    throw new Error('ADMIN_API_KEY no está configurada.');
  }

  const TOKEN_SIGNING_SECRET = process.env.TOKEN_SIGNING_SECRET;
  if (!TOKEN_SIGNING_SECRET) {
    servidor.log.error('CRITICAL: TOKEN_SIGNING_SECRET no está configurada.');
    throw new Error('TOKEN_SIGNING_SECRET no está configurada.');
  }

  // 1. Inicializar Repositorios y Servicios
  const repositorioProductos = new RepositorioProductosPrisma(prisma);
  const repositorioOrdenes = new RepositorioOrdenesPrisma(prisma);
  const repositorioPromociones = new RepositorioPromocionesPrisma(prisma);
  const repositorioSolicitudes = new RepositorioSolicitudesPrisma(prisma);
  const repositorioSuscriptores = new RepositorioSuscriptoresPrisma(prisma);

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const adminEmail = process.env.ADMIN_EMAIL || emailUser || 'admin@localhost';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  const servicioEmail = (emailUser && emailPass)
    ? new ServicioEmailNodemailer(emailUser, emailPass, TOKEN_SIGNING_SECRET, backendUrl)
    : new ServicioEmailDummy();

  if (!emailUser || !emailPass) {
    console.warn('⚠️ No se encontraron EMAIL_USER o EMAIL_PASS. Los correos no se enviarán de forma real.');
  }

  const outboxProcessor = new OutboxProcessor(prisma, servicioEmail, adminEmail, backendUrl);
  outboxProcessor.start(10000);

  servidor.addHook('onClose', (instance, done) => {
    outboxProcessor.stop();
    done();
  });

  // 2. Inicializar Casos de Uso
  const iniciarCompraUseCase = new IniciarCompraUseCase(repositorioOrdenes, repositorioProductos, servicioEmail, adminEmail);
  const aprobarOrdenUseCase = new AprobarOrdenUseCase(repositorioOrdenes, repositorioProductos, servicioEmail);
  const eliminarOrdenUseCase = new EliminarOrdenUseCase(repositorioOrdenes);
  const gestionarPromocionesUseCase = new GestionarPromocionesUseCase(repositorioPromociones);
  const despacharProductoUseCase = new DespacharProductoUseCase(repositorioOrdenes);
  const crearProductoUseCase = new CrearProductoUseCase(repositorioProductos);
  const eliminarProductoUseCase = new EliminarProductoUseCase(repositorioProductos);
  const actualizarProductoUseCase = new ActualizarProductoUseCase(repositorioProductos);
  const obtenerProductosUseCase = new ObtenerProductosUseCase(repositorioProductos);
  const solicitarLibrosUseCase = new SolicitarLibrosUseCase(repositorioSolicitudes);
  const responderSolicitudUseCase = new ResponderSolicitudUseCase(repositorioSolicitudes);
  const obtenerSolicitudesUseCase = new ObtenerSolicitudesUseCase(repositorioSolicitudes);
  const notificarSubidaUseCase = new NotificarSubidaUseCase(repositorioSolicitudes);
  const suscribirseCatalogoUseCase = new SuscribirseCatalogoUseCase(repositorioSuscriptores);

  // Endpoint 1: Iniciar Compra (Carrito)
  servidor.post('/compras', { config: limiteCompras }, async (peticion, respuesta) => {
    try {
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
      const query = EsquemaConsultarProductosQuery.parse(peticion.query);
      const limit = query.limit;
      const offset = (query.limit && query.page) ? (query.page - 1) * query.limit : undefined;
      
      if (offset && offset > Number.MAX_SAFE_INTEGER) {
        return respuesta.status(400).send({ error: [{ message: 'El offset excede el límite máximo permitido' }] });
      }

      const productos = await obtenerProductosUseCase.ejecutar({
        ...query,
        limit,
        offset,
        busqueda: query.busqueda
      });
      return respuesta.status(200).send(productos);
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: error.issues });
      }
      return respuesta.status(500).send({ error: 'Error al obtener el catálogo.' });
    }
  });

  // Endpoint 1.6: Obtener Categorías Únicas
  servidor.get('/categorias', async (peticion, respuesta) => {
    try {
      const categorias = await prisma.producto.findMany({
        select: { categoria: true },
        distinct: ['categoria']
      });
      const categoriasArray = categorias.map(c => c.categoria).filter(Boolean);
      return respuesta.status(200).send(categoriasArray);
    } catch (error: any) {
      servidor.log.error(error);
      return respuesta.status(500).send({ error: 'Error al obtener las categorías.' });
    }
  });

  // Endpoint 1.7: Solicitar Libros
  servidor.post('/solicitudes', { config: limiteSolicitudesPublico }, async (peticion, respuesta) => {
    try {
      const cuerpo = EsquemaSolicitudLibro.parse(peticion.body);
      const resultado = await solicitarLibrosUseCase.ejecutar(cuerpo);
      return respuesta.status(200).send(resultado);
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: error.issues });
      }
      return respuesta.status(500).send({ error: 'Error al enviar la solicitud.' });
    }
  });

  // Endpoint 2: Aprobar Orden Manual (Admin)
  servidor.post('/admin/ordenes/aprobar', { config: limiteAdmin }, async (peticion, respuesta) => {
    try {
      if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;

      const cuerpo = EsquemaAprobarOrden.parse(peticion.body);
      const resultadoAprobacion = await aprobarOrdenUseCase.ejecutar({ ordenId: cuerpo.ordenId });

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

  // Endpoint 2.5: Aprobar Orden (Magic Link GET - Vista de Confirmación)
  servidor.get('/admin/ordenes/aprobar-magico', async (peticion, respuesta) => {
    try {
      const { ordenId, token } = peticion.query as { ordenId?: string, token?: string };

      if (!ordenId || !token || !validarTokenAprobacion(token, ordenId, TOKEN_SIGNING_SECRET)) {
        return respuesta.type('text/html').send('<h1>Acceso Denegado</h1><p>Enlace mágico inválido o expirado.</p>');
      }

      const safeOrdenId = escapeHtml(String(ordenId || ''));
      const safeToken = escapeHtml(String(token || ''));

      const html = `
        <div style="font-family: monospace; padding: 40px; text-align: center; background: #0d0d12; color: #f0f0f0; height: 100vh;">
          <h1 style="color: #ff2a85;">> CONFIRMAR APROBACIÓN</h1>
          <h2>Orden #${safeOrdenId.substring(0, 8)}</h2>
          <p>¿Estás seguro de que deseas aprobar esta orden y enviar los libros?</p>
          <button id="btn" style="background-color: #ff2a85; color: white; padding: 15px 30px; border: none; cursor: pointer; font-weight: bold; border-radius: 5px; font-size: 16px;">
            [ CONFIRMAR APROBACIÓN DE ORDEN ]
          </button>
          <script>
            document.getElementById('btn').addEventListener('click', function () {
              const btn = document.getElementById('btn');
              btn.innerText = 'PROCESANDO...';
              btn.disabled = true;
              fetch('/admin/ordenes/aprobar-magico', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ordenId: '${safeOrdenId}', token: '${safeToken}' })
              })
              .then(res => res.text())
              .then(html => {
                document.body.innerHTML = html;
              })
              .catch(err => alert('Error: ' + err));
            });
          </script>
        </div>
      `;
      return respuesta.type('text/html').send(html);
    } catch (error: any) {
      servidor.log.error(error);
      return respuesta.type('text/html').send(`<h1>Error</h1><p>${escapeHtml(String(error.message || 'Error desconocido'))}</p>`);
    }
  });

  // Endpoint 2.6: Aprobar Orden (Magic Link POST - Mutación)
  servidor.post('/admin/ordenes/aprobar-magico', async (peticion, respuesta) => {
    try {
      const { ordenId, token } = peticion.body as { ordenId?: string, token?: string };

      if (!ordenId || !token || !validarTokenAprobacion(token, ordenId, TOKEN_SIGNING_SECRET)) {
        return respuesta.type('text/html').send('<h1>Acceso Denegado</h1><p>Enlace mágico inválido o expirado.</p>');
      }

      const resultadoAprobacion = await aprobarOrdenUseCase.ejecutar({ ordenId });
      
      if (resultadoAprobacion.orden.estado === 'APROBADO') {
        await despacharProductoUseCase.ejecutar({ ordenId: resultadoAprobacion.orden.id });
      }

      const safeOrdenId = escapeHtml(String(ordenId || ''));
      const safeEmail = escapeHtml(String(resultadoAprobacion.orden.emailCliente || ''));

      const html = `
        <div style="font-family: monospace; padding: 40px; text-align: center; background: #0d0d12; color: #00f0ff; height: 100vh;">
          <h1 style="color: #ff2a85;">> CONFIRMACION_EXITOSA_</h1>
          <h2>¡La orden #${safeOrdenId.substring(0, 8)} ha sido APROBADA!</h2>
          <p>Los libros fueron liberados y enviados al cliente ${safeEmail}.</p>
          <a href="http://localhost:5173" style="color: white; margin-top: 20px; display: inline-block;">Cerrar ventana</a>
        </div>
      `;
      return respuesta.type('text/html').send(html);
    } catch (error: any) {
      servidor.log.error(error);
      return respuesta.type('text/html').send(`<h1>Error</h1><p>${escapeHtml(String(error.message || 'Error desconocido'))}</p>`);
    }
  });

  // Endpoint 2.7: Responder a Solicitud de Libro desde Email (Admin)
  servidor.get('/admin/solicitudes/responder', async (peticion, respuesta) => {
    try {
      const { solicitudId, existe, token } = peticion.query as { solicitudId?: string, existe?: string, token?: string };
      
      if (!solicitudId || !existe || !token) {
        return respuesta.status(400).send({ error: 'Faltan parámetros en la URL' });
      }

      // No ejecutamos la mutación en GET, solo devolvemos una página de confirmación con script
      respuesta.type('text/html');
      return respuesta.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Confirmar Respuesta</title>
          <style>
            body { font-family: sans-serif; text-align: center; margin-top: 50px; background: #0d0d12; color: #fff; }
            .btn { padding: 12px 24px; font-size: 16px; background-color: #00f0ff; color: #0d0d12; border: none; cursor: pointer; font-weight: bold; border-radius: 4px; }
            .btn:hover { background-color: #00c0cc; }
            #status { margin-top: 20px; color: #4CAF50; font-size: 18px; }
            .error { color: #ff2a85 !important; }
          </style>
        </head>
        <body>
          <h2>¿Deseas enviar esta respuesta al cliente?</h2>
          <p>La solicitud original del cliente será respondida con: <strong>${existe === 'true' ? 'SÍ LO TENEMOS' : 'NO LO TENEMOS'}</strong></p>
          <button id="confirmBtn" class="btn">Confirmar y Enviar</button>
          <p id="status"></p>
          <script>
            document.getElementById('confirmBtn').addEventListener('click', async () => {
              const btn = document.getElementById('confirmBtn');
              const statusEl = document.getElementById('status');
              btn.disabled = true;
              btn.innerText = 'Enviando...';
              
              try {
                const res = await fetch('/admin/solicitudes/responder', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    solicitudId: '${escapeHtml(solicitudId)}',
                    existe: '${escapeHtml(existe)}',
                    token: '${escapeHtml(token)}'
                  })
                });
                const data = await res.json();
                if (res.ok) {
                  statusEl.innerText = '✅ ' + data.mensaje;
                  btn.style.display = 'none';
                } else {
                  statusEl.innerText = '❌ ' + (data.error || 'Error desconocido');
                  statusEl.classList.add('error');
                  btn.disabled = false;
                  btn.innerText = 'Reintentar';
                }
              } catch (err) {
                statusEl.innerText = '❌ Error de red';
                statusEl.classList.add('error');
                btn.disabled = false;
                btn.innerText = 'Reintentar';
              }
            });
          </script>
        </body>
        </html>
      `);
    } catch (error: any) {
      servidor.log.error(error);
      return respuesta.status(500).send('Error interno');
    }
  });

  servidor.post('/admin/solicitudes/responder', async (peticion, respuesta) => {
    try {
      const { solicitudId, existe, token } = peticion.body as { solicitudId?: string, existe?: string, token?: string };
      
      if (!solicitudId || !existe || !token) {
        return respuesta.status(400).send({ error: 'Faltan parámetros' });
      }

      await responderSolicitudUseCase.ejecutar({
        solicitudId,
        existe,
        token,
        apiKeySecret: TOKEN_SIGNING_SECRET
      });

      return respuesta.status(200).send({ mensaje: 'Respuesta enviada con éxito al cliente.' });
    } catch (error: any) {
      servidor.log.error(error);
      return respuesta.status(400).send({ error: error.message || 'El enlace puede haber expirado o es inválido.' });
    }
  });

  // Endpoint 3: Obtener Todas las Órdenes (Admin)
  servidor.get('/admin/ordenes', { config: limiteAdmin }, async (peticion, respuesta) => {
    try {
      if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
      const query = EsquemaConsultarOrdenesQuery.parse(peticion.query);
      const offset = (query.page - 1) * query.limit;
      const resultado = await repositorioOrdenes.obtenerTodas({
        campo: query.campo,
        direccion: query.direccion,
        limit: query.limit,
        offset,
      });
      return respuesta.status(200).send(resultado);
    } catch (error: any) {
      servidor.log.error(error);
      if (error instanceof z.ZodError || error?.name === 'ZodError') {
        return respuesta.status(400).send({ error: error.issues });
      }
      return respuesta.status(500).send({ error: 'Error al obtener las órdenes.' });
    }
  });

  // Endpoint 3.5: Eliminar Orden (Admin)
  servidor.delete('/admin/ordenes/:id', { config: limiteAdmin }, async (peticion, respuesta) => {
    try {
      if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
      const EsquemaParams = z.object({
        id: z.string().uuid('ID de orden inválido')
      });
      const { id } = EsquemaParams.parse(peticion.params);

      await eliminarOrdenUseCase.ejecutar(id);
      return respuesta.status(204).send(); // 204 No Content
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: 'ID de orden inválido' });
      }
      if (error.code === 'P2025' || error.message === 'Orden no encontrada') {
        return respuesta.status(404).send({ error: 'Orden no encontrada' });
      }
      return respuesta.status(500).send({ error: 'Error al eliminar la orden.' });
    }
  });

  servidor.post('/suscripciones', { config: limiteSolicitudesPublico }, async (peticion, respuesta) => {
    try {
      const cuerpo = EsquemaSuscripcion.parse(peticion.body);
      const resultado = await suscribirseCatalogoUseCase.ejecutar(cuerpo);
      return respuesta.status(200).send(resultado);
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: error.issues });
      }
      return respuesta.status(500).send({ error: 'Error al registrar la suscripción.' });
    }
  });

  servidor.get('/promociones/activas', async (_peticion, respuesta) => {
    try {
      const promociones = await gestionarPromocionesUseCase.listar();
      const ahora = new Date();
      return respuesta.status(200).send(promociones.filter(promocion => promocion.activa
        && promocion.fechaInicio <= ahora
        && (!promocion.fechaFin || promocion.fechaFin >= ahora)));
    } catch (error: any) {
      servidor.log.error(error);
      return respuesta.status(500).send({ error: 'Error al obtener las promociones activas.' });
    }
  });

  servidor.post('/admin/ordenes/eliminar-multiples', { config: limiteAdmin }, async (peticion, respuesta) => {
    try {
      if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
      const { ids } = EsquemaEliminarOrdenes.parse(peticion.body);
      const eliminadas = await eliminarOrdenUseCase.ejecutarVarias(ids);
      return respuesta.status(200).send({ eliminadas });
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: 'La selección de órdenes no es válida' });
      }
      return respuesta.status(500).send({ error: 'Error al eliminar las órdenes.' });
    }
  });

  // Promociones del catálogo (Admin)
  servidor.get('/admin/promociones', { config: limiteAdmin }, async (peticion, respuesta) => {
    try {
      if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
      return respuesta.status(200).send(await gestionarPromocionesUseCase.listar());
    } catch (error: any) {
      servidor.log.error(error);
      return respuesta.status(500).send({ error: 'Error al obtener las promociones.' });
    }
  });

  servidor.post('/admin/promociones', { config: limiteAdmin }, async (peticion, respuesta) => {
    try {
      if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
      const datos = EsquemaCrearPromocion.parse(peticion.body);
      return respuesta.status(201).send(await gestionarPromocionesUseCase.crear(datos));
    } catch (error: any) {
      servidor.log.error(error);
      if (error instanceof z.ZodError || error?.name === 'ZodError') return respuesta.status(400).send({ error: error.issues });
      if (error.message.includes('promoción') || error.message.includes('porcentaje') || error.message.includes('valor')) return respuesta.status(400).send({ error: error.message });
      return respuesta.status(500).send({ error: 'Error al crear la promoción.' });
    }
  });

  servidor.put('/admin/promociones/:id', { config: limiteAdmin }, async (peticion, respuesta) => {
    try {
      if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(peticion.params);
      const datos = EsquemaActualizarPromocion.parse(peticion.body);
      return respuesta.status(200).send(await gestionarPromocionesUseCase.actualizar(id, datos));
    } catch (error: any) {
      servidor.log.error(error);
      if (error instanceof z.ZodError || error?.name === 'ZodError') return respuesta.status(400).send({ error: error.issues });
      if (error.message.includes('promoción') || error.message.includes('porcentaje') || error.message.includes('valor')) return respuesta.status(400).send({ error: error.message });
      return respuesta.status(500).send({ error: 'Error al actualizar la promoción.' });
    }
  });

  servidor.delete('/admin/promociones/:id', { config: limiteAdmin }, async (peticion, respuesta) => {
    try {
      if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(peticion.params);
      await gestionarPromocionesUseCase.eliminar(id);
      return respuesta.status(204).send();
    } catch (error: any) {
      servidor.log.error(error);
      if (error instanceof z.ZodError || error?.name === 'ZodError') return respuesta.status(400).send({ error: error.issues });
      return respuesta.status(500).send({ error: 'Error al eliminar la promoción.' });
    }
  });

  // Endpoint 4: Obtener Todos los Productos (Admin)
  servidor.get('/admin/productos', { config: limiteAdmin }, async (peticion, respuesta) => {
    try {
      if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
      const query = EsquemaConsultarProductosQuery.parse(peticion.query);
      const limit = query.limit;
      const offset = (query.limit && query.page) ? (query.page - 1) * query.limit : undefined;
      
      if (offset && offset > Number.MAX_SAFE_INTEGER) {
        return respuesta.status(400).send({ error: [{ message: 'El offset excede el límite máximo permitido' }] });
      }

      const productos = await obtenerProductosUseCase.ejecutar({
        ...query,
        limit,
        offset
      });
      return respuesta.status(200).send(productos);
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: error.issues });
      }
      return respuesta.status(500).send({ error: 'Error al obtener los productos.' });
    }
  });

  // Endpoint 5: Crear Producto (Admin)
  servidor.post('/admin/productos', { config: limiteAdmin }, async (peticion, respuesta) => {
    try {
      if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
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
  servidor.delete('/admin/productos/:id', { config: limiteAdmin }, async (peticion, respuesta) => {
    try {
      if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
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
  servidor.put('/admin/productos/:id', { config: limiteAdmin }, async (peticion, respuesta) => {
    try {
      if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
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

  // Endpoint 7: Obtener Todas las Solicitudes (Admin)
  servidor.get('/admin/solicitudes', { config: limiteAdmin }, async (peticion, respuesta) => {
    if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
    try {
      const EsquemaPaginacion = z.object({
        limit: z.coerce.number().int().positive().max(100).default(10),
        offset: z.coerce.number().int().nonnegative().default(0)
      }).strict();
      
      const { limit, offset } = EsquemaPaginacion.parse(peticion.query);
      
      const resultado = await obtenerSolicitudesUseCase.ejecutar(limit, offset);
      return respuesta.status(200).send(resultado);
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: error.issues });
      }
      return respuesta.status(500).send({ error: 'Error al obtener las solicitudes.' });
    }
  });

  // Endpoint 8: Notificar Subida de Libro (Admin)
  servidor.post('/admin/solicitudes/:id/notificar', { config: limiteAdmin }, async (peticion, respuesta) => {
    if (!verificarApiKeyAdmin(peticion, respuesta, ADMIN_API_KEY)) return;
    try {
      const { id } = peticion.params as { id: string };
      const resultado = await notificarSubidaUseCase.ejecutar(id);
      return respuesta.status(200).send(resultado);
    } catch (error: any) {
      servidor.log.error(error);
      return respuesta.status(400).send({ error: error.message || 'Error al notificar subida.' });
    }
  });
}
