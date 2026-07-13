import { Prisma } from '@prisma/client';
import { RepositorioOrdenes } from '../../dominio/repositorios/repositorio-ordenes.js';
import { RepositorioProductos } from '../../dominio/repositorios/repositorio-productos.js';
import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { Orden } from '../../dominio/entidades/orden.js';
import { Producto } from '../../dominio/entidades/producto.js';

export interface SolicitudIniciarCompra {
  emailCliente: string;
  productoIds: string[];
}

export interface RespuestaIniciarCompra {
  orden: Orden;
  mensaje: string;
}

export class IniciarCompraUseCase {
  constructor(
    private repositorioOrdenes: RepositorioOrdenes,
    private repositorioProductos: RepositorioProductos,
    private servicioEmail: ServicioEmail,
    private adminEmail?: string
  ) {}

  async ejecutar(solicitud: SolicitudIniciarCompra): Promise<RespuestaIniciarCompra> {
    if (!solicitud.productoIds || solicitud.productoIds.length === 0) {
      throw new Error('El carrito está vacío.');
    }

    // Deduplicar productos para evitar comprar el mismo libro digital dos veces
    const idsUnicos = Array.from(new Set(solicitud.productoIds));

    // Obtener todos los productos en una sola consulta (batch)
    const productosValidos = await this.repositorioProductos.obtenerPorIds(idsUnicos);

    // Validar que todos los IDs solicitados existen
    if (productosValidos.length !== idsUnicos.length) {
      const idsEncontrados = productosValidos.map(p => p.id);
      const idFaltante = idsUnicos.find(id => !idsEncontrados.includes(id));
      throw new Error(`El producto con id ${idFaltante} no existe.`);
    }

    // Calcular el total
    const total = productosValidos.reduce(
      (acc, p) => acc.add(new Prisma.Decimal(p.precio as any)), 
      new Prisma.Decimal(0)
    );

    const nuevaOrden = await this.repositorioOrdenes.crear({
      emailCliente: solicitud.emailCliente,
      productoIds: idsUnicos,
      total,
      estado: 'PENDIENTE',
    });

    // Enviar correo con instrucciones de pago asíncronamente sin bloquear la respuesta
    this.servicioEmail.enviarInstruccionesPago(solicitud.emailCliente, total, idsUnicos.length).catch((err) => {
      console.error('Error enviando instrucciones de pago (asíncrono):', err);
    });

    // Notificar al administrador
    if (this.adminEmail) {
      this.servicioEmail.notificarNuevaOrdenAdmin(this.adminEmail, nuevaOrden, productosValidos).catch((err) => {
        console.error('Error enviando notificación al admin (asíncrono):', err);
      });
    }

    return {
      orden: nuevaOrden,
      mensaje: 'Orden creada exitosamente. Las instrucciones de pago llegarán a tu correo próximamente.',
    };
  }
}
