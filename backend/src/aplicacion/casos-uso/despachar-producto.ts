import { RepositorioOrdenes } from '../../dominio/repositorios/repositorio-ordenes.js';
import { Orden } from '../../dominio/entidades/orden.js';

export interface SolicitudDespacharProducto {
  ordenId: string;
}

export class DespacharProductoUseCase {
  constructor(private repositorioOrdenes: RepositorioOrdenes) {}

  async ejecutar(solicitud: SolicitudDespacharProducto): Promise<{ orden: Orden }> {
    const orden = await this.repositorioOrdenes.obtenerPorId(solicitud.ordenId);

    if (!orden) {
      throw new Error(`La orden con id ${solicitud.ordenId} no existe.`);
    }

    if (orden.estado === 'DESPACHADO') {
      return { orden }; // Ya se despachó previamente, ignorar para evitar duplicados
    }

    if (orden.estado !== 'APROBADO') {
      throw new Error(`No se puede despachar la orden ${solicitud.ordenId} porque su estado es ${orden.estado}.`);
    }

    const productos = orden.productos || [];

    if (productos.length === 0) {
      throw new Error(`La orden no tiene productos asociados.`);
    }

    // Actualizar atómicamente a DESPACHADO (desde APROBADO)
    const resultadoActualizacion = await this.repositorioOrdenes.actualizarEstado(orden.id, 'APROBADO', 'DESPACHADO');
    
    if (resultadoActualizacion?.modificada) {
      const [nombre, dominio] = orden.emailCliente.split('@');
      const emailOculto = `${nombre.charAt(0)}***@${dominio}`;

      console.log(`========================================`);
      console.log(`[SIMULACION - SERVICIO DE NOTIFICACIONES]`);
      console.log(`Email de entrega enviado a: ${emailOculto}`);
      console.log(`Orden ID: ${orden.id}`);
      console.log(`Cantidad de productos despachados: ${productos.length}`);
      console.log(`========================================`);
    }

    const ordenActualizada = await this.repositorioOrdenes.obtenerPorId(solicitud.ordenId);
    return { orden: ordenActualizada! };
  }
}
