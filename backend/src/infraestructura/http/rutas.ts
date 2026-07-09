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
      if (error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: error.issues });
      }
      return respuesta.status(400).send({ error: error.message });
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
      const orden = await aprobarOrdenUseCase.ejecutar({ ordenId: cuerpo.ordenId });

      // Si se aprobó con éxito, despachamos el producto (enviamos correo con los links)
      await despacharProductoUseCase.ejecutar({ ordenId: orden.id });

      return respuesta.status(200).send({ mensaje: 'Orden aprobada y productos despachados', orden });
    } catch (error: any) {
      servidor.log.error(error);
      if (error instanceof z.ZodError) {
        return respuesta.status(400).send({ error: error.issues });
      }
      return respuesta.status(400).send({ error: error.message });
    }
  });
}
