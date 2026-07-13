import { Prisma } from '@prisma/client';
import { RepositorioOrdenes } from '../../dominio/repositorios/repositorio-ordenes.js';
import { RepositorioProductos } from '../../dominio/repositorios/repositorio-productos.js';
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
    private repositorioProductos: RepositorioProductos
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

    const [nombre, dominio] = solicitud.emailCliente.split('@');
    const emailOculto = `${nombre.charAt(0)}***@${dominio}`;

    // Simulación de correo con instrucciones de pago
    console.log(`========================================`);
    console.log(`[SIMULACION - CORREO DE INSTRUCCIONES DE PAGO]`);
    console.log(`Para: ${emailOculto}`);
    console.log(`Asunto: Datos para pagar tu compra`);
    console.log(`Mensaje: Hola! Has iniciado la compra de ${idsUnicos.length} libro(s) por un total de $${total.toString()}.`);
    console.log(`Por favor, deposita o transfiere a esta cuenta bancaria:`);
    console.log(`CBU: 1234567890123456789012`);
    console.log(`Alias: MI.TIENDA.LIBROS`);
    console.log(`Una vez recibamos el pago, te enviaremos los links de descarga.`);
    console.log(`========================================`);

    return {
      orden: nuevaOrden,
      mensaje: 'Orden creada exitosamente. Te hemos enviado un correo con las instrucciones de pago.',
    };
  }
}
