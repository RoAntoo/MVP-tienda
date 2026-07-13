import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../base-datos/prisma-cliente.js';
import { RepositorioProductosPrisma } from '../base-datos/repositorio-productos-prisma.js';
import { RepositorioOrdenesPrisma } from '../base-datos/repositorio-ordenes-prisma.js';
import { IniciarCompraUseCase } from '../../aplicacion/casos-uso/iniciar-compra.js';
import { AprobarOrdenUseCase } from '../../aplicacion/casos-uso/aprobar-orden.js';
import { DespacharProductoUseCase } from '../../aplicacion/casos-uso/despachar-producto.js';

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
  imagenUrl: z.string().url('Debe ser una URL válida'),
  driveUrl: z.string().url('Debe ser una URL válida'),
});

export async function rutas(servidor: FastifyInstance) {
  // 1. Inicializar Repositorios
  const repositorioProductos = new RepositorioProductosPrisma(prisma);
  const repositorioOrdenes = new RepositorioOrdenesPrisma(prisma);

  // 2. Inicializar Casos de Uso
  const iniciarCompraUseCase = new IniciarCompraUseCase(repositorioOrdenes, repositorioProductos);
  const aprobarOrdenUseCase = new AprobarOrdenUseCase(repositorioOrdenes);
  const despacharProductoUseCase = new DespacharProductoUseCase(repositorioOrdenes);

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
      const apiKey = peticion.headers['x-api-key'];
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
  // Endpoint 3: Obtener Todas las Órdenes (Admin)
  servidor.get('/admin/ordenes', async (peticion, respuesta) => {
    try {
      const apiKey = peticion.headers['x-api-key'];
      const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

      if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
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
      const apiKey = peticion.headers['x-api-key'];
      const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

      if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
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
      const apiKey = peticion.headers['x-api-key'];
      const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

      if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
        return respuesta.status(401).send({ error: 'No autorizado. API_KEY inválida' });
      }

      const cuerpo = EsquemaCrearProducto.parse(peticion.body);
      const nuevoProducto = await repositorioProductos.crear(cuerpo);
      
      return respuesta.status(201).send(nuevoProducto);
    } catch (error: any) {
      servidor.log.error(error);
      if (error.name === 'ZodError' || error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: error.issues });
      }
      return respuesta.status(500).send({ error: 'Error al crear el producto.' });
    }
  });
}
