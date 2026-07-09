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

    let total = 0;
    const productosValidos: Producto[] = [];

    // Validar que todos los productos existan y sumar sus precios
    for (const id of idsUnicos) {
      const producto = await this.repositorioProductos.obtenerPorId(id);
      if (!producto) {
        throw new Error(`El producto con id ${id} no existe.`);
      }
      total += producto.precio;
      productosValidos.push(producto);
    }

    const nuevaOrden = await this.repositorioOrdenes.crear({
      emailCliente: solicitud.emailCliente,
      productoIds: idsUnicos,
      total,
      estado: 'PENDIENTE',
    });

    // Simulación de correo con instrucciones de pago
    console.log(`========================================`);
    console.log(`[SIMULACION - CORREO DE INSTRUCCIONES DE PAGO]`);
    console.log(`Para: ${solicitud.emailCliente}`);
    console.log(`Asunto: Datos para pagar tu compra`);
    console.log(`Mensaje: Hola! Has iniciado la compra de ${productosValidos.length} libro(s) por un total de $${total}.`);
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
